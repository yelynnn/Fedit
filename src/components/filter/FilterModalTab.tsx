import { useFilterStore } from "@/stores/FilterStore";
import { Icon } from "@iconify/react/dist/iconify.js";
import FilterChip from "./FilterChip";

type Props = {
  tabs: string[];
  active: string;
  onChange: (name: string) => void;
};

export default function FilterTabs({ tabs, active, onChange }: Props) {
  const { resetFilter, filterList } = useFilterStore((state) => state);
  return (
    <div className="relative">
      <div className="flex gap-6 px-4">
        {tabs.map((label) => {
          const isActive = label === active;
          return (
            <button
              key={label}
              onClick={() => onChange(label)}
              className={[
                "relative pb-2 text-sm transition-colors",
                isActive ? "font-semibold text-[#3D3F41]" : "text-gray-400",
              ].join(" ")}
            >
              {label}
              {isActive && (
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-[1px] block w-6 h-[3px] rounded bg-[#3D3F41]" />
              )}
            </button>
          );
        })}
      </div>
      <section className="flex justify-between items-center h-12 bg-[#F9FAFB] px-4 py-2 gap-3 border-[1px] border-y border-[#ECEEF0]">
        <div
          className="flex gap-1 flex-nowrap overflow-x-auto 
             [scrollbar-width:none] [-ms-overflow-style:none] 
             [&::-webkit-scrollbar]:hidden"
        >
          {filterList.map((filter) => (
            <FilterChip key={filter} filter={filter} />
          ))}
        </div>
        <div className="flex gap-1 ml-12">
          <p className="text-xs font-normal text-[#56585A]">초기화</p>
          <Icon
            icon="ri:reset-left-line"
            className="w-3 text-gray-500 cursor-pointer"
            onClick={() => resetFilter()}
          />
        </div>
      </section>
    </div>
  );
}
