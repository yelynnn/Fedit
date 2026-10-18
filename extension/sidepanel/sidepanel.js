// 사이드패널: 지금 보고 있는 상품을 읽어 보여주고 → AI로 분석해 결과를 바로 보여주고 → 마음에 들면 내 보드에 저장한다.
import { api, AuthError, ApiError } from "../lib/api.js";
import { getTokens } from "../lib/tokens.js";
import { extractProduct } from "../lib/extract.js";
import { LOGIN_URL, BOARD_URL, PRICING_URL, productDetailUrl, POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from "../lib/config.js";

const $ = (id) => document.getElementById(id);
const LAST_BOARD_KEY = "feditLastBoardId";
const DEFAULT_BOARD_NAME = "크롬 확장";
const LIMIT_CODE = "EXTENSION_MONTHLY_LIMIT_EXCEEDED";

const state = {
  tabId: null,
  product: null,          // extractProduct() 결과
  readError: null,        // "permission" | "unsupported" | null
  readErrorDetail: "",
  usage: null,
  analyzing: false,       // 분석 요청 보내는 중
  saving: false,
  result: null,           // 분석 응답 { itemcode, source, status, analysis? }
  resultUrl: null,        // 결과가 어느 상품 URL 것인지
  pollToken: 0,
};

// ── DOM 도우미 (페이지 값이 HTML 로 해석되지 않게 textContent 로만 만든다) ──
function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : String(c));
  return n;
}
const openTab = (url) => chrome.tabs.create({ url });
// replaceChildren(null) 은 "null" 글자를 넣으므로 빈 값은 걸러서 채운다
const fill = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));

function show(view) {
  for (const v of ["loading", "login", "main"]) $(`view-${v}`).hidden = v !== view;
  if (view !== "main") $("usage").hidden = true;
}
function showError(msg) {
  $("error").textContent = msg || "";
  $("error").hidden = !msg;
}

// ── 시작 ─────────────────────────────────────────────────────────────
async function init() {
  show("loading");
  showError("");
  if (!(await getTokens())) return show("login");
  // 보드·사용량은 따로 실패할 수 있다(예: 사용량 API 배포 전) — 하나가 실패해도 나머지는 보여준다
  const [boardsR, usageR] = await Promise.allSettled([api.boards(), api.usage()]);
  if ([boardsR, usageR].some((r) => r.status === "rejected" && r.reason instanceof AuthError)) return show("login");
  show("main");
  if (boardsR.status === "fulfilled") await renderBoards(boardsR.value);
  renderUsage(usageR.status === "fulfilled" ? usageR.value : null);
  await refreshProduct();
}

