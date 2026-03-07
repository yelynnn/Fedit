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
    <section className="flex flex-col overflow-hidden rounded-lg w-55 bg-white border border-[#F2F4F6]">
      {/* 1. 상품 이미지 */}
      <img
        src={product.front_image_url || defaultImg}
        alt={product.product_name}
        className="object-cover w-full h-55"
      />

      <div className="flex flex-col w-full gap-2 p-2">
        {/* 2. 브랜드 & 카테고리 칩 */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[#3D3F41] text-xs font-medium truncate flex-1">
            {product.brand ?? ""}
          </span>
          {category && (
            <div className="flex items-center justify-center h-5 px-[6px] bg-[#ECEEF0] rounded text-[10px] text-[#6F7173] whitespace-nowrap">
              {category}
            </div>
          )}
        </div>

        {/* 3. 상품명 (2줄 제한) */}
        <span className="w-full font-semibold text-sm leading-snug break-all text-[#242628] line-clamp-2 min-h-[40px]">
          {product.product_name}
        </span>

        {/* 4. 가격 */}
        <span className="text-base font-bold text-[#242628]">
          {formatPrice(product.current_price)}
        </span>

        {/* 5. 누적 조회수 & 누적 판매 (데이터가 있을 때만 렌더링) */}
        {(product.views || product.sales) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.views && (
              <div className="px-2 py-1 bg-[#EAF2FE] text-[#1A75FF] text-xs font-semibold rounded-md">
                누적조회수 {product.views}
              </div>
            )}
            {product.sales && (
              <div className="px-2 py-1 bg-[#FFF5E9] text-[#FF9528] text-xs font-semibold rounded-md">
                누적판매 {product.sales}
              </div>
            )}
          </div>
        )}

        {product.platform && (
          <div className="flex mt-1">
            <div className="flex items-center justify-center w-5 h-5 text-white bg-[#3D3F41] rounded text-xs font-medium">
              {getPlatformLabel(product.platform)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
