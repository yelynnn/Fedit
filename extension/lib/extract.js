// 상품 상세 페이지에서 저장·분석용 정보를 읽는다. chrome.scripting.executeScript({ func }) 로 페이지 안에서 실행되므로
// 바깥 변수·import 를 쓰면 안 된다(함수 하나로 완결).
//
// 사이트별 읽기·정리 규칙은 Crawl_Agent 크롤러를 그대로 옮겼다 — 확장으로 들어온 상품도 수집 상품과 같은 값이 되도록.
//   무신사  : brands/musinsa/crawler.py  enrich_ranking_detail · dict_to_row(strip_sku_prefix → split_dash_color → split_in_color → extract_reorder)
//   29CM    : brands/cm29/crawler.py     enrich_brand_product_detail · brand_listing_item_to_row(extract_reorder → 앞 태그 → extract_name_color)
//   W컨셉   : brands/wconcept/crawler.py enrich_wconcept_brand_detail · clean_wconcept_name · clean_wconcept_color
//   카페24  : brands/cafe24/crawler.py   item_to_row(product_name·product_price·sale_price·option_text, 상세 URL 형식)
//   공통    : core/csv_schema.py         normalize_prices · normalize_gender
// 크롤러에 없는 것: 소재(상품 고시·정보 표·설명문) — VLM 분석 힌트로 쓴다. 못 읽으면 비워 두고 VLM 이 이미지로 판단한다.
//
// opts.full=false(기본, 사이드패널이 주기적으로 읽을 때): 클릭·스크롤 없이 화면에 있는 것만 읽는다 — 사용자 화면을 움직이지 않는다.
// opts.full=true("AI로 분석하기"를 누를 때): 크롤러처럼 상품 고시·정보 탭을 펼쳐 읽고, 끝나면 원래 스크롤 위치로 돌린다.
export async function extractProduct(opts) {
  const full = Boolean(opts && opts.full);
  const scrollBack = [window.scrollX, window.scrollY];
  // ── 공통 도구 ──────────────────────────────────────────────────────────
  const clean = (s) => (s == null ? "" : String(s)).replace(/\s+/g, " ").trim();
  const text = (v) => (typeof v === "string" ? v.trim() : v == null ? null : String(v).trim()) || null;
  const meta = (n) => clean(document.querySelector(`meta[property="${n}"], meta[name="${n}"], meta[itemprop="${n}"]`)?.content) || null;
  const abs = (u) => { try { return u ? new URL(u, location.href).href : null; } catch (e) { return null; } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const host = location.hostname.replace(/^(www|m)\./, "");
  const NOT_VALUE = (v) => !v || /참고|참조/.test(v);   // "상세페이지 참조" 같은 안내 문구(크롤러와 같은 기준)

  // core/csv_schema.py _to_int_price · normalize_prices
  const toInt = (raw) => { if (raw == null) return null; const s = String(raw).replace(/[^\d.]/g, ""); if (!s) return null; const n = s.includes(".") ? Math.round(parseFloat(s)) : parseInt(s, 10); return Number.isFinite(n) ? n : null; };
  const normalizePrices = (regular, current, discount) => {
    let r = toInt(regular), c = toInt(current); const d = toInt(discount);
    if (r != null && r <= 0) r = null;
    if (c != null && c <= 0) c = null;
    if (c != null && d && d > 0 && (r == null || r <= c)) r = Math.round(c / (1 - d / 100));
    if (r != null && c != null && c < r) return { regularPrice: r, currentPrice: c, discountRate: Math.round(((r - c) / r) * 100) };
    return { regularPrice: r != null ? r : c, currentPrice: null, discountRate: null };
  };
  // core/csv_schema.py normalize_gender
  const GENDER_KO = { women: "여성", woman: "여성", female: "여성", ladies: "여성", men: "남성", man: "남성", male: "남성", mens: "남성", kids: "공용", unisex: "공용", 공용: "공용", 여성: "여성", 남성: "남성" };
  const normalizeGender = (v) => (v ? GENDER_KO[String(v).trim().toLowerCase()] || String(v).trim() : null);

  // ── 이름 정리 규칙 ───────────────────────────────────────────────────
  // 29CM·W컨셉 extract_reorder ("[7차]", "(7차_당일출고)", "[5th]") / 무신사는 "차" 표기만
  const extractReorder = (name, allowOrdinal = true) => {
    let m = name.match(/[[(](\d+)차[^\])]*[\])]/);
    if (!m && allowOrdinal) m = name.match(/\[(\d+)(?:st|nd|rd|th)\]/i);
    if (!m) return [name, ""];
    const cleaned = (name.slice(0, m.index) + name.slice(m.index + m[0].length)).trim().replace(/\s+/g, " ");
    return [cleaned || name, m[1]];
  };
  const LEADING_BRACKET_TAG = /^\[[^\]]+\]\s*/;
  // 29CM·W컨셉 extract_name_color (_classify_color_candidate 포함)
  const STYLE_TOKENS = { 미니: "미니", 롱: "롱", 숏: "숏", 미디: "미디", 리미티드: "리미티드", mini: "미니", long: "롱", short: "숏", limited: "리미티드" };
  for (const w of ["light", "heavy", "thick", "thin", "standard", "regular", "basic", "slim", "loose", "oversized", "fitted", "warm", "cool", "solid"]) if (!STYLE_TOKENS[w]) STYLE_TOKENS[w] = w.toUpperCase();
  const STYLE_SKIP_DETAILS = new Set(["리미티드"]);
  const COLOR_COUNT_TOKEN = /^\d+\s*colors?$/i;
  const classifyColor = (raw) => {
    const parts = raw.split(/[_/]/).map((p) => p.trim()).filter(Boolean);
    const list = parts.length ? parts : [raw.trim()];
    const style = []; let noise = false;
    for (const p of list) {
      if (COLOR_COUNT_TOKEN.test(p)) { noise = true; continue; }
      const s = STYLE_TOKENS[p] || STYLE_TOKENS[p.toLowerCase()];
      if (s) { noise = true; style.push(s); }
    }
    if (noise && !style.length) return ["", []];
    if (style.length) return ["", style];
    return [raw.trim(), []];
  };
  const extractNameColor = (name, fallbackStripCount) => {
    let working = name; const pending = [];
    for (;;) {
      const m = working.match(/\s*\(([^)]+)\)\s*$/) || working.match(/\s-\s([^-]+)$/) || working.match(/,\s*([A-Za-z][A-Za-z\s]{0,20})$/);
      if (!m) break;
      const [real, style] = classifyColor(m[1].trim());
      if (real) return [working.slice(0, m.index).trim(), real, pending.filter((t) => !STYLE_SKIP_DETAILS.has(t)).map((t) => `옵션: ${t}`)];
      pending.push(...style);
      working = working.slice(0, m.index).trim();
    }
    let fallback = name;
    if (fallbackStripCount) fallback = fallback.replace(/\s*\(\s*\d+\s*colors?\s*\)\s*$/i, "").replace(/[_\s]*\d+\s*colors?$/i, "").trim();
    return [fallback, "", pending.filter((t) => !STYLE_SKIP_DETAILS.has(t)).map((t) => `옵션: ${t}`)];
  };
  // 무신사 strip_sku_prefix · split_dash_color · split_in_color
  const musinsaName = (raw) => {
    let name = raw.replace(/^[A-Z]{2,6}\d{2,6}-\d{1,4}\s+/, "");
    let color = "";
    const i = name.lastIndexOf(" - ");
    if (i > 0) {
      const base = name.slice(0, i).trim();
      const tail = name.slice(i + 3).replace(/\s+[A-Za-z]{0,4}\d[A-Za-z0-9]{2,8}-[A-Za-z0-9]{2,4}$/, "").trim();
      if (base && tail) { name = base; if (!/^\d+\s*colors?$/i.test(tail)) color = tail.split(":").map((p) => p.trim()).filter(Boolean).join(","); }
    }
    if (!color) {
      const m = name.match(/\bIN\b\s+(.+)$/i);
      if (m) { const c = m[1].trim(), base = name.slice(0, m.index).trim(); if (base && c && c.length <= 20 && !/[[\]]|\d/.test(c)) { name = base; color = c; } }
    }
    const [n2, reorder] = extractReorder(name, false);
    return { name: n2, color, reorder };
  };
  // W컨셉 clean_wconcept_name · clean_wconcept_color
  const wconceptName = (raw) => {
    let [name, reorder] = extractReorder(raw);
    name = name.replace(LEADING_BRACKET_TAG, "").trim().replace(/\s*\d+종\s*택\d+\s*$/, "").trim().replace(/\s+[A-Z]{2,8}\d{2,6}$/, "").trim();
    let [n2, color, details] = extractNameColor(name, false);
    n2 = n2.replace(/\s*\(?\s*\d+\s*colors?\)?\s*$/i, "").trim();
    return { name: n2, color, reorder, details };
  };
  const wconceptColor = (raw) => {
    if (!raw) return raw;
    const out = [];
    for (let p of raw.split(",").map((x) => x.trim()).filter(Boolean)) {
      if (p.includes("-")) p = p.slice(p.lastIndexOf("-") + 1).trim();
      p = p.replace(/^\d+차_\s*/, "").trim().replace(/[_\s](?:\d+|[A-Za-z]{1,4})$/, "").trim();
      if (p && !out.includes(p)) out.push(p);
    }
    return out.length ? out.join(", ") : raw;
  };
  // 무신사 _earliest_manufacture_date
  const earliestDate = (raw) => {
    const ds = [...String(raw).matchAll(/(\d{4})[.\-/년]\s*(\d{1,2})/g)].map((m) => [+m[1], +m[2]]);
    if (!ds.length) return raw;
    ds.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return `${ds[0][0]}.${String(ds[0][1]).padStart(2, "0")}`;
  };
  // 29CM parse_count_value ("1.2만" → 12000)
  const countValue = (t) => {
    t = clean(t); if (!t) return null;
    let m;
    if ((m = t.match(/^([\d.]+)\s*만$/))) return String(Math.round(parseFloat(m[1]) * 10000));
    if ((m = t.match(/^([\d.]+)\s*천$/))) return String(Math.round(parseFloat(m[1]) * 1000));
    if ((m = t.match(/^([\d.]+)\s*[kK]$/))) return String(Math.round(parseFloat(m[1]) * 1000));
    return t.replace(/[^\d]/g, "") || null;
  };

  // ── 표·구조화 데이터 ──────────────────────────────────────────────────
  const tableRows = () => [...document.querySelectorAll("tr")].map((tr) => {
    const th = tr.querySelector("th"), td = tr.querySelector("td");
    return th && td ? [clean(th.innerText || th.textContent), clean(td.innerText || td.textContent)] : null;
  }).filter(Boolean);
  const nodes = [];
  const walk = (n) => { if (!n || typeof n !== "object") return; if (Array.isArray(n)) return n.forEach(walk); nodes.push(n); Object.values(n).forEach((v) => v && typeof v === "object" && walk(v)); };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { try { walk(JSON.parse(s.textContent)); } catch (e) {} });
  document.querySelectorAll("[schema-productgroup],[schema-breadcrumblist]").forEach((el) => {
    for (const a of ["schema-productgroup", "schema-breadcrumblist"]) { try { if (el.getAttribute(a)) walk(JSON.parse(el.getAttribute(a))); } catch (e) {} }
  });
  const isType = (n, t) => [].concat(n["@type"] || []).includes(t);
  const group = nodes.find((n) => isType(n, "ProductGroup"));
  const product = nodes.find((n) => isType(n, "Product"));
  const ld = group || product || {};
  const variant = [].concat(ld.hasVariant || [])[0] || null;
  const offers = [].concat(ld.offers || variant?.offers || [])[0] || {};
  const crumbs = [].concat(nodes.find((n) => isType(n, "BreadcrumbList"))?.itemListElement || [])
    .map((e) => clean(e.name || e.item?.name)).filter((x) => x && !/^(home|홈|홈\s*페이지)$/i.test(x));
  const firstImage = (img) => { const v = [].concat(img || [])[0]; return v ? abs(typeof v === "string" ? v : v.url || v.contentUrl) : null; };
  const brandOf = (b) => (b && typeof b === "object" ? b.name : b);
  const scriptsText = () => (self.__next_f ? self.__next_f.map((x) => x[1] || "").join("") : "") + " " + [...document.scripts].map((s) => s.textContent).join(" ");
  const pickNum = (src, key) => { const m = src.match(new RegExp('\\\\?"' + key + '\\\\?"\\s*:\\s*\\\\?"?(-?[0-9.]+)')); return m ? m[1] : null; };
  const pickStr = (src, key) => { const m = src.match(new RegExp('\\\\?"' + key + '\\\\?"\\s*:\\s*\\\\?"([^"\\\\]{1,120})')); return m ? m[1] : null; };
  const clickText = async (selector, label) => {   // 크롤러의 page.locator(":has-text(...)").click() 과 같은 동작
    if (!full) return false;
    const el = [...document.querySelectorAll(selector)].find((e) => clean(e.innerText).includes(label));
    if (el) { try { el.click(); await sleep(500); return true; } catch (e) {} }
    return false;
  };

  // 크롤러에 없는 소재: 정보 표의 소재 라벨 → 설명문의 "면 100%" 표현
  const FIBER = "(?:면|코튼|cotton|폴리에스(?:테르|터)|폴리|poly(?:ester)?|나일론|nylon|울|wool|캐시미어|cashmere|아크릴|acrylic|레이온|rayon|비스코스|viscose|모달|modal|텐셀|tencel|라이오셀|lyocell|리넨|린넨|linen|실크|silk|스판덱스|스판|spandex|엘라스테인|elastane|폴리우레탄|polyurethane|모헤어|mohair|알파카|alpaca|앙고라|angora|가죽|소가죽|양가죽|레더|leather|아세테이트|acetate|큐프라|cupra|메리노|merino)";
  const materialFromRows = (rows) => (rows.find(([k, v]) => /소재|혼용률|재질|원단|fabric|material|composition/i.test(k) && !/소재지|주소/.test(k) && !NOT_VALUE(v)) || [])[1] || null;
  const materialFromText = () => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(n.parentNode?.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    const parts = []; let n, len = 0;
    while ((n = w.nextNode()) && len < 60000) { const s = n.nodeValue.trim(); if (s) { parts.push(s); len += s.length; } }
    const unit = `(?:${FIBER}\\s*\\d{1,3}(?:\\.\\d)?\\s*%|\\d{1,3}(?:\\.\\d)?\\s*%\\s*${FIBER})`;
    const m = parts.join(" ").replace(/\d{1,3}\s*%\s*(할인|off|적립|sale)/gi, " ").match(new RegExp(`(${unit}(?:\\s*[,/·+]?\\s*${unit})*)`, "i"));
    return m ? clean(m[1]) : null;
  };

  // ── 기본값(구조화 데이터·메타) — 기존 확장과 같은 우선순위 ───────────────────
  const ogTitle = meta("og:title");
  const titleName = (s) => (s ? s.split(/\s[|\-–]\s/)[0].trim() : null);
  const usable = (s) => (s && !/^\[[^\]]*\]$/.test(s) ? s : null);
  const row = {
    site: "generic",
    productUrl: null,
    productName: usable(text(ld.name)) || usable(titleName(ogTitle)) || usable(titleName(document.title)) || null,
    brand: text(brandOf(ld.brand)) || meta("product:brand") || null,
    thumbnail: abs(meta("og:image")) || firstImage(ld.image) || firstImage(variant?.image),
    color: text(variant?.color || ld.color) || meta("product:color"),
    mainCategory: crumbs.length >= 2 ? crumbs[crumbs.length - 2] : null,
    subCategory: crumbs.length ? crumbs[crumbs.length - 1] : text(ld.category),
    gender: null, material: null, manufactureDate: null, reorder: null,
    regular: offers.price || meta("product:price:amount"), current: null, discount: null,
    likes: null, reviews: text(ld.aggregateRating?.reviewCount || ld.aggregateRating?.ratingCount), rating: text(ld.aggregateRating?.ratingValue),
    views: null, sales: null, brandLikes: null,
    details: [],
    description: text(ld.description) || meta("og:description") || meta("description"),
  };

  // ── 사이트별 (크롤러 이식) ─────────────────────────────────────────────
  if (host === "musinsa.com") {
    row.site = "musinsa";
    const goodsNo = (location.pathname.match(/\/products\/(\d+)/) || [])[1];
    if (goodsNo) row.productUrl = `https://www.musinsa.com/products/${goodsNo}`;
    try {   // 페이지 데이터(목록 API 와 같은 필드)
      const nd = JSON.parse(document.querySelector("script#__NEXT_DATA__")?.textContent || "{}");
      const q = (nd.props?.pageProps?.dehydratedState?.queries || []).map((x) => x.state?.data?.data).find((x) => x && x.goodsPrice) || nd.props?.pageProps?.meta?.data || {};
      if (q.goodsNm || q.goodsName) row.productName = text(q.goodsNm || q.goodsName);
      if (q.brandInfo?.brandName || q.brandName) row.brand = text(q.brandInfo?.brandName || q.brandName);
      row.regular = q.goodsPrice?.normalPrice ?? row.regular;
      row.current = q.goodsPrice?.finalPrice ?? q.goodsPrice?.salePrice ?? null;
      row.gender = text(q.displayGenderText || q.sexDisplay) || null;
    } catch (e) {}
    // enrich_ranking_detail 의 page.evaluate 그대로
    const raw = (() => {
      const out = {};
      const likeBtn = document.querySelector("button[class*='LikeBrand__BrandLikeButton']");
      if (likeBtn) { const span = likeBtn.querySelector("span[data-mds='Typography']"); if (span) out.brand_likes = span.innerText.trim(); }
      const likeContainer = document.querySelector('div[class*="Like__Container"] span');
      if (likeContainer) out.like_raw = likeContainer.innerText.trim();
      const cates = [...document.querySelectorAll("a[data-section-name='cate_navi'][data-button-name='상품카테고리']")]
        .map((el) => el.textContent.trim().replace(/\s*\([^)]*\)\s*$/, "").trim()).filter(Boolean);
      if (cates.length >= 2) out.main_category = cates[cates.length - 2]; else if (cates.length === 1) out.main_category = cates[0];
      if (cates.length > 0) out.category = cates[cates.length - 1];
      const star = document.querySelector("svg[data-mds='IcStar']");
      if (star) { let el = star; for (let i = 0; i < 6 && el; i++) { el = el.parentElement; if (!el) break; const t = el.innerText ? el.innerText.trim() : ""; if (t && t.length < 80 && t.includes("후기")) { out.rating_raw = t; break; } } }
      const reviewTab = [...document.querySelectorAll("span")].find((s) => s.innerText && s.innerText.includes("후기"));
      if (reviewTab) out.reviews_raw = reviewTab.innerText.trim();
      document.querySelectorAll("dl[class*='Layout__Wrap'] > div[class*='Layout__Box']").forEach((box) => {
        const dt = box.querySelector("dt"), dd = box.querySelector("dd"); if (!dt || !dd) return;
        const k = dt.innerText.trim(), v = dd.innerText.trim();
        if (k.includes("조회수")) out.views_raw = v; else if (k.includes("누적판매")) out.sales_raw = v;
      });
      const keys = ["핏", "촉감", "신축성", "비침", "두께", "계절"]; const ex = [];
      document.querySelectorAll("tr").forEach((tr) => {
        const t = tr.innerText.trim(); const key = keys.find((k) => t.includes(k)); if (!key) return;
        for (const col of tr.querySelectorAll("td")) { if (col.innerText.includes(key)) continue; ex.push(`${key}: ${col.innerText.trim()}`); break; }
      });
      out.details = ex.join(", ");
      return out;
    })();
    if (raw.brand_likes) row.brandLikes = raw.brand_likes;
    if (raw.like_raw) row.likes = raw.like_raw;
    if (raw.main_category) row.mainCategory = raw.main_category;
    if (raw.category) row.subCategory = raw.category;
    const rm = (raw.rating_raw || "").match(/\b([0-5](?:\.\d)?)\b/); if (rm) row.rating = rm[1];
    const vm = (raw.reviews_raw || "").match(/([\d,]+)/); if (vm) row.reviews = vm[1].replace(/,/g, "");
    if (raw.views_raw) row.views = raw.views_raw.split("이상")[0].trim();
    if (raw.sales_raw) row.sales = raw.sales_raw.split("이상")[0].trim();
    if (raw.details) row.details.push(raw.details);
    // "상품 고시 정보안내" 펼쳐서 제조연월(크롤러) + 소재(추가)
    if (full) {
      window.scrollTo(0, document.body.scrollHeight); await sleep(800);
      const trigger = [...document.querySelectorAll("h3")].find((h) => h.innerText.includes("상품 고시 정보안내"))?.querySelector("button");
      if (trigger) { try { trigger.click(); await sleep(400); } catch (e) {} }
    }
    const ddOf = (label) => { const dt = [...document.querySelectorAll("dt")].find((d) => d.innerText.includes(label)); return dt?.nextElementSibling?.tagName === "DD" ? clean(dt.nextElementSibling.innerText) : null; };
    const mfd = ddOf("제조연월"); if (mfd) { const v = mfd.split("(")[0].trim(); if (!NOT_VALUE(v)) row.manufactureDate = earliestDate(v); }
    const mat = ddOf("소재"); if (mat && !NOT_VALUE(mat)) row.material = mat;
    const n = musinsaName(row.productName || "");
    row.productName = n.name; if (n.color && !row.color) row.color = n.color; if (n.reorder) row.reorder = n.reorder;
  } else if (host === "29cm.co.kr" || host.endsWith(".29cm.co.kr")) {
    row.site = "29cm";
    const id = (location.pathname.match(/\/(?:products|catalog)\/(\d+)/) || [])[1];
    if (id) row.productUrl = `https://www.29cm.co.kr/products/${id}`;
    const src = scriptsText();   // 목록 API 와 같은 필드명이 페이지 데이터에 들어 있다
    row.regular = pickNum(src, "originalPrice") || pickNum(src, "consumerPrice") || row.regular;
    row.current = pickNum(src, "sellPrice") || pickNum(src, "displayPrice");
    row.likes = pickNum(src, "likeCount") || pickNum(src, "heartCount");
    row.reviews = pickNum(src, "reviewCount");
    const score = pickNum(src, "reviewScore") || pickNum(src, "averagePoint"); if (score && score !== "0") row.rating = score;
    // 분류: 경로(대 > 중 > 소)에 brand_listing_item_to_row 규칙 적용
    if (crumbs.length >= 2) {
      const [large, middle, small] = [crumbs[0], crumbs[1], crumbs[2] || ""];
      if (["단독", "해외브랜드", "더 나은 소재"].includes(middle)) { row.mainCategory = small || middle; row.subCategory = ""; }
      else { row.mainCategory = middle; row.subCategory = small; }
      for (const [prefix, g] of Object.entries({ 여성: "여성", 남성: "남성", 유아: "공용", 아동: "공용" })) if (large.startsWith(prefix)) { row.gender = g; break; }
    }
    // enrich_brand_product_detail
    for (const [label, value] of tableRows()) {
      if (label.includes("제조연월") && !NOT_VALUE(value)) row.manufactureDate = value;
      else if (label.includes("제품") && label.includes("소재") && !NOT_VALUE(value)) row.material = value;
    }
    let [name, reorder] = extractReorder(row.productName || "");
    name = name.replace(LEADING_BRACKET_TAG, "").trim();
    let [n2, color, det] = extractNameColor(name, true);
    row.productName = n2.replace(/[_\s]*\d+\s*colors?$/i, "").trim();
    if (color) row.color = color; if (reorder) row.reorder = reorder; row.details.push(...det);
  } else if (host === "wconcept.co.kr" || host.endsWith(".wconcept.co.kr")) {
    row.site = "wconcept";
    const itemCd = (location.pathname.match(/\/Product\/(\d+)/i) || [])[1];
    if (itemCd) row.productUrl = `https://www.wconcept.co.kr/Product/${itemCd}`;
    const src = scriptsText();
    row.regular = pickNum(src, "customerPrice") || pickNum(src, "salePrice") || row.regular;
    row.current = pickNum(src, "finalPrice");
    if (!row.regular && !row.current) {   // 크롤러는 목록 API 가격(customerPrice·finalPrice)을 쓴다 — 상세 페이지는 가격 상자에서 같은 값을 계산
      const box = document.querySelector(".discount_detail_box");
      if (box) {
        let regular = null, off = 0;
        for (const dt of box.querySelectorAll("dt")) {
          const label = clean(dt.textContent), amount = toInt(dt.nextElementSibling?.textContent);
          if (/정상가/.test(label)) regular = amount;
          else if (/할인/.test(label) && amount) off += amount;
        }
        if (regular) { row.regular = regular; row.current = off ? regular - off : null; }
      }
    }
    row.likes = pickNum(src, "heartCnt"); row.reviews = pickNum(src, "reviewCnt");
    const score = pickNum(src, "reviewScore"); if (score) row.rating = (+score).toFixed(1);
    const cat = pickStr(src, "categoryName");
    if (cat) {
      const parts = cat.split(/\s*>\s*/).filter(Boolean);
      row.gender = { 여성: "여성", 남성: "남성", 공용: "공용", 유아동: "공용" }[parts[0]] || row.gender;
      if (parts.length >= 2) { row.mainCategory = parts[parts.length - 2]; row.subCategory = parts[parts.length - 1]; }
    }
    // enrich_wconcept_brand_detail: "상품 정보 고시" 펼치고 표에서 소재·색상·제조년월
    await clickText("button", "상품 정보 고시");
    const n = wconceptName(row.productName || "");
    row.productName = n.name; if (n.color) row.color = n.color; if (n.reorder) row.reorder = n.reorder; row.details.push(...n.details);
    for (const [label, value] of tableRows()) {
      if (!value || NOT_VALUE(value)) continue;
      if (label === "소재") row.material = value;
      else if (label === "색상") row.color = wconceptColor(value);
      else if (label === "제조년월") row.manufactureDate = value;
    }
  } else if (host === "zara.com" && /-p\d{6,}\.html$/.test(location.pathname)) {
    // 자라: 화면 이동이 페이지 안에서만 일어나 메타·og 태그가 처음 연 페이지(홈 로고 등) 그대로 남는다 →
    // 상품 주소에 ?ajax=true 를 붙인 상품 데이터(크롤러가 쓰는 API 와 같은 필드)로 읽는다. brands/zara/crawler.py 규칙.
    row.site = "zara";
    row.productUrl = location.origin + location.pathname;   // 상품 데이터를 못 받아도 상품 페이지로 본다(아래에서 크롤러 주소로 바꿈)
    try {
      const res = await fetch(location.pathname + "?ajax=true", { headers: { Accept: "application/json" }, credentials: "include" });
      const p = (await res.json()).product || {};
      const colors = p.detail?.colors || [];
      const v1 = new URLSearchParams(location.search).get("v1");   // 고른 색상(상품 id)
      const c = colors.find((x) => String(x.productId) === v1) || colors[0] || {};
      // parse_product_name: "[1.2만장 판매]", "[3차 재입고]" 떼기
      let name = clean(p.name);
      const sales = name.match(/\[([0-9]+(?:\.[0-9]+)?[만천]?)장?\s*판매\]/); if (sales) { row.sales = countValue(sales[1]); name = name.replace(sales[0], ""); }
      const re = name.match(/\[([0-9]+)차\s*재입고\]/i); if (re) { row.reorder = re[1]; name = name.replace(re[0], ""); }
      if (name) row.productName = clean(name);
      row.brand = "ZARA";
      // extract_colors: 메인 이미지(originalName 'p') 우선, {width} → 1280
      const media = c.xmedia || p.xmedia || [];
      const img = media.find((m) => m.extraInfo?.originalName === "p") || media[0];
      const url = img && (img.extraInfo?.deliveryUrl || img.url);
      if (url) row.thumbnail = url.replace("{width}", "1280");
      if (c.name) row.color = c.name.replace(/\s*\/\s*/g, ",");
      // normalize_price: 가끔 오는 센트 단위(×100) 보정
      const won = (v) => { const n = toInt(v); return n != null && n > 1000000 && n % 100 === 0 ? n / 100 : n; };
      row.regular = won(c.oldPrice) || won(c.price); row.current = c.oldPrice ? won(c.price) : null;
      row.subCategory = text(p.familyName) || row.subCategory; row.mainCategory = null;
      row.gender = { WOMAN: "여성", MAN: "남성", KID: "공용", KIDS: "공용" }[String(p.sectionName || "").toUpperCase()] || null;
      // 소재: "겉감: 폴리에스터 30%, 아크릴 25%"
      const parts = (p.detail?.detailedComposition?.parts || []).map((part) => {
        const comps = (part.components || []).map((x) => [x.material, x.percentage].filter(Boolean).join(" ")).filter(Boolean).join(", ");
        return comps ? (part.description ? `${part.description}: ${comps}` : comps) : null;
      }).filter(Boolean);
      if (parts.length) row.material = parts.join(" / ");
      const desc = clean(c.description || c.rawDescription);
      if (desc) row.description = desc;
      const seo = p.seo || {}, locale = (location.pathname.match(/^\/[a-z]{2}\/[a-z]{2}\//) || ["/kr/ko/"])[0];
      if (seo.keyword && seo.seoProductId) row.productUrl = `${location.origin}${locale}${seo.keyword}-p${seo.seoProductId}.html`;
    } catch (e) {}
  } else if (window.iProductNo && typeof window.product_name !== "undefined") {
    // 카페24 (item_to_row 와 같은 필드: product_name · product_price · sale_price · option_text)
    row.site = "cafe24";
    // 카페24 자사몰은 og:image 를 쇼핑몰 로고로 고정해 둔 곳이 많다(예: 999humanity.png) — 상품 이미지 폴더(/web/product/big·extra·medium)를 먼저
    // 카페24 상세 이미지(BigImage = 대표, ThumbImage = 같은 상품 추가 사진) 중 화면에 실제로 뜬 첫 장(가로 300px 이상).
    // 깨진 대표 이미지(404)는 건너뛰고, 아래 추천·관련 상품 썸네일(thumb-img 등)은 쓰지 않는다.
    const cafeImgs = [...document.querySelectorAll("img.BigImage, img.ThumbImage, .keyImg img, .xans-product-image img")]
      .filter((i) => !i.closest('[class*="relation" i], [class*="recommend" i], [class*="listnormal" i], [class*="listmain" i]'));
    const cafeImg = cafeImgs.find((i) => i.naturalWidth >= 300) || null;
    if (cafeImg) row.thumbnail = abs(cafeImg.currentSrc || cafeImg.src);
    row.productUrl = `${location.origin}/product/detail.html?product_no=${window.iProductNo}`;
    row.productName = clean(String(window.product_name).replace(/<[^>]+>/g, "")) || row.productName;
    row.regular = window.product_price || row.regular;
    const sale = window.product_sale_price || document.querySelector("#span_product_price_sale")?.textContent;
    if (sale) row.current = sale;
    const mapper = String(window.option_name_mapper || "").split("#$%");
    const ci = mapper.findIndex((x) => /색상|컬러|color/i.test(x));
    if (ci >= 0) {
      const opts = [...document.querySelectorAll(`select#product_option_id${ci + 1} option`)].map((o) => clean(o.textContent))
        .filter((t) => t && t !== clean(mapper[ci]) && !/^-|선택|필수|empty|^(색상|컬러|color)$/i.test(t)).map((t) => t.replace(/\s*\[.*$/, "").replace(/\s*\(.*품절.*\)$/, "").trim());
      if (opts.length) row.color = [...new Set(opts)].join(",");
    }
  }

  // og:image 가 사이트 공용 이미지(로고·대표 배너)인 경우 — 페이지 안 이동 사이트(자라 등)나 공유 이미지를 고정해 둔 사이트.
  // 구조화 데이터의 상품 이미지 → 없으면 화면의 가장 큰 이미지로(아래 biggestImage)
  const siteWideImage = (u) => /logo|[/_.-]og(?:[/_.-]|img|image)|\/bi\/|share[_-]?(?:image|img)|default[_-]?(?:og|share|image)/i.test(String(u || "").split("?")[0]);
  // 주소만 있고 파일이 없는 값(예: https://img.ssfshop.com/)은 이미지가 아니다
  if (row.thumbnail) { try { const tp = new URL(row.thumbnail).pathname; if (tp === "/" || !tp) row.thumbnail = null; } catch (e) { row.thumbnail = null; } }
  if (row.thumbnail && siteWideImage(row.thumbnail)) {
    const ldImg = firstImage(ld.image) || firstImage(variant?.image);
    row.thumbnail = ldImg && !siteWideImage(ldImg) ? ldImg : null;
  }

  // ── 범용 규칙: 사이트 규칙이 없거나 비어 있는 칸만 채운다 ─────────────────────────
  //   ① 정보 표(th/td·dt/dd·"라벨: 값") → ② 비면 접힌 탭(상품 고시·소재·FABRIC·DETAIL) 펼쳐 다시 → ③ 설명문 속 "면 100%"
  const LABELS = {
    material: /^(?!.*(소재지|주소)).*(소재|혼용|재질|원단|겉감|본체|바디|fabric|material|composition)/i,
    color: /^(색상|컬러|color|colour)/i, manufactureDate: /제조\s*(연|년)월|제조일/,
    origin: /원산지|제조국|country of origin/i, 핏: /^핏$|^fit$/i, 촉감: /촉감/, 신축성: /신축/, 비침: /비침/, 두께: /두께/, 계절: /^계절/, 안감: /안감/,
  };
  const FIBER_RE = new RegExp(FIBER, "i");
  const readSpec = () => {
    const kv = [];
    const lines = (el) => clean(((el && (el.innerText || el.textContent)) || "").split(/\n+/).map((s) => s.trim()).filter(Boolean).join(" / "));
    const push = (k, v) => { k = clean(k).replace(/[:：]$/, ""); v = clean(v); if (k && v && k.length <= 20 && v.length <= 600 && k !== v) kv.push([k, v]); };
    document.querySelectorAll("tr").forEach((tr) => { const th = tr.querySelector("th"), td = tr.querySelector("td"); if (th && td) push(th.textContent, lines(td)); else { const tds = tr.querySelectorAll("td"); if (tds.length === 2) push(tds[0].textContent, lines(tds[1])); } });
    document.querySelectorAll("dt").forEach((dt) => { const dd = dt.nextElementSibling; if (dd && dd.tagName === "DD") push(dt.textContent, lines(dd)); });
    document.querySelectorAll("li, p, span, div").forEach((el) => { if (el.children.length > 2) return; const m = clean(el.textContent).match(/^([가-힣A-Za-z ()/]{1,14})\s*[:：]\s*(.{1,300})$/); if (m) push(m[1], m[2]); });
    const spec = {};
    for (const [k, v] of kv) for (const [f, re] of Object.entries(LABELS)) {
      if (spec[f] || !re.test(k) || NOT_VALUE(v) || /상세\s*(페이지|이미지)/.test(v)) continue;
      if (f === "material" && !FIBER_RE.test(v) && !/%/.test(v)) continue;
      spec[f] = v;
    }
    return spec;
  };
  const fill = (spec) => {
    if (!row.material && spec.material) row.material = spec.material;
    if (!row.color && spec.color) row.color = spec.color;
    if (!row.manufactureDate && spec.manufactureDate) {
      const d = earliestDate(spec.manufactureDate), y = +(String(d).match(/^(\d{4})\./) || [])[1];
      if (y >= 2015 && y <= new Date().getFullYear() + 1) row.manufactureDate = d;   // "2005.01" 같은 엉뚱한 값은 버린다
    }
    const extra = ["핏", "촉감", "신축성", "비침", "두께", "계절", "안감"].filter((k) => spec[k] && !row.details.some((d) => d.includes(`${k}:`))).map((k) => `${k}: ${spec[k]}`);
    if (extra.length) row.details.push(extra.join(", "));   // 무신사 크롤러 details 와 같은 "키: 값, 키: 값" 형식
    if (spec.origin && !row.details.some((d) => d.includes("원산지"))) row.details.push(`원산지: ${spec.origin}`);
  };
  fill(readSpec());
  if (full && (!row.material || (row.site === "generic" && !row.color))) {
    const OPEN_RE = /상품\s*(정보)?\s*고시|정보\s*제공\s*고시|상세\s*(정보|내역)|소재|혼용|fabric|composition|material|detail|care/i;
    let opened = 0;
    for (const el of document.querySelectorAll('button, summary, [role="tab"], [aria-expanded="false"], li, h3, h4, a')) {
      if (opened >= 8) break;
      const label = (el.innerText || "").trim();
      if (!label || label.length > 30 || !OPEN_RE.test(label)) continue;
      if (el.tagName === "A") { const h = el.getAttribute("href") || ""; if (h && !h.startsWith("#") && !h.startsWith("javascript")) continue; }   // 페이지 이동 링크는 누르지 않는다
      try { el.click(); opened++; } catch (e) {}
    }
    if (opened) { await sleep(700); fill(readSpec()); }
  }
  if (!row.material) row.material = materialFromText();

  if (row.site === "generic") {
    // 상품명 끝 색상(29CM·W컨셉 크롤러 extract_name_color 규칙) — 규칙 없는 브랜드 사이트용
    if (row.productName) {
      const [name, reorder] = extractReorder(row.productName);
      const [n2, color, det] = extractNameColor(name.replace(LEADING_BRACKET_TAG, "").trim(), true);
      if (color && !row.color) { row.productName = n2; row.color = color; }
      if (reorder) row.reorder = reorder;
      row.details.push(...det);
    }
    // 카테고리: 구조화 데이터에 없으면 화면 경로(breadcrumb)
    if (!row.mainCategory && !row.subCategory) {
      const bc = document.querySelector('nav[aria-label*="breadcrumb" i], [class*="breadcrumb" i], [class*="location" i]');
      const path = bc ? [...new Set([...bc.querySelectorAll("a, li, span")].map((e) => clean(e.textContent)).filter((x) => x && x.length < 20 && !/^(home|홈|>|\/)$/i.test(x)))] : [];
      if (path.length >= 2) { row.mainCategory = path[path.length - 2]; row.subCategory = path[path.length - 1]; } else if (path.length === 1) row.subCategory = path[0];
    }
  }
  if (row.site === "generic" || row.site === "cafe24") {   // 카페24 크롤러는 설명을 안 모은다 — 범용 규칙으로 보충
    // 상세 설명: 짧거나 상품명과 같으면 상세 영역 중 상품 정보 단어가 많은 곳
    if (!row.description || row.description.length < 60 || row.description === row.productName) {
      const BAD = /review|comment|footer|company|qna|recommend|후기/i;
      let best = "", score = -1;
      for (const el of document.querySelectorAll('#prdDetail, #prdInfo, [class*="detail" i], [id*="detail" i], [class*="description" i], [id*="description" i], [class*="product-info" i], [class*="productInfo"]')) {
        if (el.closest("footer, header, nav") || BAD.test(`${el.className || ""} ${el.id || ""}`)) continue;
        const tx = clean(el.innerText); if (tx.length < 20 || tx.length > 20000) continue;
        const s = (tx.match(/소재|혼용|세탁|사이즈|실측|핏|두께|신축|원단|fabric|care|cotton|%/gi) || []).length * 50 - (/사업자등록번호|통신판매/.test(tx) ? 500 : 0) + Math.min(tx.length, 3000) / 100;
        if (s > score) { score = s; best = tx; }
      }
      if (best) row.description = best.slice(0, 1500);
    }
  }

  // 상세 링크: 사이트 규칙 → canonical → og:url → 현재 주소(추적 파라미터 제거)
  const strip = (u) => { try { const x = new URL(u); [...x.searchParams.keys()].forEach((k) => /^(utm_|fbclid|gclid|igshid|n_|nt_|ref$|_ga|mc_|spm|scm)/i.test(k) && x.searchParams.delete(k)); x.hash = ""; return x.href; } catch (e) { return u; } };
  const canon = abs(document.querySelector('link[rel="canonical"]')?.href) || abs(meta("og:url"));
  const productUrl = row.productUrl || strip(canon && /^https?:/.test(canon) ? canon : location.href);

  // 설명 원문 정리: AI 파이프라인이 AI 개요 앞에 그대로 붙이는 값이라 화면 버튼·가격·슬라이드 문구·사이즈 표 숫자를 뺀다
  const cleanDescription = (s) => {
    if (!s) return s;
    let x = clean(s)
      .replace(/캐러셀,\s*해당 슬라이드로 이동\s*\d+/g, " ").replace(/\b\d+\s*\/\s*\d+\b/g, " ")
      .replace(/(KRW|₩|\$)\s*[\d.,]+|[\d,]{4,}\s*원/g, " ")
      .replace(/Previous|Next|ADD TO CART|BUY NOW|장바구니(에 추가하기|담기)?|바로\s*구매(하기)?|사이즈\s*(선택|차트|가이드)|무료\s*배송 및 반품|prev|next/gi, " ");
    if (row.productName) x = x.split(row.productName).join(" ");
    const parts = x.split(/(?<=[.!?。])\s+|\s\/\s|\s-\s/).map((p) => p.trim()).filter((p) => {
      if (p.length < 4) return false;
      const digits = (p.match(/\d/g) || []).length;
      return digits / p.length < 0.3;   // "옷길이75 어깨너비64…" 같은 실측 표 문장 제외
    }).filter((p) => !/\bvar\s|\bfunction\b|\$\(|[{};]|=>/.test(p));   // 페이지 스크립트 코드 제외

    return clean(parts.join(" ")).slice(0, 1200);
  };
  row.description = cleanDescription(row.description);

  if (full) {   // 탭을 누른 뒤 사이트가 늦게 스크롤을 옮기는 경우가 있어 잠깐 뒤 한 번 더 되돌린다
    try { window.scrollTo(scrollBack[0], scrollBack[1]); await sleep(300); window.scrollTo(scrollBack[0], scrollBack[1]); } catch (e) {}
  }
  // 범용 사이트: 고른 사진이 정말 이 페이지의 상품 사진인지 같은 페이지 안에서 상대 비교로 확인한다(창 크기와 무관).
  //  - 화면에 떠 있으면: 화면 속 가장 큰 사진의 절반보다 작으면(로고 등) 가장 큰 사진으로
  //  - 화면에 없으면: 원본 해상도가 작거나(가로 300 미만) 가로로 긴 공유용 배너(가로/세로 1.6 초과)일 때만 가장 큰 사진으로
  //  - 비교할 사진이 없으면 그대로
  if (row.site === "generic" && row.thumbnail) {
    const key = (u) => String(u || "").split("?")[0].replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const file = (u) => key(u).split("/").pop();
    const shown = [...document.querySelectorAll("img")].map((img) => {
      const r = img.getBoundingClientRect();
      return { src: abs(img.currentSrc || img.src), area: r.width * r.height, nw: img.naturalWidth || 0 };
    }).filter((x) => x.src && x.area > 0 && x.nw >= 300);
    const largest = shown.reduce((a, b) => (b.area > (a ? a.area : 0) ? b : a), null);
    if (largest) {
      const hit = shown.find((x) => key(x.src) === key(row.thumbnail) || file(x.src) === file(row.thumbnail));
      if (hit) {
        if (hit.area < largest.area * 0.5) row.thumbnail = largest.src;
      } else {
        const size = await new Promise((resolve) => {
          const im = new Image(); const t = setTimeout(() => resolve(null), 2500);
          im.onload = () => { clearTimeout(t); resolve([im.naturalWidth, im.naturalHeight]); };
          im.onerror = () => { clearTimeout(t); resolve([0, 0]); };
          im.src = row.thumbnail;
        });
        if (size && (size[0] < 300 || size[0] / Math.max(1, size[1]) > 1.6)) row.thumbnail = largest.src;
      }
    }
  }
  const prices = normalizePrices(row.regular, row.current, row.discount);
  // 상품 페이지 판별: 사이트 규칙이 있으면 상품 번호를 읽었는지로, 없으면 구조화 데이터·메타로.
  // 홈(/·/kr/ko/)·목록(ItemList·CollectionPage 만 있고 Product 없음)은 상품 페이지가 아니다.
  const isHome = /^\/(?:[a-z]{2}(?:[-_][a-z]{2})?\/){0,2}(?:index\.html?)?$/i.test(location.pathname);
  const listingPath = /(?:^|[/_-])(?:list|category|categories|search|collections?)(?:\.php|\.html?|\/|$)/i.test(location.pathname)
    && !/(?:product_no|index_no|goods_?no|item_?id|prd_?no)=|\/products\/[^/]+\/?$|\/\d{3,}(?:\/|$)|-p\d+\.html/i.test(location.pathname + location.search);   // 예: /shop/list.php?cate=…, 카페24 /product/list.html?cate_no=… (Shopify /collections/x/products/y 는 상품)
  const isListing = !group && !product && (listingPath || nodes.some((n) => isType(n, "ItemList") || isType(n, "CollectionPage") || isType(n, "OfferCatalog")));
  const pageKind = row.site !== "generic"
    ? (row.productUrl ? "product" : "notProduct")
    : isHome || isListing ? "notProduct"
    : group || product || meta("og:type") === "product" || meta("product:price:amount") ? "product" : "unknown";
  const description = [row.description, ...row.details].filter(Boolean).join(" / ");
  const biggestImage = () => { let best = null, area = 0; document.querySelectorAll("img").forEach((img) => { const a = (img.naturalWidth || 0) * (img.naturalHeight || 0); if (a > area && img.naturalWidth >= 300) { area = a; best = img.currentSrc || img.src; } }); return abs(best); };

  return {
    // 기존 필드 (백엔드·사이드패널이 쓰는 이름 그대로)
    url: location.href,
    platform: location.hostname.replace(/^www\./, ""),
    productName: row.productName ? row.productName.slice(0, 300) : null,
    brand: row.brand ? clean(row.brand).slice(0, 100) : null,
    thumbnail: row.thumbnail || biggestImage(),
    description: description ? description.slice(0, 2000) : null,
    color: row.color ? clean(clean(row.color).split(/[₩$]|\d{1,3}(?:,\d{3})+\s*원/)[0]).slice(0, 255) || null : null,
    category: [row.mainCategory, row.subCategory].filter(Boolean).join(" > ") || null,
    currentPrice: prices.currentPrice,
    regularPrice: prices.regularPrice,
    isProductPage: pageKind === "product",
    // product: 상품 상세 / notProduct: 홈·목록·기획전이 확실함(분석 막음) / unknown: 판단 못 함(분석은 허용, 안내만)
    pageKind,
    // 추가 필드 (크롤러 표준 행과 같은 의미)
    site: row.site,
    productUrl,
    mainCategory: row.mainCategory || null,
    subCategory: row.subCategory || null,
    gender: normalizeGender(row.gender),
    material: row.material ? clean(row.material).slice(0, 500) : null,
    manufactureDate: row.manufactureDate || null,
    reorder: row.reorder || null,
    discountRate: prices.discountRate,
    likes: countValue(row.likes),
    reviews: countValue(row.reviews),
    rating: row.rating || null,
    views: row.views || null,
    sales: row.sales || null,
    brandLikes: row.brandLikes || null,
  };
}
