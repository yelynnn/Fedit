import type { ApiDetail } from "@/types/Product";
import defaultImg from "@/assets/logo/defaultImg.svg";

// 가격 포맷팅 함수 (기존 유지)
function formatPrice(price?: string | number | null) {
  if (price === null || price === undefined || price === "") return "";
  if (typeof price === "string" && /[₩$€¥]/.test(price)) return price;
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!isFinite(n)) return String(price);
  return `₩${Math.floor(n).toLocaleString("ko-KR")}`;
}

export default function ProductBox({ product }: { product: ApiDetail }) {
  const category =
    product.categories?.[0]?.main_category ??
    product.categories?.[0]?.category ??
    "";

  // 플랫폼 텍스트 변환 매핑
  const getPlatformLabel = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("무신사")) return "무";
    if (p.includes("wconcept")) return "W";
    if (p.includes("29cm")) return "29";
    return p;
  };

  return (
    <section className="flex flex-col h-93 overflow-hidden rounded-lg w-55 bg-white border border-surface-base">
      {/* 1. 상품 이미지 */}
      <div className="relative w-full h-55">
        <img
          src={product.thumbnail || product.front_image_url || undefined}
          onError={(e) => { e.currentTarget.src = defaultImg; }}
          alt={product.product_name}
          className="object-cover w-full h-full"
        />
        {product.platform && (
          <div className="absolute bottom-2 left-2 flex items-center justify-center w-5 h-5 text-white bg-tx-neutral rounded text-xs font-medium">
            {getPlatformLabel(product.platform)}
          </div>
        )}
      </div>

      <div className="flex flex-col w-full gap-2 p-2">
        {/* 2. 브랜드 & 카테고리 칩 */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-tx-neutral text-xs font-medium truncate flex-1">
            {product.brand ?? ""}
          </span>
          {category && (
            <div className="flex items-center justify-center h-5 px-[6px] bg-line-divider rounded text-[10px] text-tx-alt whitespace-nowrap">
              {category}
            </div>
          )}
        </div>

        {/* 3. 상품명 (2줄 제한) */}
        <span className="w-full font-semibold text-sm leading-snug break-all text-tx-default line-clamp-2 min-h-[40px]">
          {product.product_name}
        </span>

        {/* 4. 가격 */}
        <span className="text-base font-bold text-tx-default">
          {formatPrice(product.current_price)}
        </span>

        {/* 5. 누적 조회수 & 누적 판매 (데이터가 있을 때만 렌더링) */}
        {(product.views || product.sales) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.views && (
              <div className="px-2 py-1 bg-falling-bg text-data-blue text-xs font-semibold rounded-md">
                누적조회수 {Number(product.views).toLocaleString("ko-KR")}
              </div>
            )}
            {product.sales!=1 && (
              <div className="px-2 py-1 bg-data-orange-light text-status-warning text-xs font-semibold rounded-md">
                누적판매 {Number(product.sales).toLocaleString("ko-KR")}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
