// 사이드패널: 지금 보고 있는 상품을 읽어 보여주고 → AI로 분석해 결과를 바로 보여주고 → 마음에 들면 내 보드에 저장한다.
import { api, AuthError, ApiError } from "../lib/api.js";
import { getTokens } from "../lib/tokens.js";
import { extractProduct } from "../lib/extract.js";
import { WEB_BASE, LOGIN_URL, BOARD_URL, PRICING_URL, productDetailUrl, POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from "../lib/config.js";

const $ = (id) => document.getElementById(id);
const LAST_BOARD_KEY = "feditLastBoardId";
// 분석한 상품 URL → { itemcode, source }. 사이드바를 닫았다 열어도(또는 다시 그 상품에 와도) 결과를 다시 불러온다
const RESULTS_KEY = "feditAnalyzedItems";
const RESULTS_MAX = 300;
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
    return;
  }
  showError(e && e.message ? e.message : "문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
}

// ── 사용량(월 분석 한도) ──────────────────────────────────────────────
// 한 달은 달력 월이 아니라 결제일(구독 중) 또는 가입일 기준 — 서버가 다시 채워지는 시각(resetsAt)을 준다
function resetDateText(u) {
  const d = u && u.resetsAt ? new Date(u.resetsAt) : null;
  return d && !isNaN(d) ? `${d.getMonth() + 1}월 ${d.getDate()}일` : "";
}
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
      pill.textContent = `분석 ${u.used}/${u.limit}`;
      pill.className = u.remaining <= 5 ? "pill warn" : "pill";
      pill.title = resetDateText(u) ? `${resetDateText(u)}에 다시 채워져요` : "";
    }
  }
  updateButtons();
}
const limitReached = () => Boolean(state.usage && state.usage.canAnalyze === false);

// 한도를 다 쓰면 분석 버튼 아래에 구독 안내를 띄운다(사용량 조회 시점이든 분석 요청이 403 으로 막힌 시점이든)
function renderLimitReached() {
  const box = $("limit");
  const p = state.product;
  const showingResult = state.result && p && state.resultUrl === p.url && state.result.status !== "failed";
  if (!limitReached() || showingResult) { box.hidden = true; return; }
  box.hidden = false;
  fill(box,
    el("p", { class: "limit-title" }, "요금제를 구독하고 계속 분석해 보세요"),
    el("p", { class: "notice" }, "요금제를 구독하면 매달 더 많은 상품을 분석하고, FEDIT에서 트렌드 지수·경쟁사 모니터링까지 이어서 볼 수 있어요."),
    el("button", { class: "primary", onclick: () => openTab(PRICING_URL) }, "요금제 보기"),
    el("p", { class: "sub" }, `${resetDateText(state.usage) ? `${resetDateText(state.usage)}에 분석 한도가 다시 채워져요. ` : ""}이미 분석한 상품은 계속 보고 무드보드에 저장할 수 있어요.`),
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
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractProduct, args: [{ full: false }] });
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
  restoreResult();
}

// ── 이미 분석한 상품 결과 다시 불러오기(분석 횟수 차감 없음) ───────────
async function rememberResult(p, res) {
  try {
    const { [RESULTS_KEY]: map = {} } = await chrome.storage.local.get(RESULTS_KEY);
    const v = { itemcode: res.itemcode, source: res.source, at: Date.now() };
    for (const u of new Set([p.url, p.productUrl].filter(Boolean))) map[u] = v;
    const keys = Object.keys(map);
    if (keys.length > RESULTS_MAX) {
      keys.sort((a, b) => (map[a].at || 0) - (map[b].at || 0)).slice(0, keys.length - RESULTS_MAX).forEach((k) => delete map[k]);
    }
    await chrome.storage.local.set({ [RESULTS_KEY]: map });
  } catch { /* 기억 못 해도 분석 결과는 그대로 보인다 */ }
}

