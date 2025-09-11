import { useProductStore } from "@/stores/ProductStore";
import type { ProductType } from "@/types/Filter";

function ProductDetailBox({
  product_name,
  color_text,
  color,
  material,
  product_image_url,
  itemcode,
}: ProductType) {
  const { setSelectedProductId } = useProductStore((state) => state);

  return (
    <section
      className="flex p-2 overflow-hidden w-82 h-26"
      onClick={() => setSelectedProductId(itemcode)}
    >
      <img
        src={product_image_url}
        alt={product_name}
        className="flex-shrink-0 mr-5 rounded-md w-22 h-22"
      />
      <div className="flex flex-col flex-1 min-w-0 font-semibold">
        <span className="mb-3 text-[#56585A] text-sm truncate">
          {product_name}
        </span>

        <div className="flex items-center min-w-0 my-1 text-xs">
          <span className="flex-shrink-0 mr-3 text-[#888A8C]">색상</span>
          <div
            className="flex-shrink-0 w-3 h-3 mr-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-normal text-[#56585A] truncate">
            {color_text}
          </span>
        </div>

        <div className="flex items-center min-w-0 mb-1 text-xs">
          <span className="flex-shrink-0 mr-3 text-[#888A8C]">소재</span>
          <span className="font-normal text-[#56585A] truncate">
            {material}
          </span>
        </div>
      </div>
    </section>
  );
}

export default ProductDetailBox;
