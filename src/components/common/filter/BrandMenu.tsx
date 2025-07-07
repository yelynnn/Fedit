import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { useBrandStore } from "../../../stores/BrandStore";
import BrandOptions from "./BrandOptions";

function BrandMenu() {
  const { addBrand } = useBrandStore((state) => state);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="h-full w-50 bg-white shadow-md border border-[#E0E0E0] p-4 overflow-y-auto">
      브랜드
      <div className="relative mt-3 mb-6 border-b border-black">
        <Icon
          icon="ion:search-outline"
          className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-base"
        />
        <input
          type="text"
          placeholder="브랜드 검색"
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
          className="pl-6 w-full h-7 text-sm placeholder:text-gray-400 bg-transparent focus:outline-none"
        />
      </div>
      <section className="text-sm flex flex-col gap-1.5 ml-1 mb-4">
        <span className="text-[#1C1C1C66]">선택</span>
        <div className="flex gap-2 items-center">
          <div className="bg-[#95A4FC] size-1.5 rounded-full" />
          자사
        </div>
        <div className="flex gap-2 items-center">
          <div className="bg-[#95A4FC] size-1.5 rounded-full" />
          경쟁사
        </div>
      </section>
      <section className="text-sm flex flex-col gap-1.5 ml-1 mb-4">
        <span className="text-[#1C1C1C66]">모든 브랜드</span>
        <BrandOptions />
      </section>
    </div>
  );
}

export default BrandMenu;
