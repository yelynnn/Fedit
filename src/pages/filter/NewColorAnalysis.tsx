// import { useProductStore } from "@/stores/ProductStore";
// import { useEffect, useState } from "react";
// import { GetColorGraph } from "@/apis/AnalysisAPI";
// import { useFilterStore } from "@/stores/FilterStore";
// import { isAxiosError } from "axios";
import PasswordModal from "@/components/main/PasswordModal";

import ColorTreeMap from "@/components/color/ColorTreeMap";
import ColorBar from "@/components/color/ColorBar"; // 새로 만든 컴포넌트 추가
import { Icon } from "@iconify/react";
import SubTitleBox from "@/components/main/SubTitleBox";
import { useState } from "react";
import BrandCompareModal from "@/components/filter/BrandCompareModal";
import TrendColorBox, {
  type TrendColorData,
} from "@/components/color/TrendColorBox";

const MOCK_GRAPHS = [
  {
    brand: "CHANEL",
    data: [
      { name: "블랙", size: 50, increase: "10%", fill: "#1A1A1A" },
      { name: "화이트", size: 30, increase: "5%", fill: "#F5F5F5" },
      { name: "골드", size: 20, increase: "12%", fill: "#FFD700" },
      { name: "화이트", size: 30, increase: "5%", fill: "#F5F5F5" },
      { name: "골드", size: 20, increase: "12%", fill: "#FFD700" },
    ],
  },
  {
    brand: "DIOR",
    data: [
      { name: "블루", size: 45, increase: "15%", fill: "#007BFF" },
      { name: "핑크", size: 35, increase: "8%", fill: "#FFC0CB" },
      { name: "그레이", size: 20, increase: "3%", fill: "#A9A9A9" },
      { name: "화이트", size: 30, increase: "5%", fill: "#F5F5F5" },
      { name: "골드", size: 20, increase: "12%", fill: "#FFD700" },
    ],
  },
  {
    brand: "GUCCI",
    data: [
      { name: "그린", size: 40, increase: "20%", fill: "#28A745" },
      { name: "레드", size: 40, increase: "18%", fill: "#DC3545" },
      { name: "브라운", size: 20, increase: "5%", fill: "#8B4513" },
      { name: "화이트", size: 30, increase: "5%", fill: "#F5F5F5" },
      { name: "골드", size: 20, increase: "12%", fill: "#FFD700" },
    ],
  },
];

const MOCK_TREND_COLORS: TrendColorData[] = [
  {
    rank: 1,
    colorName: "세이지 그린",
    colorHex: "#B2AC88",
    score: 88,
    growthRate: 15,
    competitorCount: 2,
    averagePercent: 4,
    totalItemCount: 33,
    isTotal: false,
    brands: [
      { brandName: "A.P.C.", percent: 4, itemCount: 33 },
      { brandName: "Maison Kitsuné", percent: 4, itemCount: 33 },
      { brandName: "AMI", percent: 4, itemCount: 33 },
    ],
  },
  {
    rank: 2,
    colorName: "딥 네이비",
    colorHex: "#000080",
    score: 82,
    growthRate: 10,
    competitorCount: 4,
    averagePercent: 12,
    totalItemCount: 45,
    isTotal: false,
    brands: [
      { brandName: "Polo Ralph Lauren", percent: 12, itemCount: 45 },
      { brandName: "Lacoste", percent: 12, itemCount: 45 },
    ],
  },
  {
    rank: 3,
    colorName: "더스티 핑크",
    colorHex: "#DCAE96",
    score: 75,
    growthRate: 20,
    competitorCount: 3,
    averagePercent: 5,
    totalItemCount: 28,
    isTotal: false,
    brands: [{ brandName: "Cos", percent: 5, itemCount: 28 }],
  },
  {
    rank: 4,
    colorName: "블랙",
    colorHex: "#1A1A1A",
    score: 95,
    growthRate: 5,
    competitorCount: 10,
    averagePercent: 40,
    totalItemCount: 150,
    isTotal: true,
    brands: [
      { brandName: "Chanel", percent: 40, itemCount: 150 },
      { brandName: "Saint Laurent", percent: 40, itemCount: 150 },
    ],
  },
];