function handleError(e) {
  if (e instanceof AuthError) return show("login");
  show("main");
  if (e instanceof ApiError && e.code === LIMIT_CODE) {
    state.usage = { ...(state.usage || {}), canAnalyze: false };
    renderUsage(state.usage);
    renderLimitReached(e.message);
    return;
  }
  showError(e && e.message ? e.message : "문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
}

// ── 사용량(월 분석 한도) ──────────────────────────────────────────────
function renderUsage(u) {
  state.usage = u;
  const pill = $("usage");
  if (!u) {
    pill.hidden = true;
  } else {
    pill.hidden = false;
    if (u.limited === false) {
      pill.textContent = "분석 무제한";
      pill.className = "pill";
    } else if (u.limit != null) {
      pill.textContent = `이번 달 분석 ${u.used}/${u.limit}`;
      pill.className = u.remaining <= 5 ? "pill warn" : "pill";
    }
  }
  updateButtons();
}
const limitReached = () => Boolean(state.usage && state.usage.canAnalyze === false);

function renderLimitReached(message) {
  const box = $("result");
  box.hidden = false;
  box.className = "card";
  fill(box, 
    el("p", { class: "notice" }, el("strong", {}, message || "이번 달 AI 분석 한도를 모두 사용했어요.")),
    el("p", { class: "notice" }, "요금제를 올리면 더 많은 상품을 분석할 수 있어요. 이번 달에 이미 분석한 상품은 다시 볼 수 있어요."),
    el("div", { class: "actions" }, el("button", { class: "primary", onclick: () => openTab(PRICING_URL) }, "요금제 보기")),
  );
}

// ── 보드 ─────────────────────────────────────────────────────────────
async function renderBoards(boards) {
  const select = $("board");
  const { [LAST_BOARD_KEY]: last } = await chrome.storage.local.get(LAST_BOARD_KEY);
  select.replaceChildren();
  if (!boards || boards.length === 0) {
    select.append(el("option", { value: "" }, `새 보드 '${DEFAULT_BOARD_NAME}'에 저장`));
  } else {
    for (const b of boards) select.append(el("option", { value: String(b.boardId) }, `${b.name} (${b.itemCount})`));
    if (last && boards.some((b) => String(b.boardId) === String(last))) select.value = String(last);
  }
}

async function createBoard(name) {
  const res = await api.createBoard(name);
  await chrome.storage.local.set({ [LAST_BOARD_KEY]: res.boardId });
  await renderBoards(await api.boards());
  $("board").value = String(res.boardId);
  return res.boardId;
}

$("btn-new-board").addEventListener("click", () => {
  $("new-board").hidden = !$("new-board").hidden;
  if (!$("new-board").hidden) $("new-board-name").focus();
});
$("btn-create-board").addEventListener("click", async () => {
  const name = $("new-board-name").value.trim();
  if (!name) return $("new-board-name").focus();
  try {
    await createBoard(name);
    $("new-board-name").value = "";
    $("new-board").hidden = true;
    showError("");
  } catch (e) {
    handleError(e);
  }
});
$("board").addEventListener("change", () => {
  const v = $("board").value;
  if (v) chrome.storage.local.set({ [LAST_BOARD_KEY]: Number(v) });
  setSaveMsg("");
});

// ── 현재 탭의 상품 읽기 ──────────────────────────────────────────────
async function refreshProduct() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.tabId = tab ? tab.id : null;
  if (!tab) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractProduct });
    // 주기적으로 다시 읽을 때 같은 상품이면 다시 그리지 않는다(이미지 깜빡임 방지)
    if (!state.readError && JSON.stringify(result) === JSON.stringify(state.product)) return;
    state.product = result;
    state.readError = null;
  } catch (e) {
    state.product = null;
    const m = String((e && e.message) || "");
    state.readErrorDetail = m;
    state.readError = /chrome:\/\/|chrome-extension:|webstore|edge:\/\/|about:|devtools/i.test(m) ? "unsupported" : "permission";
  }
  renderProduct();
}

function renderProduct() {
  const box = $("product");
  const p = state.product;
  if (state.readError === "permission") {
    fill(box, 
      el("p", { class: "notice" }, "이 쇼핑몰은 아직 읽을 권한이 없어요. 아래 버튼을 눌러 허용해 주세요."),
      el("div", { class: "actions" }, el("button", { class: "ghost", onclick: requestSiteAccess }, "이 사이트에서 FEDIT 사용하기")),
      state.readErrorDetail ? el("p", { class: "sub" }, state.readErrorDetail) : null);
  } else if (state.readError === "unsupported" || !p) {
    fill(box, el("p", { class: "notice" }, "쇼핑몰 상품 상세 페이지에서 열어 주세요."));
  } else {
    fill(box, el("div", { class: "product" },
      p.thumbnail ? el("img", { src: p.thumbnail, alt: "" }) : el("img", { alt: "" }),
      el("div", { class: "meta" },
        el("span", { class: "brand" }, p.brand || p.platform),
        el("span", { class: "name" }, p.productName || "상품명을 찾지 못했어요"),
        el("span", { class: "sub" }, [p.platform, p.currentPrice ? `${p.currentPrice.toLocaleString()}원` : null].filter(Boolean).join(" · ")),
        !p.isProductPage ? el("span", { class: "sub" }, "상품 상세 페이지가 아닐 수도 있어요") : null,
        !p.thumbnail ? el("span", { class: "sub" }, "상품 이미지를 찾지 못해 분석할 수 없어요") : null,
      )));
  }
  // 다른 상품으로 옮겨 가면 이전 분석 결과·저장 영역은 숨긴다
  if (state.resultUrl && (!p || p.url !== state.resultUrl)) resetResult();
  updateButtons();
}