let restoringUrl = null;
async function restoreResult() {
  const p = state.product;
  if (!p || state.analyzing || restoringUrl === p.url || (state.result && state.resultUrl === p.url)) return;
  restoringUrl = p.url;
  try {
    const { [RESULTS_KEY]: map = {} } = await chrome.storage.local.get(RESULTS_KEY);
    const saved = map[p.url] || (p.productUrl && map[p.productUrl]);
    if (!saved || !saved.itemcode || state.product !== p || state.analyzing) return;
    state.result = { itemcode: saved.itemcode, source: saved.source, status: "loading" };
    state.resultUrl = p.url;
    $("save-area").hidden = false;
    setSaveMsg("");
    renderResult(state.result);
    updateButtons();
    if (saved.source === "product") return loadProductAnalysis(saved.itemcode);
    const token = ++state.pollToken;
    const res = await api.itemStatus(saved.itemcode);
    if (token !== state.pollToken) return;
    state.result = res;
    renderResult(res);
    updateButtons();
    if (!isFinal(res.status)) poll(res.itemcode);
  } catch (e) {
    if (e instanceof AuthError) return handleError(e);
    // 지워진 상품 등 — 결과 없이 분석 버튼만 보여준다
    if (state.resultUrl === (p && p.url)) resetResult();
  } finally {
    restoringUrl = null;
  }
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
        p.pageKind === "notProduct" ? el("span", { class: "sub warn" }, "상품 상세 페이지가 아니에요. 상품 하나를 눌러 상세 페이지에서 분석해 주세요.")
          : !p.isProductPage ? el("span", { class: "sub" }, "상품 상세 페이지가 아닐 수도 있어요") : null,
        !p.thumbnail ? el("span", { class: "sub" }, "상품 이미지를 찾지 못해 분석할 수 없어요") : null,
      )));
  }
  // 다른 상품으로 옮겨 가면 이전 분석 결과·저장 영역은 숨긴다
  if (state.resultUrl && (!p || p.url !== state.resultUrl)) resetResult();
  updateButtons();
}

function resetResult() {
  stopProgress();
  similarFor = null;
  trendFor = null;
  state.pollToken++;
  state.result = null;
  state.resultUrl = null;
  $("result").hidden = true;
  $("similar").hidden = true;
  $("trend").hidden = true;
  $("price").hidden = true;
  closeCompare();
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
  btn.disabled = state.analyzing || !p || !p.thumbnail || p.pageKind === "notProduct" || limitReached();
  btn.textContent = state.analyzing ? "분석 요청 중…" : limitReached() ? "분석 한도를 모두 사용했어요" : failed ? "다시 분석하기" : "AI로 분석하기";
  $("btn-save").disabled = state.saving || !hasResult;
  $("btn-save").textContent = state.saving ? "저장하는 중…" : "무드보드에 저장";
  renderLimitReached();
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
  startProgress();
  try {
    // 분석할 때만 상품 고시·정보 탭까지 펼쳐서 다시 읽는다(크롤러와 같은 방식). 실패하면 미리보기 값으로 진행
    let full = p;
    try {
      const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: state.tabId }, func: extractProduct, args: [{ full: true }] });
      if (result && result.url === p.url) full = result;
    } catch { /* 미리보기 값 사용 */ }
    // 쇼핑몰이 서버의 이미지 다운로드를 막는 경우(명품 사이트 등) 대비 — 브라우저에서 받은 이미지를 같이 보낸다.
    // 백엔드는 원본을 서버에서 받을 수 없을 때만 이 이미지를 쓴다. 못 받으면 빼고 보낸다.
    const imageData = await captureImage(p.thumbnail);
    const res = await api.analyze({
      productUrl: full.productUrl || p.url,
      productName: p.productName,
      brand: p.brand,
      platform: p.platform,
      category: p.category,
      thumbnail: p.thumbnail,
      description: full.description || p.description,
      color: full.color || p.color,
      regularPrice: full.regularPrice ?? p.regularPrice,
      currentPrice: full.currentPrice ?? p.currentPrice,
      // v2: 크롤러 규칙으로 읽은 상세 정보(백엔드가 VLM 소재·분류 힌트로 넘긴다)
      site: full.site,
      material: full.material,
      mainCategory: full.mainCategory,
      subCategory: full.subCategory,
      gender: full.gender,
      manufactureDate: full.manufactureDate,
      likes: full.likes != null ? Number(full.likes) || null : null,
      reviews: full.reviews != null ? Number(full.reviews) || null : null,
      rating: full.rating,
      imageData,
    });
    state.result = res;
    state.resultUrl = p.url;
    rememberResult(full.url === p.url ? full : p, res);
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
    // 요청 전에 실패하면 진행 단계 카드는 걷어낸다
    stopProgress();
    if (!state.result || state.resultUrl !== p.url) $("result").hidden = true;
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

