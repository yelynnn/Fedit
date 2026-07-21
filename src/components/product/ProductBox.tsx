import type { ApiDetail } from "@/types/Product";
import defaultImg from "@/assets/logo/defaultImg.svg";
import { formatSalesCount } from "@/lib/utils";

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
    <section className="flex flex-col h-[394px] overflow-hidden rounded-none w-55 bg-white border border-surface-base">
      {/* 1. 상품 이미지 */}
      <div className="relative flex h-[220px] w-full flex-shrink-0 items-end gap-2.5 self-stretch rounded-none p-3">
        <img
          src={product.thumbnail || product.front_image_url || undefined}
          onError={(e) => { e.currentTarget.src = defaultImg; }}
          alt={product.product_name}
          className="absolute inset-0 object-cover w-full h-full"
        />
        {product.platform && (
          <div className="relative z-10 flex items-center justify-center w-5 h-5 text-white bg-tx-neutral rounded text-xs font-medium">
            {getPlatformLabel(product.platform)}
          </div>
        )}
      </div>

      <div className="flex w-full flex-col items-start gap-3 self-stretch pt-2 pr-3 pb-4 pl-3">
        {/* 2. 브랜드 & 카테고리 칩 */}
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="type-title-xsmall flex-1 truncate text-tx-default">
            {product.brand ?? ""}
          </span>
          {category && (
            <div className="flex h-5 items-center justify-center whitespace-nowrap rounded bg-line-divider px-[6px] type-title-xsmall text-tx-alt">
              {category}
            </div>
          )}
        </div>

        {/* 3. 상품명 (2줄 제한) */}
        <span className="w-full self-stretch type-body-small text-tx-strong line-clamp-2 break-all min-h-[40px]">
          {product.product_name}
        </span>

        {/* 4. 가격 */}
        <span className="text-base font-semibold text-tx-default">
          {formatPrice(product.current_price)}
        </span>

        {/* 5. 누적 조회수 & 누적 판매 (데이터가 있을 때만 렌더링) */}
        {(product.views || product.sales) && (
          <div className="flex flex-wrap gap-1">
            {product.views && (
              <div className="flex items-center justify-center gap-1 rounded bg-[var(--color-fill-normal-interaction-pressed)] px-2 py-1 type-title-xsmall text-tx-alt">
                누적조회수 {Number(product.views).toLocaleString("ko-KR")}
              </div>
            )}
            {product.sales!=1 && (
              <div className="flex items-center justify-center gap-1 rounded bg-[var(--color-fill-normal-interaction-pressed)] px-2 py-1 type-title-xsmall text-tx-alt">
                누적판매 {formatSalesCount(product.sales!)}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
