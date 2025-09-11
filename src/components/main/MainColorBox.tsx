import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { GetTrendColor } from "@/apis/DashBoardAPI";
import type { ProductColorData } from "@/types/Main";

function MainColorBox() {
  const [colorData, setColorData] = useState<ProductColorData | null>(null);

  useEffect(() => {
    const fetchColorData = async () => {
      try {
        const res = await GetTrendColor();

        setColorData({
          colors: res.colors ?? [],
          products: res.products ?? [],
        });
      } catch (error) {
        console.error("급상승 컬러 불러오기 실패:", error);
        setColorData({ colors: [], products: [] });
      }
    };

    fetchColorData();
  }, []);

  if (!colorData) {
    return (
      <section className="box-border px-6 py-5 w-109 h-114 rounded-xl border border-[#ECEEF0] flex items-center justify-center bg-white">
        <span className="text-sm text-gray-500">
          컬러 데이터를 불러오는 중...
        </span>
      </section>
    );
  }

  const { colors, products } = colorData;

  return (
    <section className="box-border px-6 py-5 w-109 h-114 rounded-xl border border-[#ECEEF0] flex flex-col gap-4 bg-white">
      <div className="flex items-center gap-2 ">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#EAF2FE]">
          <Icon
            icon="iconamoon:trend-up-light"
            color="#1A75FF"
            className="w-6 h-6"
          />
        </div>
        <span className="text-base font-semibold text-[#3D3F41]">
          급상승 컬러
        </span>
      </div>

      <div className="flex gap-5">
        {colors.map((item) => (
          <div key={item.color_name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color_code }}
            />
            <span className="text-sm text-[#56585A]">{item.color_name}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {colors.map((item, index) => {
          const sizes = ["w-44", "w-30", "w-17"];
          const sizeClass = `${sizes[index] ?? "w-17"} aspect-square`;

          return (
            <div key={item.color_name} className="flex items-end">
              <div
                className={`rounded-full ${sizeClass}`}
                style={{ backgroundColor: item.color_code }}
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#ECEEF0]">
        <div className="flex items-center gap-1 mt-4 mb-3">
          <Icon
            icon="tabler:capture-filled"
            color="#3D3F41"
            className="w-4 h-4"
          />
          <p className="text-sm font-semibold text-[#56585A]">
            현장에서 포착된 컬러 트렌드
          </p>
        </div>
        <div className="flex gap-3">
          {products.map((p, idx) => (
            <a
              key={idx}
              href={p.magazine_url}
              target="_blank"
              rel="noopener noreferrer"
              title={p.magazine}
            >
              <img
                src={p.product_img_url}
                alt={`product-${idx}`}
                className="object-cover transition rounded-lg w-22 h-22 hover:opacity-80"
              />
            </a>
          ))}
          {products.length === 0 && (
            <span className="text-sm text-gray-400">준비중...</span>
          )}
        </div>
      </div>
    </section>
  );
}

export default MainColorBox;
