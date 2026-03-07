import React, { useState } from "react";
import { Icon } from "@iconify/react";

interface BrandDetail {
  brandName: string;
  percent: number;
  itemCount: number;
}

export interface TrendColorData {
  rank: number;
  colorName: string;
  colorHex: string;
  score: number;
  growthRate: number;
  competitorCount: number;
  averagePercent: number;
  totalItemCount: number;
  brands: BrandDetail[];
  isTotal?: boolean;
}

interface Props {
  data: TrendColorData;
}

const TrendColorBox = ({ data }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`w-full max-w-[400px] rounded-xl p-4 border transition-all ${
        data.isTotal
          ? "border-[#9E86FC] bg-[#FBFAFF]"
          : "border-transparent bg-[#F9FAFB]"
      }`}
    >
      {" "}
      {/* 1. 상단 정보 영역 */}
      <div className="flex flex-col gap-4 mb-5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[14px] font-medium"
          style={{
            backgroundColor: data.colorHex,
            color:
              data.colorHex === "#000000" || data.colorHex === "#1A1A1A"
                ? "#fff"
                : "#333",
          }}
        >
          {data.rank}
        </div>
        <div className="flex gap-2">
          <h3 className="text-base font-semibold text-[#242628]">
            {data.colorName}
          </h3>

          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg">
            <span className="text-sm font-medium text-[#242628]">
              {data.score}점
            </span>
            <Icon icon="ph:question-light" className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="flex flex-col flex-wrap gap-2">
          <div className="w-fit px-2 py-1 bg-[#EAF2FE] rounded-lg text-[#1A75FF] text-xs font-semibold">
            성장 가속도 {data.growthRate}% 증가
          </div>
          <div className="w-fit px-2 py-1 bg-[#EAF2FE] rounded-lg text-[#1A75FF] text-xs font-semibold">
            {data.competitorCount}개 이상 경쟁사에서 동시 출시
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-gray-200/60 mb-5" />
      {/* 2. 중간 요약 영역 */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-baseline gap-2 text-base font-semibold text-[#242628]">
          <span>평균 비중</span>
          <span>{data.averagePercent}%</span>
        </div>
        <p className="text-sm font-medium text-[#3D3F41]">
          총 {data.totalItemCount}개의 아이템 출시
        </p>
      </div>
      {/* 3. 토글 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 mb-2 group focus:outline-none"
      >
        <span className="text-xs font-medium text-[#3D3F41]">
          {data.totalItemCount}개 아이템
        </span>
        <Icon
          icon="tabler:chevron-down"
          className={`w-5 h-5 text-[#6F7173] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      {/* 4. 브랜드 리스트 (조건부 렌더링 - 애니메이션 없음) */}
      {isExpanded && (
        <div className="flex flex-col gap-3">
          {data.brands.map((brand, idx) => (
            <div
              key={`${brand.brandName}-${idx}`}
              className="flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#3D3F41]">
                    {brand.brandName}
                  </span>
                  <span className="text-sm font-semibold text-[#3D3F41]">
                    {brand.percent}%
                  </span>
                </div>
                <span className="text-xs font-medium text-[#A1A3A5]">
                  {brand.itemCount}개 아이템
                </span>
              </div>
              <button className="px-2 py-1 text-xs font-semibold text-[#3D3F41] hover:text-[#3D3F41]">
                관련 아이템
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendColorBox;
