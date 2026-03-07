import React, { useRef, useState, useMemo } from "react";
import RunwayContainer from "./RunwayContainer";

interface RunwayBoxProps {
  brands: any[];
}

export default function RunwayBox({ brands }: RunwayBoxProps) {
  const [activeTab, setActiveTab] = useState("channel");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const currentBrandData = useMemo(() => {
    return brands.find((b) => b.id === activeTab) || brands[0];
  }, [activeTab, brands]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsDetailOpen(false); // 탭 전환 시 요약 페이지로 초기화

    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!brands || brands.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="w-full bg-white rounded-[24px] border border-[#ECEEF0] shadow-sm scroll-mt-10"
    >
      {/* 상단 탭 내비게이션 */}
      <div className="flex gap-6 mt-4 px-8 border-b border-[#F1F3F5] bg-white sticky top-0 z-10">
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => handleTabClick(brand.id)}
            className={`py-2 text-base font-semibold capitalize border-b-2 transition-all ${
              activeTab === brand.id
                ? "border-black text-black"
                : "border-transparent text-[#91929D]"
            }`}
          >
            {brand.name}
          </button>
        ))}
      </div>

      <div className="p-8">
        {/* 상세 페이지가 열려있을 때: RunwayContainer만 표시 */}
        {isDetailOpen ? (
          <div className="duration-500 animate-in fade-in">
            {/* 닫기 버튼을 상단에 배치하여 유저가 쉽게 돌아갈 수 있게 함 */}

            <RunwayContainer data={currentBrandData} />
            <div className="flex mb-6">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="mt-6 w-full text-[#3D3F41] flex items-center justify-center gap-2 py-2 border border-[#ECEEF0] bg-[#F6F8FA] rounded-full text-base font-medium hover:bg-gray-50 transition-colors"
              >
                간단히 보기
              </button>
            </div>
          </div>
        ) : (
          /* 상세 페이지가 닫혀있을 때: 기존 요약 섹션 표시 */
          <div className="flex gap-12 duration-500 animate-in fade-in">
            {/* 좌측: 브랜드 요약 섹션 */}
            <div className="w-[340px] shrink-0">
              <div className="flex items-center gap-5 mb-2">
                <h2 className="text-[28px] font-semibold">
                  {currentBrandData.name}
                </h2>
                <span className="text-xs font-semibold bg-[#F2F4F6] px-2 py-1 rounded text-[#888A8C]">
                  2025 S/S
                </span>
              </div>

              <p className="text-sm text-[#3D3F41] leading-relaxed mb-3 line-clamp-4">
                {currentBrandData.description}
              </p>

              <button
                onClick={() => setIsDetailOpen(true)}
                className="w-full py-2 border border-[#ECEEF0] rounded-full text-base font-medium hover:bg-gray-50 transition-colors mb-3"
              >
                자세히 보기
              </button>

              {/* 컬러 팔레트 요약 */}
              <div>
                <h4 className="text-sm font-semibold text-[#242628] mb-4 tracking-wider">
                  Color Palette
                </h4>
                <div className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {currentBrandData.point_color.map((color: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    >
                      <div
                        className="border rounded-full shadow-inner w-11 h-11 border-black/5"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm text-[#242628] font-medium">
                        {color.name.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-4 mb-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {currentBrandData.items?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="relative flex flex-col w-[150px] flex-shrink-0 gap-3 group"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div className="relative overflow-visible">
                      <img
                        src={item.image_url}
                        className="w-full aspect-[3/4] object-cover rounded-xl bg-gray-100 transition-transform duration-300 group-hover:brightness-90"
                        alt={item.name}
                      />

                      {hoveredIdx === i && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[180px]">
                          <div className="bg-black/70 backdrop-blur-md text-white text-[11px] p-2 rounded-lg leading-snug shadow-xl relative text-center">
                            {item.detail}
                            <div className="absolute w-2 h-2 rotate-45 -translate-x-1/2 -bottom-1 left-1/2 bg-black/70" />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-tight text-center line-clamp-2">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
              <h4 className="text-sm font-semibold text-[#242628] mb-4 tracking-wider">
                핵심 포인트
              </h4>
              <div className="flex flex-wrap gap-5">
                {currentBrandData.points?.map((p: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-[#F4F9FF] text-[#3E7EFF] text-sm font-semibold rounded-lg border border-[#E1EEFF]"
                  >
                    • {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