// 실패 사유별 안내(백엔드 failReason). 사이트 특성 때문인 경우 FEDIT 문제가 아님을 함께 알린다.
const FAIL_REASONS = {
  IMAGE_BLOCKED: { title: "분석할 수 없는 쇼핑몰이에요", body: "쇼핑몰 보안 정책으로 상품 이미지를 가져올 수 없어요." },
  NO_PRODUCT_IMAGE: { title: "옷 사진을 찾지 못했어요", body: "상품 상세 페이지에서 다시 시도해 주세요." },
  UNKNOWN: { title: "분석에 실패했어요", body: "‘다시 분석하기’를 눌러 한 번 더 시도해 주세요." },
};

/** 상품 이미지를 브라우저에서 받아 JPEG data URL 로(긴 변 1024 이하, 450KB 이하). 권한·CORS 로 못 받으면 null */
async function captureImage(url) {
  if (!url) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal, credentials: "include" }).finally(() => clearTimeout(timer));
    if (!res.ok) return null;
    const bmp = await createImageBitmap(await res.blob());
    for (const [edge, quality] of [[1024, 0.85], [1024, 0.7], [768, 0.7], [640, 0.6]]) {
      const k = Math.min(1, edge / Math.max(bmp.width, bmp.height));
      const canvas = new OffscreenCanvas(Math.max(1, Math.round(bmp.width * k)), Math.max(1, Math.round(bmp.height * k)));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";   // 투명 PNG 배경
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
      if (blob.size <= 450 * 1024) {
        return await new Promise((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = () => resolve(null); fr.readAsDataURL(blob); });
      }
    }
  } catch { /* 못 받으면 원본 주소만 보낸다 */ }
  return null;
}

function renderResult(r) {
  const box = $("result");
  box.hidden = false;
  box.className = "card";
  if (r.status !== "queued" && r.status !== "ai_done") stopProgress();
  if (r.status === "indexed") { loadTrend(r.itemcode); loadSimilar(r.itemcode); }

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
      // AI 개요는 문장 품질 개선 전이라 사이드패널에서는 숨긴다(FEDIT 웹 상세에서는 그대로 보인다)
      el("div", { class: "actions" },
        el("button", { class: "ghost", onclick: () => openTab(productDetailUrl(r.itemcode)) }, "트렌드 지수·상세 분석 보기")),
    );
  } else if (r.status === "failed") {
    const why = FAIL_REASONS[r.failReason] || FAIL_REASONS.UNKNOWN;
    fill(box, 
      el("div", { class: "status fail" }, why.title),
      el("p", { class: "notice" }, why.body),
    );
  } else if (r.status === "timeout") {
    fill(box, 
      el("div", { class: "status" }, "분석이 오래 걸리고 있어요"),
      el("p", { class: "notice" }, "보드에 저장해 두면 결과를 내 보드에서 나중에 확인할 수 있어요."),
    );
  } else if (r.status === "loading") {
    fill(box, el("div", { class: "status" }, el("div", { class: "spinner" }), "분석 결과를 불러오고 있어요"));
  } else {
    setProgress(1);
  }
}

// 분석 진행 단계: 페이지 읽기 → AI 분석 → 트렌드지수 계산(마지막 단계는 결과가 나온 뒤 트렌드지수 카드에서 보인다)
const STEPS = ["상품 페이지 읽기", "AI 분석", "트렌드지수 계산"];
// 표시 단계는 5초마다 하나씩 넘어간다(실제 처리가 더 빠르면 그 단계를 바로 보여준다). 결과가 나오면 멈춘다.
const STEP_MS = 5000;
const STEP_TEXT = ["상품 페이지를 읽고 있어요", "AI가 분석하고 있어요", "트렌드지수를 계산하고 있어요"];
let progress = null;    // { start, real, shown, timer }
function startProgress() {
  stopProgress();
  progress = { start: Date.now(), real: 0, shown: -1, timer: setInterval(drawProgress, 500) };
  drawProgress();
}
function setProgress(real) {
  if (!progress) progress = { start: Date.now(), real, shown: -1, timer: setInterval(drawProgress, 500) };
  progress.real = Math.max(progress.real, real);
  drawProgress();
}
function stopProgress() {
  if (progress) clearInterval(progress.timer);
  progress = null;
}
function drawProgress() {
  if (!progress) return;
  const step = Math.min(STEPS.length - 1, Math.max(progress.real, Math.floor((Date.now() - progress.start) / STEP_MS)));
  if (step === progress.shown) return;   // 같은 단계면 다시 그리지 않는다(스피너 깜빡임 방지)
  progress.shown = step;
  showSteps(step, STEP_TEXT[step]);
}
function stepList(active) {
  return el("ol", { class: "steps" }, STEPS.map((t, i) =>
    el("li", { class: i < active ? "done" : i === active ? "on" : "" },
      el("span", { class: "ic", "aria-hidden": "true" }, i < active ? "✓" : i === active ? el("span", { class: "spinner sm" }) : ""),
      i === active ? `${t} 중` : t)));
}
function showSteps(active, text) {
  const box = $("result");
  box.hidden = false;
  box.className = "card";
  fill(box,
    el("p", { class: "section-title" }, text),
    stepList(active),
    active >= 1 ? el("p", { class: "notice" }, "보통 10~20초 걸려요. 기다리는 동안 무드보드에 먼저 저장해도 돼요.") : null);
}

