import React from "react";
import ColorChart from "./ColorChart";
import ProductDetailBox from "./ProductDetailBox";

function ColorBox() {
  return (
    <div className="w-100 rounded-2xl bg-[#F7F9FB] ">
      <div className="p-6 ">
        <header className="text-[#1C1C1C] text-base font-bold">아디다스</header>
        <ColorChart />
      </div>
      <div className="bg-[#EAE9EE] h-7 text-sm pl-6 font-bold flex items-center mb-3">
        상품 상세 보기
      </div>
      <section className="flex flex-col gap-3 p-5">
        <ProductDetailBox />
        <ProductDetailBox />
        <ProductDetailBox />
      </section>
    </div>
  );
}

export default ColorBox;
