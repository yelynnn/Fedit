// 상품 가격 표시 규칙 — 상품 박스·상세가 같이 쓴다.
//
// current_price는 할인가라 할인 중이 아닌 상품(예: 띠어리)은 비어 있고
// regular_price(정가)에만 값이 있다. 그래서 판매가는 할인가가 없으면 정가로
// 보여주고, 취소선 정가는 할인가가 따로 있고 정가와 다를 때만 보여준다.

export function formatPrice(price?: string | number | null) {
  if (price === null || price === undefined || price === "") return "";
  if (typeof price === "string" && /[₩$€¥]/.test(price)) return price;
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!isFinite(n)) return String(price);
  return `₩${Math.floor(n).toLocaleString("ko-KR")}`;
}

export function getDisplayPrices(product: {
  current_price?: string | number | null;
  regular_price?: string | number | null;
}) {
  const current = formatPrice(product.current_price);
  const regular = formatPrice(product.regular_price);
  return {
    // 지금 파는 가격(할인가, 없으면 정가)
    price: current || regular,
    // 할인 전 정가 — 할인가가 있고 정가와 다를 때만
    originalPrice: current && regular && regular !== current ? regular : "",
  };
}
