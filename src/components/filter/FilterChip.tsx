import type { FilterChipProps } from "../../types/Filter";
import { Icon } from "@iconify/react";
import { useFilterStore } from "../../stores/FilterStore";

function FilterChip({ filter }: FilterChipProps) {
  const { removeFilter } = useFilterStore((state) => state);

  return (
    <div className="flex justify-between items-center min-w-20 max-w-fit px-3 bg-[#F1F1F3] text-[13px] text-black rounded-full ml-1">
      <span>{filter}</span>
      <Icon
        icon="mingcute:close-line"
        className="text-[#6B7A99] w-3.5 h-3.5 ml-3"
        onClick={() => removeFilter(filter)}
      />
    </div>
  );
}

export default FilterChip;