// ── 트렌드지수 요약 ──────────────────────────────────────────────────
// 웹 상세의 트렌드지수 카드를 줄인 것: 통합 지수(총점·구간), 세 지표(상위 %·라벨), 네이버 검색량·스토어 찜, 상품 찜·후기
let trendFor = null;
const num = (v) => (v == null || v === "" ? null : Number(v));
const fmt = (v) => (num(v) == null || Number.isNaN(num(v)) ? null : num(v).toLocaleString("ko-KR"));
const topPct = (v) => (num(v) == null ? null : `상위 ${Math.max(1, Math.round(num(v)))}%`);
const STAGE_LABEL = { measured: "실측", similar: "예측", market: "준비 중" };

async function loadTrend(itemcode) {
  if (!itemcode || trendFor === itemcode) return;
  trendFor = itemcode;
  const box = $("trend");
  box.hidden = false;
  fill(box, el("p", { class: "section-title" }, "트렌드지수"), stepList(2));
  let t = null;
  try {
    t = await api.trend(itemcode);
  } catch (e) {
    if (e instanceof AuthError) return handleError(e);
  }
  if (trendFor !== itemcode || !state.result || state.result.itemcode !== itemcode) return;
  if (!t) {
    fill(box, el("p", { class: "section-title" }, "트렌드지수"), el("p", { class: "notice" }, "아직 트렌드지수 데이터가 없어요."));
    return;
  }
  const ii = t.integrated_index || {}, bi = t.brand_index || {}, pi = t.product_index || {}, pp = t.purchase_power_index || {};
  const stage = t.data_stage || ii.basis;
  const est = t.similar_estimate;
  const stageText = stage === "similar" && est && est.similar_count ? `예측 · 유사상품 ${est.similar_count}개 기준` : STAGE_LABEL[stage] || "";
  const scoreText = ii.score != null ? `${Math.round(num(ii.score))}점` : "준비 중";
  const change = num(ii.score_change_pct);
  const rows = [
    ["브랜드 인지도", [topPct(bi.awareness_pct), bi.awareness_label].filter(Boolean).join(" · ")],
    ["아이템 관심도", [topPct(pi.interest_pct), pi.interest_label].filter(Boolean).join(" · ")],
    ["구매 화력도", [topPct(pp.purchase_pct), pp.purchase_label].filter(Boolean).join(" · ")],
    ["네이버 검색량", fmt(bi.search_volume)],
    ["브랜드 스토어 찜", fmt(bi.store_likes)],
    ["상품 찜", fmt(pi.like_count)],
    ["후기", fmt(pp.review_count)],
  ].filter(([, v]) => v);
  fill(box,
    el("div", { class: "trend-head" },
      el("p", { class: "section-title" }, "트렌드지수"),
      stageText ? el("span", { class: `pill ${stage === "measured" ? "" : `soft stage-${stage}`}` }, stageText) : null),
    el("div", { class: "trend-score" },
      el("strong", {}, scoreText),
      ii.band ? el("span", { class: `band ${/급상승|상승/.test(ii.band) ? "up" : /하락/.test(ii.band) ? "down" : ""}` }, ii.band) : null,
      change != null && !Number.isNaN(change) ? el("span", { class: "chg" }, `전날보다 ${change > 0 ? "+" : ""}${change}%`) : null),
    rows.length ? el("dl", { class: "tags" }, rows.flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)])) : null,
  );
}

