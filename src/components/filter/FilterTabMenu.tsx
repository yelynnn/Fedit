import ProductAnalysis from "../../pages/filter/ProductAnalysis";
import ColorAnalysis from "../../pages/filter/ColorAnalysis";
import TypeAnalysis from "../../pages/filter/TypeAnalysis";
import { useFilterStore } from "@/stores/FilterStore";
// import KeywordAnalysis from "../../pages/filter/KeywordAnalysis";

const options = [
  { label: "상품 분석" },
  { label: "색상 분석" },
  { label: "유형 분석" },
  // { label: "키워드 분석"},
];

function FilterTabMenu() {
  const { selectedTab, setSelectedTab } = useFilterStore((state) => state);
  return (
    <div className="flex flex-col w-full h-full">
      <nav className="h-10 bg-[#40434B] flex items-end pl-12">
        {options.map(({ label }) => (
          <button
            key={label}
            onClick={() => setSelectedTab(label)}
            className={`h-8 w-25 text-base font-semibold flex items-center justify-center mx-0.5 rounded-t
              ${
                selectedTab === label
                  ? "bg-[#E5E2EA] text-[#1C1C1C]"
                  : "bg-[#555560] text-white"
              }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-auto">
        {selectedTab === "상품 분석" && <ProductAnalysis />}
        {selectedTab === "색상 분석" && <ColorAnalysis />}
        {selectedTab === "유형 분석" && <TypeAnalysis />}
        {/* {selectedTab === "keyword" && <KeywordAnalysis />} */}
      </div>
    </div>
  );
}

export default FilterTabMenu;
