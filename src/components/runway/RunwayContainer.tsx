import { useState } from "react";
import { Icon } from "@iconify/react";

// 매거진 아이콘 매핑
const MAGAZINE_ICONS: Record<string, string> = {
  vogue: "/src/assets/vogue.png",
  elle: "/src/assets/elle.png",
  w: "/src/assets/W.png",
  bazaar: "/src/assets/bazaar.svg",
};

// 프롭 타입 정의
interface RunwayContainerProps {
  data: {
    brand: string;
    insight: string;
    magazine: Array<{ name: string; magazine_url: string }>;
    point_color: Array<{ name: string; hex: string }>;
    color_insight: string;
    texture: Array<{ image_url: string; name: string; detail: string }>;
    apply_point: string[];
    items: Array<{ image_url: string; name: string; detail: string }>;
  };
}

export default function RunwayContainer({ data }: RunwayContainerProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // 데이터가 없을 경우를 대비한 방어 코드
  if (!data) return null;

  return (
    <div className="bg-white font-sans text-[#242628]">
      {/* 헤더 섹션 */}
      <header className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold">{data.brand} 전반적 분석</h1>
            <span className="bg-[#EBF2FF] text-[#3E7EFF] text-xs px-2 py-1 rounded-md font-bold">
              시즌 분석
            </span>
          </div>
        </div>
        {/* 잡지 로고 영역 */}
        <div className="flex gap-1.5 rounded-md">
          {data.magazine.map((m, i) => (
            <a
              key={i}
              href={m.magazine_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border border-[#BABCBE] hover:border-[#ADB5BD] transition-colors bg-white"
            >
              {MAGAZINE_ICONS[m.name.toLowerCase()] ? (
                <img
                  src={MAGAZINE_ICONS[m.name.toLowerCase()]}
                  alt={m.name}
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-[10px] font-bold uppercase text-[#3D3F41]">
                  {m.name.substring(0, 1)}
                </span>
              )}
            </a>
          ))}
        </div>
      </header>

      {/* 시즌 인사이트 섹션 */}
      <section className="bg-[#FBFAFF] border border-[#F0ECFE] rounded-xl p-5 mb-5">
        <div className="flex items-center gap-1 mb-3">
          <Icon icon="ph:lightbulb-fill" className="text-[#9E86FC] w-5 h-5" />
          <span className="text-base font-semibold">시즌 인사이트</span>
        </div>
        <p className="text-base font-semibold leading-relaxed">
          {data.insight}
        </p>
      </section>

      {/* 분석 그리드 섹션 */}
      <div className="grid grid-cols-2 gap-5 mb-10">
        <div className="border border-[#ECEEF0] rounded-xl p-4">
          <h3 className="mb-5 text-base font-semibold">대표 포인트 컬러</h3>
          <div className="flex gap-4 mb-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {data.point_color.map((color, i) => (
              <div
                key={i}
                className="flex flex-col items-center flex-shrink-0 gap-2"
              >
                <div
                  className="w-12 h-12 border rounded-full shadow-inner border-black/5"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm font-medium text-[#242628] whitespace-nowrap">
                  {color.name}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full h-[1px] bg-[#E4E4E4] mb-5" />

          <div className="flex items-center gap-2 rounded-lg">
            <Icon
              icon="prime:arrow-circle-right"
              className="w-5 h-5 text-[#3E7EFF]"
            />
            <span className="text-base font-semibold">
              {data.color_insight}
            </span>
          </div>
        </div>

        {/* 주요 소재 & 텍스쳐 */}
        <div className="border border-[#ECEEF0] rounded-xl p-4">
          <h3 className="mb-3 text-base font-semibold">주요 소재 & 텍스쳐</h3>
          <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {data.texture.map((t, i) => (
              <div key={i} className="flex flex-col gap-2">
                <span className="w-fit bg-[#EBF2FF] text-[#3E7EFF] text-sm px-1.5 py-0.5 rounded font-semibold">
                  {t.name}
                </span>
                <img
                  src={t.image_url}
                  className="object-cover bg-gray-100 rounded-lg w-23 h-23 aspect-square"
                  alt={t.name}
                />
                <span className="text-sm font-medium text-[#242628] whitespace-nowrap">
                  {t.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 실무 적용 포인트 */}
      <section className="mb-5">
        <h3 className="mb-3 text-base font-semibold">실무 적용 포인트</h3>
        <div className="flex flex-col border border-[#ECEEF0] rounded-xl px-3 bg-white">
          {data.apply_point.map((point, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-[#F1F3F5] last:border-none"
            >
              <Icon
                icon="ph:check-bold"
                className="text-[#6F7173] w-4 h-4 flex-shrink-0"
              />
              <span className="text-base font-medium text-[#0B0E0F] leading-relaxed">
                {point}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 주요 아이템 & 디테일 (호버 기능 포함) */}
      <section>
        <h3 className="mb-3 text-base font-semibold">주요 아이템 & 디테일</h3>
        <div className="grid grid-cols-6 gap-5">
          {data.items.map((item, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-3 group"
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
      </section>
    </div>
  );
}
