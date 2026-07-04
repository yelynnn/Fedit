import type { FilterChipProps } from "../../types/Filter";
import { Icon } from "@iconify/react";
import { useFilterStore } from "../../stores/FilterStore";

function FilterChip({ filter }: FilterChipProps) {
  const { removeFilter } = useFilterStore((state) => state);

  return (
    <div className="flex justify-between items-center min-w-20 max-w-fit px-2 h-8 text-sm text-icon-neutral font-semibold bg-fill-bg-strong rounded-lg">
      <span>{filter}</span>
      <Icon
        icon="mingcute:close-line"
        className="text-icon-neutral w-3.5 h-3.5 ml-2"
        onClick={() => removeFilter(filter)}
      />
    </div>
  );
}

export default FilterChip;
