import React, { useState } from "react";
import ProductAnalysis from "../../../pages/filter/ProductAnalysis";
import ColorAnalysis from "../../../pages/filter/ColorAnalysis";
import TypeAnalysis from "../../../pages/filter/TypeAnalysis";
import KeywordAnalysis from "../../../pages/filter/KeywordAnalysis";

const options = [
  { label: "상품 분석", value: "product" },
  { label: "색상 분석", value: "color" },
  { label: "유형 분석", value: "type" },
  { label: "키워드 분석", value: "keyword" },
];

function FilterTabMenu() {
  const [selectedTab, setSelectedTab] = useState("product");

  return (
    <div className="flex flex-col w-full h-full">
      <nav className="h-10 bg-[#40434B] flex items-end pl-12">
        {options.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSelectedTab(value)}
            className={`h-8 w-25 text-base font-semibold flex items-center justify-center mx-0.5 rounded-t
              ${
                selectedTab === value
                  ? "bg-[#E5E2EA] text-[#1C1C1C]"
                  : "bg-[#555560] text-white"
              }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 bg-gray-100 p-6 overflow-auto">
        {selectedTab === "product" && <ProductAnalysis />}
        {selectedTab === "color" && <ColorAnalysis />}
        {selectedTab === "type" && <TypeAnalysis />}
        {selectedTab === "keyword" && <KeywordAnalysis />}
      </div>
    </div>
  );
}

export default FilterTabMenu;
