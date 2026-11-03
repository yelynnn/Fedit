import { useEffect, useState } from "react";

import ColorTreeMap from "@/components/color/ColorTreeMap";
import ColorBar from "@/components/color/ColorBar";
import { Icon } from "@iconify/react";
import SubTitleBox from "@/components/main/SubTitleBox";
import QuestionTooltip from "@/components/common/QuestionTooltip";
import BrandCompareModal from "@/components/filter/BrandCompareModal";
import TrendColorBox, {
  type TrendColorData,
} from "@/components/color/TrendColorBox";
import { useFilterStore, useFilterStoreHydrated } from "@/stores/FilterStore";
import { GetColorGraph, GetTrendColor } from "@/apis/ColorAPI";
import AnalysisDemoBanner from "@/components/common/AnalysisDemoBanner";
import { ANALYSIS_DEMO_BRANDS } from "@/lib/analysisDemo";
import type { BrandColorData, TrendColorItem } from "@/apis/ColorAPI";

const toTrendColorData = (item: TrendColorItem): TrendColorData => ({
  rank: item.rank,
  colorName: item.color_name,
  colorHex: item.color_hex,
  score: item.score,
  growthRate: item.growth_rate,
  competitorCount: item.competitor_count,
  averagePercent: item.average_percent,
  totalItemCount: item.total_item_count,
  isTotal: item.is_total,
  brands: item.brands.map((b) => ({
    brandName: b.brand_name,
    percent: b.percent,
    itemCount: b.item_count,
  })),
});

type TreeMapEntry = {
  brand: string;
  data: { name: string; size: number; fill: string }[];
};

// 예시 화면의 "신규 주목 색상" — 예시 브랜드는 최근 증가율 조건을 못 넘어 API 가 비어 올 수 있어서 예시(목) 데이터로 채운다.
// 이 카드는 비중은 작아도 여러 브랜드가 동시에 새로 내기 시작한 급상승 색이라, 그런 모양(소량·높은 증가율)으로 만든다.
const demoBrands = (rows: [string, number, number][]) =>
  rows.map(([brandName, percent, itemCount]) => ({ brandName, percent, itemCount }));
const DEMO_TREND_COLORS: TrendColorData[] = [
  {
    rank: 1, colorName: "버터 옐로우", colorHex: "#F1DE9C", score: 94, growthRate: 186, competitorCount: 4,
    averagePercent: 4, totalItemCount: 61,
    brands: demoBrands([["COS", 6, 21], ["ZARA", 5, 18], ["H&M", 3, 14], ["마시모두띠", 2, 8]]),
  },
  {
    rank: 2, colorName: "체리 레드", colorHex: "#8B1E2D", score: 89, growthRate: 142, competitorCount: 4,
    averagePercent: 3, totalItemCount: 47,
    brands: demoBrands([["ZARA", 5, 17], ["마시모두띠", 3, 12], ["H&M", 2, 11], ["COS", 2, 7]]),
  },
  {
    rank: 3, colorName: "세이지 그린", colorHex: "#9FAF8C", score: 83, growthRate: 117, competitorCount: 3,
    averagePercent: 3, totalItemCount: 33,
    brands: demoBrands([["COS", 4, 14], ["마시모두띠", 3, 11], ["H&M", 2, 8]]),
  },
  {
    rank: 4, colorName: "아이시 블루", colorHex: "#BCD6E8", score: 78, growthRate: 96, competitorCount: 3,
    averagePercent: 2, totalItemCount: 26,
    brands: demoBrands([["H&M", 3, 12], ["ZARA", 2, 9], ["COS", 1, 5]]),
  },
];

const toTreeMapEntry = (brandData: BrandColorData): TreeMapEntry => ({
  brand: brandData.brand === "ALL" ? "전체" : brandData.brand,
  data: brandData.colors.map((c) => ({
    name: c.name,
    size: c.value,
    fill: c.color,
  })),
});

