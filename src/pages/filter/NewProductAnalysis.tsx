import FilterSideBar from "@/components/filter/FilterSideBar";
import ProductBox from "@/components/product/ProductBox";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import { useProductStore } from "@/stores/ProductStore";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Modal from "react-modal";
import SideFilterModal from "@/components/filter/SideFilterModal";
import useFilteredData from "@/lib/filteredData";
import { useFilterStore } from "@/stores/FilterStore";

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
  } = useFilteredData();
  const { brandList } = useFilterStore();

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
        console.error("데이터 로드 실패", err);
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
      <section
        ref={sectionRef}
        className={[
          "h-full hide-scrollbar",
          isDetailOpen
            ? "w-[220px] shrink-0 overflow-y-auto"
            : "flex-1 min-w-0 overflow-auto",
        ].join(" ")}
      >
        <div
          className={
            isDetailOpen
              ? "flex flex-col overflow-y-auto hide-scrollbar"
              : "grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] overflow-y-auto hide-scrollbar"
          }
        >
          {resultLists.map((product) => (
            <button
              key={product.itemcode}
              ref={(el) => {
                itemButtonRefs.current[product.itemcode] = el;
              }}
              onClick={() => {
                clickedItemRef.current = product.itemcode;
                setSelectedProductId(product.itemcode);
                setSelectedProduct(product);
              }}
              className="w-full text-left"
            >
              <ProductBox product={product} />
            </button>
          ))}

          {!isFetching && nextCursor && resultLists.length > 0 && (
            <div ref={loadMoreRef} className="w-full h-10 col-span-full" />
          )}

          {isFetching && (
            <div className="flex items-center justify-center w-full h-24 col-span-full">
              <div className="text-sm font-medium text-gray-400 animate-pulse">
                상품 목록을 불러오고 있습니다...
              </div>
            </div>
          )}
        </div>
      </section>

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
