import type { ProductType } from "@/types/Filter";

function ProductDetailBox({
  product_name,
  color,
  material,
  image_url,
}: ProductType) {
  return (
    <section
      className="flex justify-between w-full h-24"
      // onClick={() => navigate(`/product/${id}`)}
    >
      <img src={image_url} className="flex-shrink-0 h-full mr-15 w-23" />
      <div className="flex flex-col pr-8 text-sm font-bold w-47 ">
        <span className="my-2 break-all truncate">{product_name}</span>
        <div className="flex items-center my-1">
          <span className="flex-shrink-0 mr-3">색상</span>
          <span className="font-normal break-all truncate">{color}</span>
        </div>
        <div className="flex items-center mb-1">
          <span className="flex-shrink-0 mr-3">소재</span>
          <span className="font-normal break-all truncate">{material}</span>
        </div>
      </div>
    </section>
  );
}

export default ProductDetailBox;
