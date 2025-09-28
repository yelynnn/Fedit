import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";
import BrandFilterModal from "./BrandFilterModal";
import { useFilterStore } from "@/stores/FilterStore";

type Props = { isProductTab: boolean };

function BrandTab({ isProductTab }: Props) {
  const [isBrandOpen, setBrandOpen] = useState(false);
  const { brandList } = useFilterStore((state) => state);

  useEffect(() => {
    const id = "brandtab-hide-scrollbar";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `.x-scroll-hide::-webkit-scrollbar{display:none;}`;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <section className="flex justify-between h-14 bg-[#ECEEF0] px-12 py-2 gap-2 relative">
      <div className="flex items-center flex-1 min-w-0 gap-2">
        <button
          type="button"
          onClick={() => setBrandOpen((prev) => !prev)}
          className="text-[#888A8C] flex items-center h-10 gap-1 p-2 text-sm font-semibold bg-white rounded-lg w-18 border border-[#E4E4E4] cursor-pointer select-none shrink-0"
        >
          <p>브랜드</p>
          <Icon
            icon="mingcute:down-fill"
            color="#888A8C"
            className={`w-3 transition-transform duration-300 ${
              isBrandOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className="flex-1 min-w-0 overflow-x-auto x-scroll-hide whitespace-nowrap"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex gap-2">
            {brandList.map((brand) => (
              <button
                key={brand}
                type="button"
                className="font-semibold inline-flex px-3 h-10 rounded-lg border-1 border-[#3D3F41] bg-white text-[#3D3F41] items-center justify-center text-sm shrink-0"
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isProductTab && (
        <div className="text-white flex items-center h-10 gap-1 py-2 px-2 text-sm font-semibold bg-[#242628] rounded-lg w-32 cursor-pointer select-none shrink-0">
          <Icon icon="ci:download" color="white" className="w-6" />
          <p>엑셀 다운로드</p>
        </div>
      )}

      <BrandFilterModal
        isOpen={isBrandOpen}
        onClose={() => setBrandOpen(false)}
        onSubmit={() => {
          console.log("선택된 브랜드:", useFilterStore.getState().brandList);
          setBrandOpen(false);
        }}
      />
    </section>
  );
}

export default BrandTab;
