import { useEffect, useState } from "react";

import ColorTreeMap from "@/components/color/ColorTreeMap";
import ColorBar from "@/components/color/ColorBar";
import { Icon } from "@iconify/react";
import SubTitleBox from "@/components/main/SubTitleBox";
import BrandCompareModal from "@/components/filter/BrandCompareModal";
import TrendColorBox, {
  type TrendColorData,
} from "@/components/color/TrendColorBox";
import { useFilterStore } from "@/stores/FilterStore";
import { GetColorGraph, GetTrendColor } from "@/apis/ColorAPI";
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

const toTreeMapEntry = (brandData: BrandColorData): TreeMapEntry => ({
  brand: brandData.brand === "ALL" ? "전체" : brandData.brand,
  data: brandData.colors.map((c) => ({
    name: c.name,
    size: c.value,
    fill: c.color,
  })),
});

function NewColorAnalysis() {
  const { brandList } = useFilterStore();
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [allBrandData, setAllBrandData] = useState<TreeMapEntry[]>([]);
  const [displayTreeMapBrands, setDisplayTreeMapBrands] = useState<
    TreeMapEntry[]
  >([]);
  const [trendColors, setTrendColors] = useState<TrendColorData[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await GetColorGraph();
        const mapped = Array.isArray(res?.brands)
          ? res.brands.map(toTreeMapEntry)
          : [];
        setAllBrandData(mapped);

        const initial = mapped.find((b) => b.brand === "전체") ?? mapped[0];
        if (initial) setDisplayTreeMapBrands([initial]);
      } catch {
        // 색상 그래프 로드 실패 시 빈 배열 유지
      }
    };
    load();
  }, [brandList]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await GetTrendColor();
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
  }, [brandList]);

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
    <div className="min-h-screen px-14">
      {/* <div className="w-full px-3 py-2 bg-surface-base rounded-lg border border-surface-base flex items-center justify-between cursor-pointer">
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
            <div className="flex items-center justify-center w-7 h-7 bg-surface-base rounded-lg">
              <Icon
                icon="mdi:shopping-outline"
                className="w-4 h-4 text-tx-neutral"
              />
            </div>
            <header className="text-xl font-semibold tracking-tight text-tx-neutral">
              색상 비중 비교
            </header>
          </div>
          <p className="text-icon-neutral leading-6 text-base font-medium pl-1">
            세부 톤까지 확장된 색상 흐름을 브랜드 단위로 확인해보세요.
          </p>
        </div>

        {/* 뷰 전환 버튼 그룹 */}
        <div className="flex items-center p-1 bg-surface-base rounded-xl border border-surface-base shrink-0">
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
        <div className="flex items-center justify-center w-full h-91 bg-surface-base border border-surface-base rounded-xl">
          <p className="text-icon-neutral text-base font-medium">
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
                brand={block.brand === "전체" ? "ALL" : block.brand}
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
        {displayTreeMapBrands.length < 3 && (
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
              <span className="text-tx-neutral text-sm font-semibold group-hover:text-tx-alt whitespace-nowrap">
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
        label="트렌드 컬러"
        infoText="매일 오전 10시, 무신사·W컨셉·네이버 등 주요 패션 플랫폼의 검색어 데이터를 자동 수집하며, 매거진·SNS 언급량 분석을 결합해 월별 종합 랭킹과 최근 주목도가 급상승한 패션 트렌드를 함께 제공합니다."
      />
      <p className="text-icon-neutral leading-6 text-base font-medium mt-1 mb-4">
        모든 경쟁사가 소량으로 동시 출시 중인 유행 색상입니다.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {trendColors.map((item) => (
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