function resetResult() {
  similarFor = null;
  state.pollToken++;
  state.result = null;
  state.resultUrl = null;
  $("result").hidden = true;
  $("similar").hidden = true;
  $("save-area").hidden = true;
  setSaveMsg("");
}

/**
 * 설치 때 넣지 않은 쇼핑몰: 현재 탭 주소를 알 수 없으므로(tabs 권한 없음) 모든 https 사이트 읽기 권한을 요청한다.
 * 크롬 안내창에서 사용자가 직접 허용해야 하며, 거절하면 이 쇼핑몰은 읽지 않는다.
 */
async function requestSiteAccess() {
  const ok = await chrome.permissions.request({ origins: ["https://*/*"] }).catch(() => false);
  if (ok) refreshProduct();
}

function updateButtons() {
  const p = state.product;
  const btn = $("btn-analyze");
  const hasResult = state.result && state.resultUrl === (p && p.url);
  const failed = hasResult && state.result.status === "failed";
  // 결과가 나와 있으면(실패 제외) 분석 버튼은 감춘다
  btn.hidden = Boolean(hasResult && !failed);
  btn.disabled = state.analyzing || !p || !p.thumbnail || limitReached();
  btn.textContent = state.analyzing ? "분석 요청 중…" : limitReached() ? "이번 달 분석 한도를 모두 사용했어요" : failed ? "다시 분석하기" : "AI로 분석하기";
  $("btn-save").disabled = state.saving || !hasResult;
  $("btn-save").textContent = state.saving ? "저장하는 중…" : "내 보드에 저장";
}

// 탭 이동·페이지 이동을 따라간다
let refreshTimer = null;
const scheduleRefresh = () => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { if (!$("view-main").hidden && !state.analyzing) refreshProduct(); }, 400);
};
chrome.tabs.onActivated.addListener(scheduleRefresh);
chrome.tabs.onUpdated.addListener((tabId) => { if (tabId === state.tabId) scheduleRefresh(); });
window.addEventListener("focus", scheduleRefresh);
// SPA 쇼핑몰(주소만 바뀌는 페이지)과 권한 대기 상태를 위해 가볍게 다시 확인
setInterval(() => {
  if (document.hidden || $("view-main").hidden || state.analyzing) return;
  if (state.readError === "permission" || state.product) refreshProduct();
}, 3000);

// ── 1단계: 분석 ──────────────────────────────────────────────────────
$("btn-analyze").addEventListener("click", onAnalyze);

async function onAnalyze() {
  const p = state.product;
  if (!p || state.analyzing) return;
  // 설치 때 없는 쇼핑몰이면 이 사이트 읽기 권한을 남겨 둔다(클릭 직후에만 요청 가능)
  try {
    chrome.permissions.request({ origins: [`${new URL(p.url).origin}/*`] }).catch(() => {});
  } catch { /* 권한 요청 실패해도 분석은 계속 */ }

  state.analyzing = true;
  updateButtons();
  showError("");
  try {
    const res = await api.analyze({
      productUrl: p.url,
      productName: p.productName,
      brand: p.brand,
      platform: p.platform,
      category: p.category,
      thumbnail: p.thumbnail,
      description: p.description,
      color: p.color,
      regularPrice: p.regularPrice,
      currentPrice: p.currentPrice,
    });
    state.result = res;
    state.resultUrl = p.url;
    $("save-area").hidden = false;
    setSaveMsg("");
    api.usage().then(renderUsage).catch(() => {});
    if (res.source === "product") {
      renderResult({ ...res, status: "loading" });
      loadProductAnalysis(res.itemcode);
    } else {
      renderResult(res);
      if (!isFinal(res.status)) poll(res.itemcode);
    }
  } catch (e) {
    handleError(e);
  } finally {
    state.analyzing = false;
    updateButtons();
  }
}

const isFinal = (s) => s === "indexed" || s === "failed";

