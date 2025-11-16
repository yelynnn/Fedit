import { Icon } from "@iconify/react/dist/iconify.js";
import type { ApiDetail } from "@/types/Product";

function formatPrice(price?: string | number | null) {
  if (price === null || price === undefined || price === "") return "";

  if (typeof price === "string" && /[₩$€¥]/.test(price)) {
    return price;
  }

  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!isFinite(n)) return String(price);

  return `₩${Math.floor(n).toLocaleString("ko-KR")}`;
}

export default function ProductBox({ product }: { product: ApiDetail }) {
  const category =
    product.categories?.[0]?.main_category ??
    product.categories?.[0]?.category ??
    "";

  return (
    <section className="flex flex-col overflow-hidden rounded-lg w-52">
      <img
        src={product.front_image_url ?? ""}
        alt={product.product_name}
        className="object-cover w-full h-55"
      />
      <div className="flex flex-col w-full gap-1 p-2 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[#3D3F41] text-sm mt-1">
            {product.brand ?? ""}
          </span>
          {category && (
            <div className="flex items-center justify-center h-5 w-fit px-[6px] bg-[#ECEEF0] rounded text-xs text-[#3D3F41]">
              {category}
            </div>
          )}
        </div>

        <span className="w-full font-semibold text-base break-all truncate text-[#242628]">
          {product.product_name}
        </span>

        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#6F7173]">
              {formatPrice(product.current_price)}
            </span>
            {product.regular_price != null && product.regular_price !== "" && (
              <span className="text-[#6F7173] text-sm font-semibold">
                {/* {formatPrice(product.regular_price)} */}
                {product.discount_rate}%
              </span>
            )}
          </div>

          <div className="flex items-center font-semibold gap-1 text-sm text-[#A1A3A5]">
            {product.rating != null && (
              <div className="flex items-center gap-1 text-[#3D3F41]">
                <Icon icon="tabler:star-filled" color="#3D3F41" />
                {product.rating}
              </div>
            )}
            {product.reviews != null && <span>({product.reviews})</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