// demo: 멤버십 전 고객의 예시 화면 — 필터 대신 예시 브랜드(ANALYSIS_DEMO_BRANDS)로 조회하고 브랜드 추가는 숨긴다
function NewColorAnalysis({ demo = false }: { demo?: boolean }) {
  const { brandList: filterBrands } = useFilterStore();
  const brandList = demo ? ANALYSIS_DEMO_BRANDS : filterBrands;
  // localStorage 복원 전엔 brandList가 빈 배열이라, 실제 저장된 브랜드
  // 필터로 바뀌기 전에 "전체 브랜드" 조회가 한 번 먼저 나가는 걸 막는다.
  const isFilterHydrated = useFilterStoreHydrated();
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [allBrandData, setAllBrandData] = useState<TreeMapEntry[]>([]);
  const [displayTreeMapBrands, setDisplayTreeMapBrands] = useState<
    TreeMapEntry[]
  >([]);
  const [trendColors, setTrendColors] = useState<TrendColorData[]>([]);

  useEffect(() => {
    if (!isFilterHydrated && !demo) return;
    const load = async () => {
      try {
        const res = await GetColorGraph(demo ? ANALYSIS_DEMO_BRANDS : undefined);
        const mapped = Array.isArray(res?.brands)
          ? res.brands.map(toTreeMapEntry)
          : [];
        setAllBrandData(mapped);

        const initial = mapped.find((b) => b.brand === "전체") ?? mapped[0];
        // 예시 화면은 브랜드 2개를 골라 비교하는 실제 사용 모습으로 — 전체 옆에 예시 브랜드 앞의 2개를 붙인다
        const demoPair = demo
          ? ANALYSIS_DEMO_BRANDS.map((name) => mapped.find((b) => b.brand === name))
              .filter((b): b is TreeMapEntry => !!b && b.data.length > 0)
              .slice(0, 2)
          : [];
        if (initial) setDisplayTreeMapBrands([initial, ...demoPair]);
      } catch {
        // 색상 그래프 로드 실패 시 빈 배열 유지
      }
    };
    load();
  }, [brandList, isFilterHydrated, demo]);

  useEffect(() => {
    if (!isFilterHydrated && !demo) return;
    const load = async () => {
      try {
        const res = await GetTrendColor(demo ? ANALYSIS_DEMO_BRANDS : undefined);
        setTrendColors(
          Array.isArray(res?.trend_color)
            ? res.trend_color.map(toTrendColorData)
            : [],
        );
      } catch {
        // 트렌드 색상 로드 실패 시 빈 배열 유지
      }
    };
    load();
  }, [brandList, isFilterHydrated, demo]);

  const handleCompareSubmit = (brands: string[]) => {
    brands.forEach((brandName) => {
      if (displayTreeMapBrands.length >= 3) return;
      if (displayTreeMapBrands.some((d) => d.brand === brandName)) return;
      const entry = allBrandData.find((b) => b.brand === brandName) ?? {
        brand: brandName,
        data: [],
      };
      setDisplayTreeMapBrands((prev) => [...prev, entry]);
    });
  };

  const handleRemoveTreeMap = (brandName: string) => {
    if (displayTreeMapBrands.length <= 1) return;
    setDisplayTreeMapBrands((prev) =>
      prev.filter((b) => b.brand !== brandName),
    );
  };

  return (
    <div className="px-14">
      {demo && (
        <div className="mt-2">
          <AnalysisDemoBanner brandNames={ANALYSIS_DEMO_BRANDS} />
        </div>
      )}
      {/* <div className="flex items-center justify-between w-full px-3 py-2 border rounded-lg cursor-pointer bg-surface-base border-surface-base">
        <div className="flex items-center gap-9">
          <span className="text-sm font-medium text-tx-alt">시즌선택</span>
          <span className="text-base font-semibold text-tx-neutral">
            2025 Spring/Summer
          </span>
        </div>
        <Icon icon="ph:caret-down-bold" className="w-4 h-4 text-icon-neutral" />
      </div> */}
      <div className="flex items-start justify-between mt-8 mb-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg w-7 h-7 bg-surface-base">
              <Icon
                icon="mdi:shopping-outline"
                className="w-4 h-4 text-tx-neutral"
              />
            </div>
            <header className="text-xl font-semibold tracking-tight text-tx-neutral">
              색상 비중 비교
            </header>
            <QuestionTooltip
              label="브랜드별 인기 색상"
              infoText="최대 2개 브랜드를 선택해 각 브랜드에서 가장 많이 출시한 상위 5개 색상의 비중과 관련 상품을 비교해 볼 수 있어요."
            />
          </div>
          <p className="pl-1 text-base font-medium leading-6 text-icon-neutral">
            세부 톤까지 확장된 색상 흐름을 브랜드 단위로 확인해보세요.
          </p>
        </div>

        {/* 뷰 전환 버튼 그룹 */}
        <div className="flex items-center p-1 border bg-surface-base rounded-xl border-surface-base shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-tx-neutral border border-line-alt shadow-sm" : "text-icon-alt"}`}
          >
            <Icon icon="ph:grid-nine" className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-tx-neutral border border-line-alt shadow-sm" : "text-icon-alt"}`}
          >
            <Icon icon="fa7-solid:list-ul" className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* 그래프 영역: viewMode에 따라 TreeMap 또는 ColorBar를 보여줌 */}
      {brandList.length === 0 ? (
        <div className="flex items-center justify-center w-full border h-91 bg-surface-base border-surface-base rounded-xl">
          <p className="text-base font-medium text-icon-neutral">
            브랜드를 선택해주세요
          </p>
        </div>
      ) : (
        <div className="flex items-start w-full gap-5 transition-all duration-500">
          {displayTreeMapBrands.map((block) => (
            <div key={block.brand} className="flex-1 min-w-0">
              {viewMode === "grid" ? (
                <ColorTreeMap
                  title={block.brand}
                  data={block.data}
                  onClose={
                    block.brand !== "전체"
                      ? () => handleRemoveTreeMap(block.brand)
                      : undefined
                  }
                />
              ) : (
                <ColorBar
                  title={block.brand}
                  // "전체" 블록은 브랜드명이 없으니, 사용자가 선택한 모든
                  // 브랜드(brandList)를 brand=A&brand=B... 로 반복 전송한다.
                  brand={block.brand === "전체" ? brandList : block.brand}
                  data={block.data}
                  onClose={
                    block.brand !== "전체"
                      ? () => handleRemoveTreeMap(block.brand)
                      : undefined
                  }
                />
              )}
            </div>
          ))}

          {/* 브랜드 추가하기 버튼 */}
          {!demo && displayTreeMapBrands.length < 3 && (
            <button
              onClick={() => setCompareModalOpen(true)}
              className={`
              flex flex-col items-center justify-center h-91
              bg-surface-base border-2 border-dashed border-line-divider rounded-xl
              hover:bg-surface-base transition-all group shrink-0
              ${displayTreeMapBrands.length === 1 ? "w-70" : "w-30"}
            `}
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <span className="text-sm font-semibold text-tx-neutral group-hover:text-tx-alt whitespace-nowrap">
                  브랜드 추가하기
                </span>

                <div className="w-6 h-6 flex items-center justify-center rounded-full border-1 border-[#6F7173] text-tx-alt group-hover:border-[#495057] group-hover:text-tx-alt">
                  <Icon
                    icon="lucide:plus"
                    width="16"
                    height="16"
                    className="stroke-[3]"
                  />
                </div>
              </div>
            </button>
          )}
        </div>
      )}
      <SubTitleBox
        title="신규 주목 색상"
        label="트렌드 색상"
        infoText="선택한 경쟁사 브랜드의 최근 3개월 출시 증가율과 동시 채택 여부를 분석해 새롭게 주목받는 색상을 보여드려요. 분석 대상이 없으면 전체 브랜드를 기준으로 제공해요."
      />
      <p className="mt-1 mb-4 text-base font-medium leading-6 text-icon-neutral">
        모든 경쟁사가 소량으로 동시 출시 중인 유행 색상입니다.
      </p>
      <div className="grid items-start grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(demo && trendColors.length === 0 ? DEMO_TREND_COLORS : trendColors).map((item) => (
          <TrendColorBox key={item.rank} data={item} />
        ))}
      </div>
      <BrandCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        onSubmit={handleCompareSubmit}
        alreadyAdded={displayTreeMapBrands.map((b) => b.brand)}
      />
    </div>
  );
}

export default NewColorAnalysis;