// ── DB 속 비슷한 상품 ────────────────────────────────────────────────
let similarFor = null;
async function loadSimilar(itemcode) {
  if (!itemcode || similarFor === itemcode) return;
  similarFor = itemcode;
  const box = $("similar");
  box.hidden = false;
  fill(box, el("p", { class: "section-title" }, "유사상품"),
    el("div", { class: "status" }, el("div", { class: "spinner" }), "찾는 중"));
  let items = [];
  try {
    items = (await api.similar(itemcode, SIMILAR_LIMIT)) || [];
  } catch (e) {
    if (e instanceof AuthError) return handleError(e);
  }
  if (similarFor !== itemcode || !state.result || state.result.itemcode !== itemcode) return;
  renderPrice(items);
  if (!items.length) {
    fill(box, el("p", { class: "section-title" }, "유사상품"),
      el("p", { class: "notice" }, "FEDIT DB에서 유사상품을 찾지 못했어요."));
    return;
  }
  fill(box,
    el("p", { class: "section-title" }, "유사상품"),
    el("div", { class: "similar-grid" }, items.slice(0, 6).map((it) =>
      el("button", { class: "sim", title: it.product_name || "", onclick: () => openTab(it.productUrl || productDetailUrl(it.itemCode)) },
        el("img", { src: it.thumbnail || "", alt: "", loading: "lazy" }),
        el("span", { class: "b" }, it.brand || ""),
        el("span", { class: "n" }, it.product_name || it.itemCode),
      ))),
  );
}

// ── 가격 위치 · 유사상품 가격 비교 ─────────────────────────────────────
// 유사상품(수집 상품) 가격 분포에서 지금 보는 상품이 어디쯤인지. 가격은 할인가 우선(백엔드 price).
const SIMILAR_LIMIT = 10;
const SVG_NS = "http://www.w3.org/2000/svg";
let priceData = null;   // { base, items, median, lo, hi, ticks }
let compareSort = "price";
let compareOpen = null; // 펼친 유사상품 itemCode

const man = (v) => `${(Math.round(v / 1000) / 10).toFixed(1).replace(/\.0$/, "")}만`;
// 가격 차이가 크면(최고/최저 6배 이상) 로그 축으로 — 한 상품만 아주 비싸도 나머지가 한쪽에 뭉치지 않게
const pctOf = (v, d) => (d.log
  ? ((Math.log(v) - Math.log(d.lo)) / (Math.log(d.hi) - Math.log(d.lo))) * 100
  : ((v - d.lo) / (d.hi - d.lo)) * 100);
// 축 눈금: 1·2·5 단위로 최대 5개(라벨이 겹치지 않게)
function niceStep(span, maxTicks) {
  const raw = span / Math.max(1, maxTicks - 1);
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) || 10 * pow;
}
function axisOf(min, max) {
  if (min > 0 && max / min >= 6) {
    const lo = 10 ** Math.floor(Math.log10(min)), hi = 10 ** Math.ceil(Math.log10(max));
    const cands = [];
    for (let e = lo; e <= hi; e *= 10) for (const m of [1, 2, 5]) if (e * m >= lo && e * m <= hi) cands.push(e * m);
    const d = { log: true, lo: Math.max(lo, cands.filter((t) => t <= min).pop() || lo), hi: cands.find((t) => t >= max) || hi };
    // 라벨 사이가 18% 이상 떨어지도록 거른다(로그 축에서 1·2·5 가 촘촘하면 일부만)
    const ticks = [];
    for (const t of cands.filter((t) => t >= d.lo && t <= d.hi)) {
      if (!ticks.length || pctOf(t, d) - pctOf(ticks[ticks.length - 1], d) >= 18) ticks.push(t);
    }
    if (ticks[ticks.length - 1] !== d.hi) { if (pctOf(d.hi, d) - pctOf(ticks[ticks.length - 1], d) < 18) ticks.pop(); ticks.push(d.hi); }
    return { ...d, ticks };
  }
  const step = niceStep(max - min || max * 0.2, 5);
  const lo = Math.max(0, Math.floor(min / step) * step), hi = Math.max(lo + step, Math.ceil(max / step) * step);
  const ticks = [];
  for (let t = lo; t <= hi + 1; t += step) ticks.push(t);
  return { log: false, lo, hi, ticks };
}
function chevron() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("class", "chev");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M4 6l4 4 4-4");
  svg.append(path);
  return svg;
}
function diffChip(price, base) {
  const d = Math.round(((price - base) / base) * 100);
  if (d === 0) return el("span", { class: "diff same" }, "같은 가격");
  return el("span", { class: `diff ${d < 0 ? "cheap" : "dear"}` }, `${Math.abs(d)}% ${d < 0 ? "저렴" : "비쌈"}`);
}

