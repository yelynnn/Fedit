import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { useUIStore } from "@/stores/UIStore";
import BrandFilterModal from "../filter/BrandFilterModal";
import ExcelDownloadButton from "../filter/ExcelDownloadButton";
import { getPlatformBrandCounts } from "@/lib/platformBrandCounts";
import { useFeatureReleased } from "@/lib/features";
import { useProductStore } from "@/stores/ProductStore";
import SaveToBoardButton from "../product/SaveToBoardButton";
import { COMPARE_MAX, useCompareStore } from "@/stores/CompareStore";
import dashboardIcon from "@/assets/etc/dashboardIcon.svg";
import analysisIcon from "@/assets/etc/analysisIcon.svg";
import colorIcon from "@/assets/etc/colorIcon.svg";
import categoryIcon from "@/assets/etc/categoryIcon.svg";
import runwayIcon from "@/assets/etc/runwayIcon.svg";

// 헤더 왼쪽 제목 아이콘 — 사이드바 메뉴 아이콘과 같은 이미지를 쓴다
const TAB_ICONS: Record<string, { src?: string; iconify?: string }> = {
  "실시간 랭킹": { src: dashboardIcon },
  "상품 분석": { src: analysisIcon },
  "색상 분석": { src: colorIcon },
  "유형 분석": { src: categoryIcon },
  "패션쇼 분석": { src: runwayIcon },
  "내 보드": { iconify: "lucide:layout-panel-left" },
};

// 헤더 오른쪽 버튼 공통 모양 — 높이 34px, 패딩 4px 8px, 아이콘·글씨 간격 6px,
// 둥글기 8px, 1px #E4E4E4 테두리, 흰 바탕, Body(md)/small(14px·500) #3D3F41
const HEADER_BUTTON =
  "flex h-[34px] shrink-0 cursor-pointer select-none items-center justify-center gap-[6px] rounded-lg border border-[#E4E4E4] bg-white px-2 py-1 text-[14px] font-medium leading-[1.43] tracking-[-0.07px] text-[#3D3F41] transition-colors hover:bg-surface-base";
// 헤더 버튼 아이콘 크기(13.75 × 16.25, #3D3F41)
const HEADER_ICON = "h-[16.25px] w-[13.75px] shrink-0 text-[#3D3F41]";

