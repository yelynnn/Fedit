import type { BrandChipProps } from "../../../types/Filter";
import { Icon } from "@iconify/react";
import { useBrandStore } from "../../../stores/BrandStore";

function BrandChip({ brand }: BrandChipProps) {
  const { removeBrand } = useBrandStore((state) => state);

  return (
    <div className="flex justify-between items-center min-w-20 max-w-fit px-3 bg-[#F1F1F3] text-[13px] text-black rounded-full ml-1">
      <span>{brand}</span>
      <Icon
        icon="mingcute:close-line"
        className="text-[#6B7A99] w-3.5 h-3.5 ml-3"
        onClick={() => removeBrand(brand)}
      />
    </div>
  );
}

export default BrandChip;