function priceStats(items) {
  const p = state.product;
  const base = num(p && p.currentPrice) || num(p && p.regularPrice);
  const priced = items.filter((it) => num(it.price) > 0);
  if (!base || priced.length < 2) return null;
  const vals = priced.map((it) => num(it.price)).sort((a, b) => a - b);
  const m = vals.length >> 1;
  const median = vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
  const min = Math.min(vals[0], base), max = Math.max(vals[vals.length - 1], base);
  return { base, items: priced, median, ...axisOf(min, max), min: vals[0], max: vals[vals.length - 1] };
}

function priceSummary(d) {
  const cheaper = d.items.filter((it) => num(it.price) < d.base).length;
  const n = d.items.length;
  const vsMid = Math.round(((d.base - d.median) / d.median) * 100);
  const where = cheaper === n ? "가장 비싸요" : cheaper === 0 ? "가장 저렴해요" : `${n - cheaper + 1}번째로 비싸요`;
  return el("p", { class: "price-sum" }, `유사상품 ${n}개 중 `, el("b", {}, where), " · 중앙값보다 ",
    el("b", {}, `${vsMid > 0 ? "+" : ""}${vsMid}%`));
}

/** 가격 축 그래프. 점이 겹치지 않게 가까운 점은 위아래 줄로 비켜 놓는다. onPick 이 있으면 점을 누를 수 있다. */
function priceChart(d, { big = false, onPick = null, picked = null } = {}) {
  const box = el("div", { class: `pchart${big ? " big" : ""}`, role: "img",
    "aria-label": `유사상품 ${d.items.length}개 가격 분포, 중앙값 ${man(d.median)}, 이 상품 ${man(d.base)}` });
  const lanes = [];
  const laneY = (i) => (i === 0 ? 0 : (i % 2 ? -1 : 1) * Math.ceil(i / 2));
  const gap = big ? 3.5 : 4.5;
  const dots = d.items.map((it) => ({ it, x: pctOf(num(it.price), d) })).sort((a, b) => a.x - b.x);
  for (const dot of dots) {
    let lane = lanes.findIndex((last) => dot.x - last >= gap);
    if (lane < 0) { lane = lanes.length; lanes.push(dot.x); } else lanes[lane] = dot.x;
    dot.y = laneY(lane);
  }
  const midX = pctOf(d.median, d), meX = pctOf(d.base, d);
  const close = Math.abs(midX - meX) < (big ? 30 : 36);
  // 라벨이 카드 밖으로 나가지 않게: 가장자리 근처면 안쪽으로 붙인다
  const edge = (x) => (x > 82 ? ";transform:translateX(-100%)" : x < 18 ? ";transform:none" : "");
  box.append(
    ...d.ticks.map((t, i) => el("span", { class: "ptick", style: `left:${pctOf(t, d)}%` })),
    el("span", { class: "pmid", style: `left:${midX}%` }),
    el("span", { class: "pflag mid", "data-x": midX, style: `left:${midX}%${close && midX < meX ? ";transform:translateX(-100%)" : close ? ";transform:none" : edge(midX)}` },
      `${big ? "시장 " : ""}중앙 ${man(d.median)}`),
    el("span", { class: "pflag me", "data-x": meX, style: `left:${meX}%${close && meX <= midX ? ";transform:translateX(-100%)" : close ? ";transform:none" : edge(meX)}` },
      `이 상품 ${man(d.base)}`),
    ...dots.map((dot) => {
      const attrs = { class: `pdot${picked === dot.it.itemCode ? " sel" : ""}`,
        style: `left:${dot.x}%;--lane:${dot.y}`, title: `${dot.it.brand || ""} ${man(num(dot.it.price))}` };
      if (onPick) return el("button", { ...attrs, type: "button", "aria-label": `${dot.it.brand || ""} ${man(num(dot.it.price))}`, onclick: () => onPick(dot.it.itemCode) });
      return el("span", attrs);
    }),
    el("span", { class: "pdot me", style: `left:${meX}%;--lane:0` }),
    ...d.ticks.map((t, i) => el("span", { class: "plab", style: `left:${pctOf(t, d)}%${i === 0 ? ";transform:none" : i === d.ticks.length - 1 ? ";transform:translateX(-100%)" : ""}` }, man(t))),
  );
  // 위 style 은 첫 그림용 — 실제 글자 폭을 재서 다시 놓는다(패널 폭이 바뀌어도)
  const ro = new ResizeObserver(() => {
    if (!box.isConnected) { ro.disconnect(); return; }
    placeFlags(box, big);
  });
  ro.observe(box);
  return box;
}