export default function NewHeader() {
  const { isBrandFilterModalOpen, openBrandFilterModal, closeBrandFilterModal, showNotice } =
    useUIStore((s) => s);
  const { selectedTab, setSelectedTab } = useFilterStore((s) => s);
  const isReleased = useFeatureReleased();
  const brandList = useFilterStore((s) => s.brandList);
  const platformList = useFilterStore((s) => s.platformList);

  // platformList에는 플랫폼 코드만 담겨 있어서(예: "musinsa" 1개), 실제로
  // 몇 개 브랜드를 뜻하는지는 카테고리별 브랜드 개수를 따로 조회해야 안다.
  const [platformBrandCounts, setPlatformBrandCounts] = useState<
    Record<string, number>
  >({});
  useEffect(() => {
    getPlatformBrandCounts().then(setPlatformBrandCounts).catch(() => {});
  }, []);
  const selectedBrandCount =
    brandList.length +
    platformList.reduce((sum, code) => sum + (platformBrandCounts[code] ?? 0), 0);

  const tabIcon = TAB_ICONS[selectedTab] ?? TAB_ICONS["실시간 랭킹"];

  // 상품 분석에서 상품을 열었으면 "상품 분석 > 아우터 > 자켓 > 상품명" 경로를
  // 보여준다. 상세가 불러온 정보가 우선이고, 아직 불러오는 중이면 목록에 있던
  // 같은 상품 정보로 먼저 채운다.
  const selectedProductId = useProductStore((s) => s.selectedProductId);
  const setSelectedProductId = useProductStore((s) => s.setSelectedProductId);
  const productMeta = useProductStore((s) => s.selectedProductMeta);
  const resultLists = useProductStore((s) => s.resultLists);
  // 상품 비교 화면(상품 분석 안의 페이지)이면 경로가 "상품 분석 > 상품 비교"
  const comparePageOpen = useCompareStore((s) => s.pageOpen);
  const closeComparePage = useCompareStore((s) => s.closePage);
  const isComparePage = selectedTab === "상품 분석" && comparePageOpen;
  const isProductDetail = selectedTab === "상품 분석" && !!selectedProductId && !isComparePage;
  const compareItems = useCompareStore((s) => s.items);
  const addCompare = useCompareStore((s) => s.add);
  const removeCompare = useCompareStore((s) => s.remove);
  const isInCompare = compareItems.some((i) => i.itemcode === selectedProductId);
  const breadcrumb = (() => {
    if (!isProductDetail) return [];
    if (productMeta?.itemcode === selectedProductId) {
      return [productMeta.mainCategory, productMeta.category, productMeta.name];
    }
    const row = resultLists.find((p) => p.itemcode === selectedProductId);
    return row
      ? [row.categories?.[0]?.main_category, row.categories?.[0]?.category, row.product_name]
      : [];
  })()
    // 빈 값과 바로 앞과 같은 이름(대분류 = 소분류)은 건너뛴다
    .filter((v, i, arr): v is string => !!v && v !== arr[i - 1]);

  return (
    <header className="sticky top-0 z-20 w-full bg-white border-b border-line-divider">
    <div className="flex items-center justify-between w-full px-16 h-15">
      {/* 좌측 — 현재 메뉴 아이콘 + 이름, 상품 상세면 경로 */}
      {isProductDetail || isComparePage ? (
        <nav className="flex items-center min-w-0 gap-2 mr-6 text-[16px] leading-[1.5] tracking-[-0.08px]">
          {/* 누르면 상세(또는 비교 화면)를 닫고 목록으로 돌아간다 */}
          <button
            type="button"
            onClick={() => (isComparePage ? closeComparePage() : setSelectedProductId(null))}
            className="flex-shrink-0 font-medium text-[#8A8C8E] hover:text-[#242628]"
          >
            상품 분석
          </button>
          {(isComparePage ? ["상품 비교"] : breadcrumb).map((label, i, crumbs) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={`${label}-${i}`} className={`flex items-center gap-2 ${isLast ? "min-w-0" : "flex-shrink-0"}`}>
                <Icon icon="ph:caret-right" className="flex-shrink-0 w-4 h-4 text-[#A6A8AA]" />
                <span
                  title={label}
                  className={isLast ? "truncate font-semibold text-[#242628]" : "font-medium text-[#8A8C8E]"}
                >
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      ) : (
      <div className="flex items-center gap-2">
        {/* 24×24 아이콘 칸 가운데에 그림 18.001×19.001px — 원본 비율이 달라도 칸 안에 맞춘다 */}
        <span className="flex items-center justify-center w-6 h-6 shrink-0">
          {tabIcon.src ? (
            <img src={tabIcon.src} alt="" className="h-[19.001px] w-[18.001px] object-contain" />
          ) : (
            <Icon icon={tabIcon.iconify!} className="h-[19.001px] w-[18.001px] text-tx-neutral" />
          )}
        </span>
        {/* Title(sb)/medium — 16px·600·150%·-0.08px, #242628 */}
        <span className="text-[16px] font-semibold leading-[1.5] tracking-[-0.08px] text-[#242628]">
          {selectedTab || "실시간 랭킹"}
        </span>
      </div>
      )}

      {/* 우측 — Excel(상품 분석만) · 내 보드 · 관심 브랜드 */}
      <div className="flex items-center flex-shrink-0 gap-2">
        {selectedTab === "상품 분석" && !isComparePage && <ExcelDownloadButton />}

        {isReleased("내 보드") && (
          <button
            type="button"
            data-tour="my-board-button"
            onClick={() => setSelectedTab("내 보드")}
            className={HEADER_BUTTON}
          >
            <Icon icon="lucide:layout-panel-left" className={HEADER_ICON} />
            내 보드
          </button>
        )}

        <button
          type="button"
          data-tour="brand-chip"
          onClick={openBrandFilterModal}
          className={HEADER_BUTTON}
        >
          {/* 초록 아이콘 박스 — 패딩 4px, 둥글기 8px, #E8FFD8 */}
          <span className="flex items-center p-1 rounded-lg bg-[#E8FFD8]">
            <Icon icon="ph:storefront-fill" className={HEADER_ICON} />
          </span>
          관심 브랜드
          {/* 지금 선택된 브랜드 개수(플랫폼 전체 선택은 그 플랫폼 브랜드 수로 계산)
              — 높이·최소 너비 20px, 패딩 4px, #242628, 숫자 10px·500 흰색 */}
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#242628] p-1 text-center text-[10px] font-medium leading-[1.33] text-white">
            {selectedBrandCount}
          </span>
        </button>
      </div>

    </div>

      {/* 상품 상세 줄 — 상품 정보 + 통합 지수 + 내 보드에 저장 · 비교 추가 · 공유 */}
      {isProductDetail && productMeta?.itemcode === selectedProductId && (
        // 높이 56px, 위아래 패딩 8px, 요소 간격 12px(좌우는 위 줄과 맞춰 px-16)
        <div className="flex items-center self-stretch justify-between w-full h-14 gap-3 px-16 py-2">
          <div className="flex items-center min-w-0 gap-3">
            {productMeta.imageUrl ? (
              <img
                src={productMeta.imageUrl}
                alt=""
                className="flex-shrink-0 object-cover w-10 h-10 rounded-lg bg-surface-base"
              />
            ) : (
              <span className="grid flex-shrink-0 w-10 h-10 text-[16px] font-semibold text-white rounded-lg place-items-center bg-[#242628]">
                {(productMeta.brand || productMeta.name).slice(0, 1)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] leading-[1.38] text-[#8A8C8E]">
                {[productMeta.brand, productMeta.category ?? productMeta.mainCategory]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="truncate text-[16px] font-medium leading-[1.5] tracking-[-0.08px] text-[#242628]">
                {productMeta.name}
              </p>
            </div>
          </div>

          {/* 오른쪽 배지·버튼 사이 가로 간격 12px */}
          <div className="flex items-center flex-shrink-0 gap-3">
            {productMeta.trendScore != null && (
              <span className="rounded-md bg-[#FFEDED] px-2 py-1 text-[13px] font-semibold leading-[1.38] text-[#E5484D]">
                통합 지수 {Math.round(productMeta.trendScore)}점
                {productMeta.trendBand ? ` · ${productMeta.trendBand}` : ""}
              </span>
            )}
            <SaveToBoardButton
              key={productMeta.itemcode}
              itemcode={productMeta.itemcode}
              brand={productMeta.brand}
              category={productMeta.mainCategory ?? productMeta.category}
              imageUrl={productMeta.imageUrl}
              className={HEADER_BUTTON}
              iconClassName={HEADER_ICON}
            />
            {/* 비교 담기(최대 4개) — 이미 담긴 상품이면 다시 누를 때 빠진다 */}
            <button
              type="button"
              onClick={() => {
                if (isInCompare) {
                  removeCompare(productMeta.itemcode);
                  return;
                }
                const result = addCompare({
                  itemcode: productMeta.itemcode,
                  brand: productMeta.brand,
                  product_name: productMeta.name,
                  thumbnail: productMeta.imageUrl,
                });
                if (result === "full") {
                  showNotice(`최대 ${COMPARE_MAX}개까지 비교할 수 있어요`);
                }
              }}
              className={HEADER_BUTTON}
            >
              <Icon icon={isInCompare ? "ph:check" : "ph:plus"} className={HEADER_ICON} />
              {isInCompare ? "비교 담김" : "비교 추가"}
            </button>
            {/* 이 상품을 바로 여는 링크(/?product=상품코드)를 복사한다 */}
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/?product=${encodeURIComponent(productMeta.itemcode)}`;
                try {
                  await navigator.clipboard.writeText(url);
                  showNotice("상품 링크를 복사했어요.");
                } catch {
                  showNotice("링크를 복사하지 못했어요.");
                }
              }}
              className={HEADER_BUTTON}
            >
              <Icon icon="ph:link" className={HEADER_ICON} />
              공유
            </button>
          </div>
        </div>
      )}

      <BrandFilterModal
        isOpen={isBrandFilterModalOpen}
        onClose={closeBrandFilterModal}
        onSubmit={closeBrandFilterModal}
      />
    </header>
  );
}
