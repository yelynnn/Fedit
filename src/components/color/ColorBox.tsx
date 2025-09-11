import type { ColorBoxProps } from "@/types/Filter";
import ColorChart from "./ColorChart";
import ProductDetailBox from "./ProductDetailBox";
import { ColorBrandCategories } from "@/data/ColorBrandCategories";
import { useEffect, useState } from "react";
import mockData from "@/data/mock/mockup_v3.json";

type ProductItem = (typeof mockData)[number];

function ColorBox({ brand }: ColorBoxProps) {
  const brandData = ColorBrandCategories.find((b) => b.brand === brand)?.data;
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedColorLists, setSelectedColorLists] = useState<ProductItem[]>(
    []
  );

  useEffect(() => {
    const filtered = mockData.filter((item) => {
      if (!selectedColor) {
        return brand === "전체" ? true : item.brand === brand;
      }

      return brand === "전체"
        ? item.main_color === selectedColor
        : item.brand === brand && item.main_color === selectedColor;
    });

    setSelectedColorLists(filtered);
    console.log("선택된 브랜드:", brand);
    console.log("선택된 색상:", selectedColor);
  }, [selectedColor, brand]);

  return (
    <div className="w-90 h-190 rounded-2xl bg-[#F7F9FB]">
      <div className="p-6">
        <header className="text-[#1C1C1C] text-base font-bold mb-4">
          {brand}
        </header>
        {brandData ? (
          <ColorChart data={brandData} onSelectColor={setSelectedColor} />
        ) : (
          <p>색상 데이터를 찾을 수 없습니다.</p>
        )}
      </div>

      <div className="bg-[#EAE9EE] h-7 text-sm pl-6 font-bold flex items-center">
        상품 상세 보기
      </div>

      <section className="flex flex-col gap-3 p-5 overflow-y-auto h-86 hide-scrollbar">
        {selectedColorLists.map((p) => (
          <ProductDetailBox key={p.itemcode} {...p} />
        ))}
      </section>
    </div>
  );
}

export default ColorBox;
