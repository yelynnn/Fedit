import FilterSideBar from "@/components/filter/FilterSideBar";
import ProductBox from "@/components/product/ProductBox";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import { useProductStore } from "@/stores/ProductStore";
import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import SideFilterModal from "@/components/filter/SideFilterModal";
import useFilteredData from "@/lib/filteredData";
import { useFilterStore } from "@/stores/FilterStore";
import type { ApiDetail } from "@/types/Product";
import PasswordModal from "@/components/main/PasswordModal";
import { isAxiosError } from "axios";
import { GetProductList } from "@/apis/AnalysisAPI";

function NewProductAnalysis() {
  const {
    selectedProductId,
    setSelectedProductId,
    setResultLists,
    resultLists,
  } = useProductStore((s) => s);

  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiDetail | null>(
    null,
  );

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const isDetailOpen = !!selectedProductId;
  const { selectedColors, selectedGenders, selectedCategories } =
    useFilteredData();
  const { brandList } = useFilterStore();

  const fetchData = useCallback(
    async (cursor: string | null = null) => {
      if (isFetching) return;

      try {
        setIsFetching(true);
        const data = await GetProductList({
          brandList,
          selectedColors,
          selectedGenders,
          selectedCategories,
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
        if (isAxiosError(err) && err.response?.status === 401) {
          setPasswordModalOpen(true);
          return;
        }
        console.error("데이터 로드 실패", err);
      } finally {
        setIsFetching(false);
      }
    },
    [
      brandList,
      selectedColors,
      selectedGenders,
      selectedCategories,
      setResultLists,
      isFetching,
    ],
  );

  useEffect(() => {
    setNextCursor(null);
    fetchData(null);
  }, [brandList, selectedColors, selectedGenders, selectedCategories]);

  useEffect(() => {
    if (isFetching || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          fetchData(nextCursor);
        }
      },
      {
        rootMargin: "200px", // 바닥에 닿기 200px 전에 미리 호출 (사용자 경험 개선)
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
  }, [nextCursor, isFetching, fetchData]);

  return (
    <div className="flex gap-5 px-4">
      <FilterSideBar onOpenFilter={() => setFilterOpen(true)} />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
      <section
        className={[
          "transition-all duration-200",
          isDetailOpen
            ? "w-[220px] shrink-0 overflow-y-auto"
            : "flex-1 min-w-0 overflow-auto",
        ].join(" ")}
      >
        <div
          className={
            isDetailOpen
              ? "flex flex-col h-screen overflow-y-auto hide-scrollbar "
              : "grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] overflow-y-auto hide-scrollbar"
          }
        >
          {resultLists.map((product) => (
            <button
              key={product.itemcode}
              onClick={() => {
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
        <aside className="flex-1 min-w-0 px-5 py-8 overflow-y-auto bg-white hide-scrollbar rounded-xl shadow-[0_0_8px_0_rgba(0,0,0,0.15)] h-fit">
          <ProductDetailContent product={selectedProduct} />
        </aside>
      )}
      <Modal
        isOpen={isFilterOpen}
        onRequestClose={() => setFilterOpen(false)}
        overlayClassName="fixed inset-0 bg-black/30 flex items-center justify-center z-[100]"
        className="box-border flex flex-col py-4 bg-white shadow-xl outline-none w-125 h-138 rounded-xl"
      >
        <SideFilterModal onClose={() => setFilterOpen(false)} />
      </Modal>
    </div>
  );
}

export default NewProductAnalysis;
