import type { FilterTitle } from "@/types/Filter";
import { Icon } from "@iconify/react/dist/iconify.js";
import FilterChip from "./FilterChip";

type Props = FilterTitle & {
  onOpen?: (section: string) => void;
};

function NewFilterOption({ filterName, filterList, onOpen }: Props) {
  const isSelected = filterList.length > 0;
  return (
    <div
      className={`flex flex-col w-full h-fit py-4 px-2  ${isSelected ? "bg-white rounded-lg" : ""}`}
    >
      <div className="flex items-center justify-between w-full text-sm font-semibold text-[#56585A]">
        <p>{filterName}</p>
        <Icon
          icon="iconoir:page-right"
          className="w-5 outline-none cursor-pointer focus:outline-none"
          onClick={() => onOpen?.(filterName)}
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && onOpen?.(filterName)
          }
        />
      </div>
      {filterList && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filterList.map((filter) => (
            <FilterChip key={filter} filter={filter} />
          ))}
        </div>
      )}
    </div>
  );
}

export default NewFilterOption;
