import { Icon } from "@iconify/react/dist/iconify.js";
import type { ProductDetailProps } from "@/types/Product";

function ProductBox({ product }: ProductDetailProps) {
  const {
    brand,
    category,
    product_name,
    current_price,
    regular_price,
    rating,
    reviews,
    image_url,
  } = product;

  return (
    <section className="flex flex-col w-48 gap-1">
      <img src={image_url} alt={product_name} className="w-full h-55" />
      <span className="text-[#91929D] text-sm mt-1">
        {brand} / {category}
      </span>
      <span className="w-full break-all truncate">{product_name}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold">₩{current_price}</span>
        {regular_price && (
          <span className="text-[#91929D] text-sm line-through">
            ₩{regular_price}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-[#23263B]">
        {rating && (
          <div className="flex items-center gap-1">
            <Icon icon="tabler:star-filled" />
            {rating}
          </div>
        )}
        {reviews && <span>({reviews})</span>}
      </div>
    </section>
  );
}

export default ProductBox;