/** "시장 중앙"·"이 상품" 라벨을 실제 폭으로 재서 차트 밖으로 나가지 않게, 서로 겹치지 않게 놓는다.
 *  둘이 한 줄에 다 안 들어가면 "이 상품"을 한 줄 아래로 내린다. */
function placeFlags(box, big) {
  const W = box.clientWidth;
  const mid = box.querySelector(".pflag.mid"), me = box.querySelector(".pflag.me");
  if (!W || !mid || !me) return;
  const GAP = 8;
  const clamp = (left, w) => Math.min(Math.max(left, 0), Math.max(W - w, 0));
  const make = (f) => {
    const x = (parseFloat(f.dataset.x) / 100) * W, w = f.offsetWidth;
    return { f, x, w, left: clamp(x - w / 2, w) };
  };
  const a = make(mid), b = make(me);
  const [l, r] = a.x <= b.x ? [a, b] : [b, a];
  me.style.top = "";
  if (l.left + l.w + GAP > r.left) {
    if (l.w + GAP + r.w <= W) {
      // 왼쪽 라벨은 점 왼쪽에, 오른쪽 라벨은 점 오른쪽에 붙이고, 그래도 겹치면 서로 밀어낸다
      l.left = clamp(l.x - l.w, l.w);
      r.left = clamp(Math.max(r.x, l.left + l.w + GAP), r.w);
      l.left = clamp(Math.min(l.left, r.left - GAP - l.w), l.w);
    } else {
      me.style.top = big ? "18px" : "14px";
    }
  }
  for (const { f, left } of [a, b]) {
    f.style.left = `${left}px`;
    f.style.transform = "none";
  }
}

function renderPrice(items) {
  const box = $("price");
  priceData = priceStats(items);
  if (!priceData) { box.hidden = true; return; }
  box.hidden = false;
  fill(box,
    el("p", { class: "section-title" }, "가격 위치"),
    priceChart(priceData),
    priceSummary(priceData),
    el("button", { class: "ghost wide", onclick: openCompare }, "유사상품과 가격 비교하기 →"),
  );
}

// 패널 안 비교 화면: 다른 영역을 잠시 숨기고 #compare 만 보여준다. ← 분석 결과 로 돌아온다.
let hiddenBeforeCompare = null;
function openCompare() {
  if (!priceData) return;
  const main = $("view-main");
  hiddenBeforeCompare = [...main.children].map((n) => [n, n.hidden]);
  for (const [n] of hiddenBeforeCompare) n.hidden = n.id !== "compare";
  compareOpen = null;
  renderCompare();
  main.scrollTop = 0;
  window.scrollTo(0, 0);
}
function closeCompare() {
  if (!hiddenBeforeCompare) return;
  for (const [n, h] of hiddenBeforeCompare) n.hidden = h;
  hiddenBeforeCompare = null;
  $("compare").hidden = true;
  $("price").scrollIntoView({ block: "nearest" });
}

const ATTR_ROWS = [["소재", "material"], ["핏", "fit"], ["기장", "length"], ["넥라인", "neckline"], ["소매", "sleeve"],
  ["패턴", "pattern"], ["디테일", "detail"], ["색상", "color"]];