function NewColorAnalysis() {
  // const { brandList } = useFilterStore.getState();
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [displayTreeMapBrands, setDisplayTreeMapBrands] = useState([
    MOCK_GRAPHS[0],
  ]);

  // useEffect(() => {
  //   const load = async () => {
  //     try {
  //       setLoading(true);
  //       const res = await GetColorGraph();
  //       setBlocks(Array.isArray(res?.brands) ? res.brands : []);
  //     } catch (e) {
  //       if (isAxiosError(e) && e.response?.status === 401) {
  //         setPasswordModalOpen(true);
  //         return;
  //       }
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   load();
  // }, [brandList]);

  const handleCompareSubmit = (brands: string[]) => {
    brands.forEach((brandName) => {
      if (displayTreeMapBrands.length >= 3) return;
      if (displayTreeMapBrands.some((d) => d.brand === brandName)) return;
      const mock = MOCK_GRAPHS.find((m) => m.brand === brandName);
      const entry = mock ?? { brand: brandName, data: MOCK_GRAPHS[0].data };
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
      <div className="w-full px-3 py-2 bg-[#F8F9FA] rounded-lg border border-[#F1F3F5] flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-9">
          <span className="text-sm font-medium text-[#6F7173]">시즌선택</span>
          <span className="text-base font-semibold text-[#3D3F41]">
            2025 Spring/Summer
          </span>
        </div>
        <Icon icon="ph:caret-down-bold" className="w-4 h-4 text-[#868E96]" />
      </div>
      <div className="flex items-start justify-between mt-8 mb-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 bg-[#F1F3F5] rounded-lg">
              <Icon
                icon="mdi:shopping-outline"
                className="w-4 h-4 text-[#3D3F41]"
              />
            </div>
            <header className="text-xl font-bold tracking-tight text-[#3D3F41]">
              색상 비중 비교
            </header>
          </div>
          <p className="text-[#888A8C] leading-6 text-base font-medium pl-1">
            세부 톤까지 확장된 색상 흐름을 브랜드 단위로 확인해보세요.
          </p>
        </div>

        {/* 뷰 전환 버튼 그룹 */}
        <div className="flex items-center p-1 bg-[#F8F9FA] rounded-xl border border-[#F1F3F5] shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-[#3D3F41] border border-[#E4E4E4] shadow-sm" : "text-[#ADB5BD]"}`}
          >
            <Icon icon="ph:grid-nine" className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-[#3D3F41] border border-[#E4E4E4] shadow-sm" : "text-[#ADB5BD]"}`}
          >
            <Icon icon="fa7-solid:list-ul" className="w-5 h-5" />
          </button>
        </div>
      </div>
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
      {/* 그래프 영역: viewMode에 따라 TreeMap 또는 ColorBar를 보여줌 */}
      <div
        className={`flex w-full gap-5 items-start  transition-all duration-500`}
      >
        {displayTreeMapBrands.map((block) => (
          <div key={block.brand} className="flex-1 min-w-0">
            {viewMode === "grid" ? (
              <ColorTreeMap
                title={block.brand}
                data={block.data}
                onClose={() => handleRemoveTreeMap(block.brand)}
              />
            ) : (
              <ColorBar
                title={block.brand}
                data={block.data}
                onClose={() => handleRemoveTreeMap(block.brand)}
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
              bg-[#F8F9FA] border-2 border-dashed border-[#E9ECEF] rounded-xl
              hover:bg-[#F1F3F5] transition-all group shrink-0
              ${displayTreeMapBrands.length === 1 ? "w-70" : "w-30"}
            `}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="text-[#3D3F41] text-sm font-semibold group-hover:text-[#495057] whitespace-nowrap">
                브랜드 추가하기
              </span>

              <div className="w-6 h-6 flex items-center justify-center rounded-full border-1 border-[#6F7173] text-[#6F7173] group-hover:border-[#495057] group-hover:text-[#495057]">
                <Icon
                  icon="lucide:plus"
                  width="16"
                  height="16"
                  className="stroke-[3]" // 두께 유지
                />
              </div>
            </div>
          </button>
        )}
      </div>
      <SubTitleBox
        title="신규 주목 색상"
        label="트렌드 컬러"
        infoText="매일 오전 10시, 무신사·W컨셉·네이버 등 주요 패션 플랫폼의 검색어 데이터를 자동 수집하며, 매거진·SNS 언급량 분석을 결합해 월별 종합 랭킹과 최근 주목도가 급상승한 패션 트렌드를 함께 제공합니다."
      />
      <p className="text-[#888A8C] leading-6 text-base font-medium mt-1 mb-4">
        모든 경쟁사가 소량으로 동시 출시 중인 유행 색상입니다.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {MOCK_TREND_COLORS.map((item) => (
          <TrendColorBox key={item.rank} data={item} />
        ))}
      </div>
      {/* 하단 리스트 영역 */}
      {/* <div
        className={
          isDetailOpen
            ? "mt-8 grid grid-cols-[450px_1fr] gap-6 items-start h-[80vh]"
            : "mt-8 grid gap-6"
        }
        style={
          !isDetailOpen
            ? {
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(430px, max-content))",
              }
            : undefined
        }
      >
        <div
          className={
            isDetailOpen
              ? "flex flex-col gap-6 h-full overflow-y-auto min-h-0 hide-scrollbar pr-1"
              : "contents"
          }
        >
          {loading && (
            <div className="px-1 text-sm text-gray-500">불러오는 중…</div>
          )}
          {!loading && blocks.length === 0 && (
            <div className="px-1 text-sm text-gray-500">
              표시할 데이터가 없어요.
            </div>
          )}
          {!loading &&
            blocks
              .filter((block) => block.brand !== "전체")
              .map((block) => <NewColorBox key={block.brand} block={block} />)}
        </div>

        {isDetailOpen && (
          <aside className="min-w-0 px-5 py-8 bg-white rounded-xl shadow-[0_0_8px_0_rgba(0,0,0,0.15)] h-full overflow-y-auto min-h-0 hide-scrollbar">
            <ProductDetailContent />
          </aside>
        )}
      </div> */}
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
