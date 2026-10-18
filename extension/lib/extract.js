// 상품 상세 페이지에서 저장용 정보를 읽는다. chrome.scripting.executeScript({ func }) 로 페이지 안에서 실행되므로
// 바깥 변수·import 를 쓰면 안 된다(함수 하나로 완결).
// 무신사·29CM·W컨셉·자라·COS 상품 페이지에서 확인(2026-10-18): JSON-LD(Product/ProductGroup) → og 메타 → 페이지 제목 순.
export function extractProduct() {
  const meta = (name) =>
    document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content?.trim() || null;
  const text = (v) => (typeof v === "string" ? v.trim() : v == null ? null : String(v).trim()) || null;
  const abs = (u) => {
    if (!u) return null;
    try { return new URL(u, location.href).href; } catch { return null; }
  };
  const firstImage = (img) => {
    if (!img) return null;
    if (Array.isArray(img)) return firstImage(img[0]);
    if (typeof img === "object") return img.url || img.contentUrl || null;
    return img;
  };
  const won = (v, currency) => {
    if (v == null) return null;
    const n = Math.round(Number(String(v).replace(/[^0-9.]/g, "")));
    if (!Number.isFinite(n) || n <= 0) return null;
    // 원화인데 1,000 미만이면 다른 단위(예: 자라 JSON-LD 899)로 보고 버린다
    if ((!currency || currency === "KRW") && n < 1000) return null;
    return n;
  };

  // JSON-LD
  const nodes = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(walk);
    nodes.push(n);
    if (n["@graph"]) walk(n["@graph"]);
  };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try { walk(JSON.parse(s.textContent)); } catch { /* 깨진 JSON-LD 무시 */ }
  });
  const isType = (n, t) => [].concat(n["@type"] || []).includes(t);
  const group = nodes.find((n) => isType(n, "ProductGroup")) || null;
  const product = nodes.find((n) => isType(n, "Product")) || null;
  const variant = group && Array.isArray(group.hasVariant) ? group.hasVariant[0] : null;
  const ld = product || variant || group || {};
  const offers = [].concat(ld.offers || (variant && variant.offers) || [])[0] || {};
  const breadcrumb = nodes.find((n) => isType(n, "BreadcrumbList"));
  const crumbs = breadcrumb && Array.isArray(breadcrumb.itemListElement)
    ? breadcrumb.itemListElement.map((e) => text(e.name || (e.item && e.item.name))).filter(Boolean)
    : [];

  // 대표 이미지가 없으면 화면에서 가장 큰 이미지
  const biggestImage = () => {
    let best = null, area = 0;
    document.querySelectorAll("img").forEach((img) => {
      const r = img.getBoundingClientRect();
      const src = img.currentSrc || img.src;
      if (r.width >= 200 && r.height >= 200 && r.width * r.height > area && src && !src.startsWith("data:")) {
        best = src;
        area = r.width * r.height;
      }
    });
    return best;
  };

  const siteName = (meta("og:site_name") || "").split(/\s[-|–]\s/)[0].trim() || null;
  const brandOf = (b) => (b && typeof b === "object" ? b.name : b);
  const ogTitle = meta("og:title");
  const titleName = (s) => (s ? s.split(/\s[|\-–]\s/)[0].trim() : null);
  // "[W CONCEPT]" 처럼 대괄호만 있는 제목은 상품명이 아니다
  const usable = (s) => (s && !/^\[[^\]]*\]$/.test(s) ? s : null);

  let name = usable(text(group?.name)) || usable(text(ld.name)) || usable(titleName(ogTitle)) || usable(titleName(document.title));
  let brand = text(brandOf(group?.brand) || brandOf(ld.brand)) || meta("product:brand");
  // "[브랜드]상품명" 형식(W컨셉 등)에서 브랜드를 뗀다
  const bracket = name && name.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (bracket && !brand && !/단독|한정|무료|세일|sale/i.test(bracket[1])) {
    brand = bracket[1].trim();
    name = bracket[2].trim();
  }
  brand = brand || siteName;

  const description = text(group?.description) || text(ld.description) || meta("og:description") || meta("description");

  return {
    url: location.href,
    platform: location.hostname.replace(/^www\./, ""),
    productName: name ? name.slice(0, 300) : null,
    brand: brand ? brand.slice(0, 100) : null,
    thumbnail: abs(meta("og:image") || firstImage(ld.image) || firstImage(variant?.image) || biggestImage()),
    description: description ? description.slice(0, 2000) : null,
    color: text(ld.color || variant?.color) || meta("product:color"),
    category: crumbs.length ? crumbs.slice(-2).join(" > ") : text(ld.category),
    currentPrice: won(offers.price || meta("product:price:amount"), offers.priceCurrency || meta("product:price:currency")),
    regularPrice: null,
    isProductPage: Boolean(product || group || meta("og:type") === "product" || meta("product:price:amount")),
  };
}
