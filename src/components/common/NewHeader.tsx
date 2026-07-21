import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import { useUIStore } from "@/stores/UIStore";
import BrandFilterModal from "../filter/BrandFilterModal";
import BrandTab from "../filter/BrandTab";

// 사이드바와 동일한 설정 (이 설정은 별도 파일로 분리해서 공통으로 쓰는 것이 가장 좋습니다)
const TABS_CONFIG = [
  {
    label: "실시간 랭킹",
    activeIcon: "material-symbols:dashboard-rounded",
    inactiveIcon: "material-symbols:dashboard-outline-rounded",
  },
  {
    label: "패션쇼 분석",
    activeIcon: "ph:dress-fill",
    inactiveIcon: "ph:dress",
  },
  {
    label: "상품 분석",
    activeIcon: "fluent:tag-32-filled",
    inactiveIcon: "fluent:tag-28-regular",
  },
  {
    label: "색상 분석",
    activeIcon: "zondicons:color-palette",
    inactiveIcon: "qlementine-icons:color-swatch-16",
  },
  {
    label: "유형 분석",
    activeIcon: "ph:chart-pie-slice-fill",
    inactiveIcon: "ph:chart-pie-slice",
  },
];

export default function NewHeader() {
  const { isBrandFilterModalOpen, openBrandFilterModal, closeBrandFilterModal } =
    useUIStore((s) => s);
  const { selectedTab, setSelectedTab } = useFilterStore((s) => s);
  const brandList = useFilterStore((s) => s.brandList);

  // 1. 현재 선택된 탭의 아이콘 정보를 찾습니다.
  // 찾지 못할 경우(초기값 등)를 대비해 대시보드 아이콘을 기본값으로 설정합니다.
  const currentTabConfig =
    TABS_CONFIG.find((tab) => tab.label === selectedTab) || TABS_CONFIG[0];

  return (
    <header className="relative flex items-center justify-between w-full h-15 px-16 bg-white border-b border-line-divider sticky top-0 z-20">
      {/* 좌측 타이틀 영역 */}
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-1 bg-brand-subtle text-tx-strong border border-brand-subtle-hover">
          {/* 2. 고정된 아이콘 대신 currentTabConfig.activeIcon 사용 */}
          <Icon
            icon={currentTabConfig.activeIcon}
            className="w-5 h-5 text-tx-neutral"
          />
        </div>
        <span className="text-lg font-semibold text-tx-neutral">
          {selectedTab || "실시간 랭킹"}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <div className="relative group/brand">
            <div
              data-tour="brand-chip"
              onClick={openBrandFilterModal}
              className="cursor-pointer flex items-center h-10 px-3 py-2 bg-surface-base rounded-l-2xl hover:bg-surface-base transition-colors"
            >
              <span className="text-[15px] font-semibold text-tx-alt mr-2">
                브랜드
              </span>
              <span className="flex items-center justify-center min-w-[42px] h-7 px-2 bg-tx-neutral text-white text-[13px] font-semibold rounded-full">
                {brandList.length}
              </span>
            </div>

            <div className="fixed left-0 z-30 invisible w-full transition-all duration-200 opacity-0 pointer-events-none top-15 group-hover/brand:opacity-100 group-hover/brand:visible group-hover/brand:pointer-events-auto">
              <div className="bg-white border-b border-line-divider shadow-md">
                <BrandTab isProductTab={selectedTab === "상품 분석"} />
              </div>
            </div>
          </div>

          <div
            data-tour="my-board-button"
            onClick={() => setSelectedTab("내 보드")}
            className="cursor-pointer flex items-center h-10 px-4 bg-surface-base rounded-r-2xl hover:bg-surface-base transition-colors"
          >
            <span className="text-[15px] font-semibold text-tx-alt mr-1.5">
              내 보드
            </span>
            <Icon
              icon="ph:caret-down-bold"
              className="w-3.5 h-3.5 text-icon-neutral"
            />
          </div>
        </div>

        {/* 사용자 아바타
        <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          E
        </div> */}
      </div>

      <BrandFilterModal
        isOpen={isBrandFilterModalOpen}
        onClose={closeBrandFilterModal}
        onSubmit={closeBrandFilterModal}
      />
    </header>
  );
}