function renderCompare() {
  const d = priceData, p = state.product || {};
  const box = $("compare");
  box.hidden = false;
  const order = compareSort === "price"
    ? [...d.items].sort((a, b) => num(b.price) - num(a.price))
    : d.items;
  const pick = (code) => { compareOpen = compareOpen === code ? null : code; renderCompare();
    const row = box.querySelector(`[data-code="${CSS.escape(code)}"]`); if (row) row.scrollIntoView({ block: "nearest" }); };
  const sortBtn = (key, label) => el("button", { type: "button", class: compareSort === key ? "on" : "",
    "aria-pressed": String(compareSort === key), onclick: () => { compareSort = key; renderCompare(); } }, label);
  const vsMid = Math.round(((d.base - d.median) / d.median) * 100);
  fill(box,
    el("button", { class: "back", type: "button", onclick: closeCompare }, "← 분석 결과"),
    el("div", { class: "product" },
      p.thumbnail ? el("img", { src: p.thumbnail, alt: "" }) : el("img", { alt: "" }),
      el("div", { class: "meta" },
        el("span", { class: "brand" }, p.brand || p.platform || ""),
        el("span", { class: "name" }, p.productName || ""),
        el("span", { class: "sub" }, `${d.base.toLocaleString("ko-KR")}원`))),
    el("section", { class: "card" },
      el("p", { class: "section-title" }, "가격 위치"),
      el("p", { class: "notice small0" }, "회색 점은 유사상품, 파란 점이 지금 보는 상품이에요. 점을 누르면 아래에서 그 상품이 펼쳐져요."),
      priceChart(d, { big: true, onPick: pick, picked: compareOpen }),
      el("div", { class: "pstats" },
        el("div", {}, el("span", {}, "시장 중앙"), el("b", {}, man(d.median))),
        el("div", {}, el("span", {}, "가격 범위"), el("b", {}, `${man(d.min)}~${man(d.max)}`)),
        el("div", {}, el("span", {}, "이 상품"), el("b", {}, `${vsMid > 0 ? "+" : ""}${vsMid}%`)))),
    el("section", { class: "card" },
      el("div", { class: "trend-head" },
        el("p", { class: "section-title" }, `유사상품 ${d.items.length}개`),
        el("div", { class: "seg", role: "group", "aria-label": "정렬" }, sortBtn("price", "가격순"), sortBtn("similar", "유사도순"))),
      el("div", { class: "pbase" }, el("span", {}, "기준 · 지금 보는 상품"), el("b", {}, man(d.base))),
      el("ul", { class: "plist" }, order.map((it) => {
        const open = compareOpen === it.itemCode;
        const attrs = ATTR_ROWS.map(([k, f]) => [k, clean(it[f])]).filter(([, v]) => v);
        return el("li", { "data-code": it.itemCode, class: open ? "open" : "" },
          el("button", { type: "button", class: "prow", "aria-expanded": String(open), onclick: () => pick(it.itemCode) },
            el("img", { src: it.thumbnail || "", alt: "", loading: "lazy" }),
            el("span", { class: "info" },
              el("span", { class: "bn" }, it.brand || ""),
              el("span", { class: "pn" }, it.product_name || it.itemCode),
              el("span", { class: "mt" }, [clean(it.material), clean(it.fit)].filter(Boolean).join(" · "))),
            el("span", { class: "pr" }, el("strong", {}, man(num(it.price))), diffChip(num(it.price), d.base)),
            chevron()),
          open ? el("div", { class: "pattrs" },
            attrs.length
              ? el("dl", { class: "tags" }, attrs.flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]))
              : el("p", { class: "notice" }, "표시할 속성이 없어요."),
            el("div", { class: "pfoot" },
              el("span", {}, [it.likes != null ? `찜 ${fmt(it.likes)}` : null, it.reviews != null ? `후기 ${fmt(it.reviews)}` : null].filter(Boolean).join(" · ")),
              el("button", { type: "button", class: "link", onclick: () => openTab(it.productUrl || productDetailUrl(it.itemCode)) }, "쇼핑몰에서 보기 ↗"))) : null);
      })),
    ),
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
  if (ok) m.append(" ", el("a", { href: "#", onclick: (e) => { e.preventDefault(); openTab(BOARD_URL); } }, "무드보드 보기"));
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

// ── FEDIT 웹으로 이어가기 ──
$("btn-home").addEventListener("click", () => openTab(WEB_BASE));
$("btn-open-web").addEventListener("click", () => openTab(WEB_BASE));
$("btn-open-board").addEventListener("click", () => openTab(BOARD_URL));

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