/** 이미 수집된 상품: 웹 상세와 같은 VLM 결과를 불러와 같은 모양으로 보여준다 */
async function loadProductAnalysis(itemcode) {
  const token = ++state.pollToken;
  try {
    const d = await api.product(itemcode);
    if (token !== state.pollToken) return;
    state.result = { ...state.result, status: "indexed", analysis: fromProductDetail(d) };
  } catch (e) {
    if (e instanceof AuthError) return handleError(e);
    if (token !== state.pollToken) return;
    state.result = { ...state.result, status: "indexed", analysis: null };
  }
  renderResult(state.result);
  updateButtons();
}

function fromProductDetail(d) {
  const v = (d && d.vlm) || {};
  const cat = ((d && d.categories) || [])[0] || {};
  const join = (x) => (Array.isArray(x) ? x.filter(Boolean).join(",") : x) || null;
  return {
    mainCategory: cat.main_category, category: cat.category,
    material: v.material, fit: v.fit, length: v.length, sleeve: v.sleeve, neckline: v.neckline,
    pattern: join(v.pattern), detail: join(v.detail), color: join(v.color),
    mood: join(v.mood), seasonFeel: join(v.season_feel), aiDescription: d && d.ai_description,
  };
}

async function poll(itemcode) {
  const token = ++state.pollToken;
  const started = Date.now();
  while (token === state.pollToken) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    if (token !== state.pollToken) return;
    if (Date.now() - started > POLL_TIMEOUT_MS) return renderResult({ ...state.result, status: "timeout" });
    try {
      const res = await api.itemStatus(itemcode);
      if (token !== state.pollToken) return;
      state.result = res;
      renderResult(res);
      updateButtons();
      if (isFinal(res.status)) return;
    } catch (e) {
      if (e instanceof AuthError) return handleError(e);
      // 일시적 네트워크 오류는 다음 주기에 다시 본다
    }
  }
}

const TAG_ROWS = [
  ["분류", (a) => [a.mainCategory, a.category].filter(Boolean).join(" > ")],
  ["소재", (a) => a.material],
  ["핏", (a) => a.fit],
  ["기장", (a) => a.length],
  ["소매", (a) => a.sleeve],
  ["넥라인", (a) => a.neckline],
  ["패턴", (a) => a.pattern],
  ["디테일", (a) => a.detail],
  ["색상", (a) => a.color],
  ["무드", (a) => a.mood],
  ["계절감", (a) => a.seasonFeel],
];
const clean = (v) => (v == null ? "" : String(v).trim()).replace(/^(null|none|nan)$/i, "");

function renderResult(r) {
  const box = $("result");
  box.hidden = false;
  box.className = "card";
  if (r.status === "indexed") loadSimilar(r.itemcode);

  if (r.status === "indexed") {
    const a = r.analysis || {};
    const rows = TAG_ROWS.map(([label, f]) => [label, clean(f(a))]).filter(([, v]) => v);
    fill(box, 
      el("div", { class: "status ok" }, "✓ AI 분석 결과"),
      rows.length
        ? el("dl", { class: "tags" }, rows.flatMap(([k, v]) => [
            el("dt", {}, k),
            el("dd", {}, v.includes(",")
              ? el("div", { class: "chips" }, v.split(",").map((x) => x.trim()).filter(Boolean).map((x) => el("span", { class: "chip" }, x)))
              : v),
          ]))
        : el("p", { class: "notice" }, "표시할 분석 항목이 없어요."),
      clean(a.aiDescription) ? el("p", { class: "desc" }, a.aiDescription) : null,
      r.source === "product"
        ? el("div", { class: "actions" },
            el("button", { class: "ghost", onclick: () => openTab(productDetailUrl(r.itemcode)) }, "트렌드 지수·상세 분석 보기"))
        : null,
    );
  } else if (r.status === "failed") {
    fill(box, 
      el("div", { class: "status fail" }, "분석에 실패했어요"),
      el("p", { class: "notice" }, "위의 ‘다시 분석하기’를 누르면 한 번 더 요청해요. 실패한 분석은 한도에 세지 않아요."),
    );
  } else if (r.status === "timeout") {
    fill(box, 
      el("div", { class: "status" }, "분석이 오래 걸리고 있어요"),
      el("p", { class: "notice" }, "보드에 저장해 두면 결과를 내 보드에서 나중에 확인할 수 있어요."),
    );
  } else {
    fill(box, 
      el("div", { class: "status" }, el("div", { class: "spinner" }),
        r.status === "loading" ? "분석 결과를 불러오고 있어요" : "AI가 분석하고 있어요"),
      r.status === "loading" ? null : el("p", { class: "notice" }, "보통 1분 안에 끝나요. 기다리는 동안 보드에 먼저 저장해도 돼요."),
    );
  }
}

