import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import FilterOption from "./FilterOption";
import { useFilterStore } from "../../stores/FilterStore";
import {
  allowedFilters,
  ColorCategories,
  DetailCategories,
  GenderCategories,
  PatternCategories,
  TypeCategories,
} from "@/data/FilterCategories";
import FilterChip from "./FilterChip";

type FilterBarProps = {
  setIsBrandOpen: (v: boolean) => void;
};

function FilterBar({ setIsBrandOpen }: FilterBarProps) {
  const { filterList, addFilter, resetFilter } = useFilterStore(
    (state) => state
  );
  const [inputValue, setInputValue] = useState("");

  return (
    <aside className="relative flex flex-col h-screen px-1 pt-4 overflow-x-hidden overflow-y-auto bg-white hide-scrollbar w-43 border-[#40424B] border-r">
      <header className="pl-2 mb-2 text-sm font-bold leading-5">필터</header>
      <Icon
        icon="ri:reset-left-line"
        className="absolute text-gray-500 right-3"
        onClick={() => resetFilter()}
      />
      <section className="mt-3 mb-4">
        <div className="relative mb-3">
          <Icon
            icon="ion:search-outline"
            className="absolute text-base text-gray-400 -translate-y-1/2 left-3 top-1/2"
          />
          <input
            type="text"
            placeholder="검색"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyUp={(e) => {
              const trimmed = inputValue.trim();
              if (
                e.key === "Enter" &&
                trimmed.length > 0 &&
                allowedFilters.includes(trimmed)
              ) {
                addFilter(trimmed);
                setInputValue("");
              }
            }}
            className="h-7 w-full pl-9 pr-3 rounded-lg bg-[#F9F9FA] border border-[#F1F1F3] text-xs placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          {filterList.map((filter) => (
            <FilterChip key={filter} filter={filter} />
          ))}
        </div>
      </section>
      <FilterOption
        title="브랜드"
        onBrandClick={(open) => setIsBrandOpen(open)}
      />
      <FilterOption title="성별" categoryList={GenderCategories} />
      <FilterOption title="유형" typeList={TypeCategories} />
      <FilterOption title="색상" colorList={ColorCategories} />
      <FilterOption title="디테일" categoryList={DetailCategories} />
      <FilterOption title="패턴" categoryList={PatternCategories} />
      {/* <FilterOption title="무드" categoryList={MoodCategories} /> */}
    </aside>
  );
}

export default FilterBar;
