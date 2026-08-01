import FilterSideBar from "@/components/filter/FilterSideBar";
import ProductBox from "@/components/product/ProductBox";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import { useProductStore } from "@/stores/ProductStore";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Modal from "react-modal";
import SideFilterModal from "@/components/filter/SideFilterModal";
import useFilteredData from "@/lib/filteredData";
import { useFilterStore } from "@/stores/FilterStore";
import {
  useSubscriptionStore,
  isBasicPlan,
  getEffectivePlan,
  isLockedPlan,
} from "@/stores/SubscriptionStore";
import { useUIStore } from "@/stores/UIStore";
import errorIcon from "@/assets/etc/error.svg";
import SubscriptionLockOverlay from "@/components/common/SubscriptionLockOverlay";

import { GetProductList } from "@/apis/AnalysisAPI";
import type { ApiDetail } from "@/types/Product";

function NewProductAnalysis() {
  const {
    selectedProductId,
    setSelectedProductId,
    setResultLists,
    resultLists,
  } = useProductStore((s) => s);

  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filterInitialTab, setFilterInitialTab] = useState("성별");
  const [selectedProduct, setSelectedProduct] = useState<ApiDetail | null>(
    null,
  );

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const clickedItemRef = useRef<string | null>(null);
  const itemButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sectionRef = useRef<HTMLElement | null>(null);

  const isDetailOpen = !!selectedProductId;
  const {
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
  } = useFilteredData();
  const { brandList, platformList } = useFilterStore();
  const interestBrandPicks = useFilterStore((s) => s.interestBrandPicks);
  const { subscription, loaded: subscriptionLoaded } = useSubscriptionStore(
    (s) => s,
  );
  const isLocked =
    subscriptionLoaded && isLockedPlan(getEffectivePlan(subscription));
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  // 개발 중 실제 basic 플랜 없이도 배너를 확인하기 위한 디버그 강제 노출: /?showBrandModal=1
  const isDevBannerForce =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("showBrandModal") === "1";
  // Basic 플랜인데 저장된 관심 브랜드 10개가 다 채워지지 않았으면 항상 노출.
  // (지금 화면에서 필터링 중인 brandList가 아니라 저장된 픽 기준으로 판단 —
  // 안 그러면 10개 중 일부만 보려고 체크를 풀었을 때도 배너가 다시 뜬다.)
  const showBrandNotice =
    (isDevBannerForce || isBasicPlan(subscription?.plan)) &&
    interestBrandPicks.length < 10;

  const fetchData = useCallback(
    async (cursor: string | null = null) => {
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setIsFetching(true);
        const data = await GetProductList({
          brandList,
          platformList,
          selectedColors,
          selectedGenders,
          selectedCategories,
          selectedDetails,
          selectedPatterns,
          selectedSeasons,
          cursor,
        });

        const newList = Array.isArray(data?.items) ? data.items : [];

        if (!cursor) {
          setResultLists(newList);
        } else {
          setResultLists((prev) => [...prev, ...newList]);
        }

        setNextCursor(data?.nextCursor || null);
      } catch {
        // 무시: 목록은 비워두지 않고 이전 상태 유지
      } finally {
        isFetchingRef.current = false;
        setIsFetching(false);
      }
    },
    [
      brandList,
      platformList,
      selectedColors,
      selectedGenders,
      selectedCategories,
      selectedDetails,
      selectedPatterns,
      selectedSeasons,
      setResultLists,
    ],
  );

  useEffect(() => {
    setSelectedProductId(null);
  }, [setSelectedProductId]);

  // 상세 닫힐 때 클릭했던 상품이 보이도록 스크롤 복원
  useLayoutEffect(() => {
    if (isDetailOpen || !clickedItemRef.current) return;
    const el = itemButtonRefs.current[clickedItemRef.current!];
    el?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [isDetailOpen]);

  // brandList 등은 상위(구독/관심 브랜드 로딩, 상세 필터 목록 로딩)가 끝날
  // 때마다 내용은 그대로인데 배열 참조만 새로 만들어지는 경우가 있다(예:
  // GetDetailList/GetPatternList 응답이 늦게 도착해 selectedDetails/
  // selectedPatterns가 빈 배열인 채로 참조만 바뀌는 경우). 참조가 아니라
  // 실제 값이 바뀌었을 때만 다시 불러오도록 내용 기준 키로 한 번 걸러서
  // 같은 조건으로 상품 목록 API가 중복 호출되지 않게 한다.
  const fetchKey = JSON.stringify([
    brandList,
    platformList,
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
  ]);
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    setNextCursor(null);
    fetchData(null);
  }, [fetchKey, fetchData]);

  useEffect(() => {
    if (!nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          fetchData(nextCursor);
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      },
    );

    const currentTarget = loadMoreRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [nextCursor, fetchData]);

  return (
    <div className="flex h-full gap-5 px-4 overflow-hidden">
      <FilterSideBar
        onOpenFilter={(tab) => {
          setFilterInitialTab(tab);
          setFilterOpen(true);
        }}
      />
      <div
        className={[
          "flex h-full flex-col gap-3 overflow-hidden",
          isDetailOpen ? "w-[220px] shrink-0" : "flex-1 min-w-0",
        ].join(" ")}
      >
        {showBrandNotice && !isDetailOpen && (
          <div
            data-tour="brand-banner"
            className="flex h-[50px] w-[calc(100%-20px)] flex-shrink-0 items-center justify-between gap-2 rounded-lg bg-data-blue-light px-2 py-2"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <img src={errorIcon} alt="" className="h-5 w-5 flex-shrink-0" />
              <span className="type-title-small truncate text-tx-neutral">
                아직 브랜드를 고르지 않았어요. 지금은 무신사 기본 데이터를 보고
                있어요. 관심 브랜드 10개를 고르면 분석이 더 정확해져요.
              </span>
            </div>
            <button
              type="button"
              onClick={() => openSettingsModal("관심브랜드")}
              className="flex h-[34px] flex-shrink-0 items-center justify-center gap-1.5 rounded-md bg-fill-primary px-2 py-1 type-body-small text-tx-inverse"
            >
              브랜드 선택하기
            </button>
          </div>
        )}
        <section
          ref={sectionRef}
          className={`relative h-full flex-1 min-h-0 hide-scrollbar ${isLocked ? "overflow-hidden" : "overflow-auto"}`}
        >
        {isLocked && <SubscriptionLockOverlay />}
        <div
          className={[
            isDetailOpen
              ? "flex flex-col overflow-y-auto hide-scrollbar"
              : "flex flex-wrap overflow-y-auto hide-scrollbar",
            isLocked ? "pointer-events-none select-none" : "",
          ].join(" ")}
          style={isLocked ? { opacity: 0.5, filter: "blur(1.75px)" } : undefined}
        >
          {resultLists.map((product, index) => (
            <button
              key={product.itemcode}
              ref={(el) => {
                itemButtonRefs.current[product.itemcode] = el;
              }}
              data-tour={index === 0 ? "first-product-card" : undefined}
              onClick={() => {
                clickedItemRef.current = product.itemcode;
                setSelectedProductId(product.itemcode);
                setSelectedProduct(product);
              }}
              className="text-left"
            >
              <ProductBox product={product} />
            </button>
          ))}

          {!isFetching && nextCursor && resultLists.length > 0 && (
            <div ref={loadMoreRef} className="w-full h-10" />
          )}

          {isFetching && (
            <div className="flex items-center justify-center w-full h-24">
              <div className="text-sm font-medium text-gray-400 animate-pulse">
                상품 목록을 불러오고 있습니다...
              </div>
            </div>
          )}
        </div>
        </section>
      </div>

      {isDetailOpen && (
        <aside className="flex-1 min-w-0 h-full px-5 py-8 overflow-y-auto bg-white hide-scrollbar rounded-xl shadow-[0_0_8px_0_rgba(0,0,0,0.15)]">
          <ProductDetailContent product={selectedProduct} />
        </aside>
      )}
      <Modal
        isOpen={isFilterOpen}
        onRequestClose={() => setFilterOpen(false)}
        overlayClassName="fixed inset-0 bg-black/30 flex items-center justify-center z-[100]"
        className="box-border flex flex-col py-4 bg-white shadow-xl outline-none w-125 h-138 rounded-xl"
      >
        <SideFilterModal
          onClose={() => setFilterOpen(false)}
          initialTab={filterInitialTab}
        />
      </Modal>
    </div>
  );
}

export default NewProductAnalysis;
