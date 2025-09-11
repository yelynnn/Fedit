import { Icon } from "@iconify/react/dist/iconify.js";
import type { ProductDetailProps } from "@/types/Product";

function formatPrice(price?: string | number) {
  if (!price) return "";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return String(price);

  return `₩${Math.floor(num).toLocaleString("ko-KR")}`;
}

function ProductBox({ product }: ProductDetailProps) {
  const {
    brand,
    category,
    product_name,
    current_price,
    regular_price,
    rating,
    reviews,
    front_image_url,
  } = product;

  return (
    <section className="flex flex-col overflow-hidden rounded-lg w-52">
      <img src={front_image_url} alt={product_name} className="w-full h-55" />
      <div className="flex flex-col w-full gap-1 p-2 bg-white ">
        <div className="flex items-center justify-between">
          <span className="text-[#91929D] text-xs mt-1">{brand}</span>
          {category && (
            <div className="flex items-center justify-center h-5 w-fit px-[6px] bg-[#ECEEF0] rounded text-xs text-[#56585A]">
              {category}
            </div>
          )}
        </div>
        <span className="w-full text-sm break-all truncate text-[#56585A]">
          {product_name}
        </span>
        <div className="flex justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#56585A]">
              {formatPrice(current_price)}
            </span>
            {regular_price && (
              <span className="text-[#888A8C] text-xs line-through">
                {formatPrice(regular_price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-[#56585A]">
            {rating && (
              <div className="flex items-center gap-1 ">
                <Icon icon="tabler:star-filled" color="#3D3F41" />
                {rating}
              </div>
            )}
            {reviews && <span>({reviews})</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductBox;
