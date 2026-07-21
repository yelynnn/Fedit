import FilterSideBar from "@/components/filter/FilterSideBar";
import ProductBox from "@/components/product/ProductBox";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import { useProductStore } from "@/stores/ProductStore";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Modal from "react-modal";
import SideFilterModal from "@/components/filter/SideFilterModal";
import useFilteredData from "@/lib/filteredData";
import { useFilterStore } from "@/stores/FilterStore";
import { useSubscriptionStore } from "@/stores/SubscriptionStore";
import { useUIStore } from "@/stores/UIStore";
import errorIcon from "@/assets/etc/error.svg";

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
  const { brandList } = useFilterStore();
  const { subscription } = useSubscriptionStore((s) => s);
  const openBrandFilterModal = useUIStore((s) => s.openBrandFilterModal);
  // 개발 중 실제 basic 플랜 없이도 배너를 확인하기 위한 디버그 강제 노출: /?showBrandModal=1
  const isDevBannerForce =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("showBrandModal") === "1";
  const showBrandNotice =
    (isDevBannerForce || subscription?.plan === "basic") &&
    brandList.length === 0;

  const fetchData = useCallback(
    async (cursor: string | null = null) => {
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setIsFetching(true);
        const data = await GetProductList({
          brandList,
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
      } catch (err) {
      } finally {
        isFetchingRef.current = false;
        setIsFetching(false);
      }
    },
    [
      brandList,
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

  useEffect(() => {
    setNextCursor(null);
    fetchData(null);
  }, [
    brandList,
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
    fetchData,
  ]);

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
              onClick={openBrandFilterModal}
              className="flex h-[34px] flex-shrink-0 items-center justify-center gap-1.5 rounded-md bg-fill-primary px-2 py-1 type-body-small text-tx-inverse"
            >
              브랜드 선택하기
            </button>
          </div>
        )}
        <section
          ref={sectionRef}
          className="h-full flex-1 min-h-0 overflow-auto hide-scrollbar"
        >
        <div
          className={
            isDetailOpen
              ? "flex flex-col overflow-y-auto hide-scrollbar"
              : "flex flex-wrap overflow-y-auto hide-scrollbar"
          }
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
