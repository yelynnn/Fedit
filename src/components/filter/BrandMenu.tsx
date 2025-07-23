import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { useFilterStore } from "../../stores/FilterStore";
import BrandOptions from "./BrandOptions";
import { brandData } from "@/data/BrandCategories";
import type { BrandMenuProps } from "@/types/Filter";

function BrandMenu({ onClose }: BrandMenuProps) {
  const { addFilter } = useFilterStore((state) => state);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="h-full w-50 bg-white shadow-md border border-[#E0E0E0] p-4 overflow-y-auto relative">
      <Icon
        icon="majesticons:close-line"
        className="absolute text-gray-400 top-3 right-3 hover:text-black"
        onClick={onClose}
      />

      <div className="mb-2 text-base font-semibold">브랜드</div>

      <div className="relative mt-3 mb-6 border-b border-black">
        <Icon
          icon="ion:search-outline"
          className="absolute left-0 text-base text-gray-400 -translate-y-1/2 top-1/2"
        />
        <input
          type="text"
          placeholder="브랜드 검색"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyUp={(e) => {
            const trimmed = inputValue.trim();
            if (
              e.key === "Enter" &&
              trimmed.length > 0 &&
              Object.values(brandData).flat().includes(trimmed)
            ) {
              addFilter(trimmed);
              setInputValue("");
            }
          }}
          className="w-full pl-6 text-sm bg-transparent h-7 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      <section className="flex flex-col gap-3 mb-4 ml-1 text-sm">
        <span className="text-[#1C1C1C66]">모든 브랜드</span>
        <BrandOptions />
      </section>
    </div>
  );
}

export default BrandMenu;