// ── DB 속 비슷한 상품 ────────────────────────────────────────────────
let similarFor = null;
async function loadSimilar(itemcode) {
  if (!itemcode || similarFor === itemcode) return;
  similarFor = itemcode;
  const box = $("similar");
  box.hidden = false;
  fill(box, el("p", { class: "section-title" }, "FEDIT DB 속 비슷한 상품"),
    el("div", { class: "status" }, el("div", { class: "spinner" }), "찾는 중"));
  let items = [];
  try {
    items = (await api.similar(itemcode, 6)) || [];
  } catch (e) {
    if (e instanceof AuthError) return handleError(e);
  }
  if (similarFor !== itemcode || !state.result || state.result.itemcode !== itemcode) return;
  if (!items.length) {
    fill(box, el("p", { class: "section-title" }, "FEDIT DB 속 비슷한 상품"),
      el("p", { class: "notice" }, "FEDIT DB에서 비슷한 상품을 찾지 못했어요."));
    return;
  }
  fill(box,
    el("p", { class: "section-title" }, "FEDIT DB 속 비슷한 상품"),
    el("div", { class: "similar-grid" }, items.map((it) =>
      el("button", { class: "sim", title: it.product_name || "", onclick: () => openTab(productDetailUrl(it.itemCode)) },
        el("img", { src: it.thumbnail || "", alt: "", loading: "lazy" }),
        el("span", { class: "b" }, it.brand || ""),
        el("span", { class: "n" }, it.product_name || it.itemCode),
        (it.details || []).length ? el("span", { class: "k" }, it.details.slice(0, 2).join(" · ")) : null,
      ))),
  );
}

// ── 2단계: 마음에 들면 저장 ──────────────────────────────────────────
$("btn-save").addEventListener("click", onSave);

function setSaveMsg(text, ok = false) {
  const m = $("save-msg");
  m.hidden = !text;
  m.className = ok ? "notice ok" : "notice";
  m.replaceChildren();
  if (!text) return;
  m.append(text);
  if (ok) m.append(" ", el("a", { href: "#", onclick: (e) => { e.preventDefault(); openTab(BOARD_URL); } }, "내 보드 열기"));
}

async function onSave() {
  const r = state.result;
  if (!r || state.saving) return;
  state.saving = true;
  updateButtons();
  showError("");
  try {
    let boardId = Number($("board").value) || null;
    if (!boardId) boardId = await createBoard(DEFAULT_BOARD_NAME);
    await chrome.storage.local.set({ [LAST_BOARD_KEY]: boardId });
    const boardName = $("board").selectedOptions[0]?.textContent.replace(/\s\(\d+\)$/, "") || "보드";
    try {
      await api.addToBoard(boardId, r.itemcode);
      setSaveMsg(`✓ '${boardName}'에 저장했어요.`, true);
      api.boards().then(async (b) => { await renderBoards(b); $("board").value = String(boardId); }).catch(() => {});
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && /이미/.test(e.message)) setSaveMsg(`이미 '${boardName}'에 있는 상품이에요.`, true);
      else throw e;
    }
  } catch (e) {
    handleError(e);
  } finally {
    state.saving = false;
    updateButtons();
  }
}

// ── 로그인 ───────────────────────────────────────────────────────────
$("btn-login").addEventListener("click", () => openTab(LOGIN_URL));

// FEDIT 웹에서 로그인/로그아웃하면(content/fedit-auth-sync.js 가 저장) 바로 반영
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.feditAuth) return;
  const loggedIn = Boolean(changes.feditAuth.newValue);
  const wasLoggedIn = Boolean(changes.feditAuth.oldValue);
  if (loggedIn !== wasLoggedIn) init();
});

init();
