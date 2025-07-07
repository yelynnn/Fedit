import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import BrandChip from "./BrandChip";
import FilterOption from "./FilterOption";
import { useBrandStore } from "../../../stores/BrandStore";
import BrandMenu from "./BrandMenu";

function FilterBar() {
  const { brandList, addBrand } = useBrandStore((state) => state);
  const [inputValue, setInputValue] = useState("");
  const [openBrandTab, setOpenBrandTab] = useState(false);

  return (
    <aside className="relative w-43 h-full bg-white pt-4 px-1 flex flex-col">
      <header className="pl-2 font-bold text-sm leading-5 mb-2">필터</header>
      <section className="h-7 w-full bg-[#D9D9D999] px-4 justify-between flex items-center mb-3">
        <div className="text-sm">브랜드</div>
        <Icon
          icon={
            openBrandTab ? "heroicons-outline:minus" : "heroicons-outline:plus"
          }
          color="#00000066"
          className="w-3 h-3"
          onClick={() => setOpenBrandTab((prev) => !prev)}
        />
      </section>
      {openBrandTab && (
        <div className="absolute top-10 left-full h-full z-50">
          <BrandMenu />
        </div>
      )}
      <section className="mb-6">
        <div className="relative mb-3">
          <Icon
            icon="ion:search-outline"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"
          />
          <input
            type="text"
            placeholder="검색"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                const trimmed = inputValue.trim();
                if (trimmed.length > 0) {
                  addBrand(trimmed);
                  setInputValue("");
                }
              }
            }}
            className="h-7 w-full pl-9 pr-3 rounded-lg bg-[#F9F9FA] border border-[#F1F1F3] text-xs placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          {brandList.map((brand) => (
            <BrandChip key={brand} brand={brand} />
          ))}
        </div>
      </section>
      <FilterOption title={"성별"} />
      <FilterOption title={"유형"} />
      <FilterOption title={"색상"} />
      <FilterOption title={"디테일"} />
      <FilterOption title={"키워드"} />
      <FilterOption title={"패턴"} />
      <FilterOption title={"무드"} />
    </aside>
  );
}

export default FilterBar;
