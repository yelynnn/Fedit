import FilterSideBar from "@/components/filter/FilterSideBar";
import ProductBox from "@/components/product/ProductBox";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import { useProductStore } from "@/stores/ProductStore";
import { useEffect, useState } from "react";
import mockData from "@/data/mock/mockup_v3.json";
import Modal from "react-modal";
import SideFilterModal from "@/components/filter/SideFilterModal";
import useFilteredData from "@/lib/filteredData";
import { PostProductList } from "@/apis/AnalysisAPI";
import { useFilterStore } from "@/stores/FilterStore";

type ProductItem = (typeof mockData)[number];

function NewProductAnalysis() {
  const { selectedProductId, setSelectedProductId } = useProductStore(
    (state) => state
  );

  const [resultLists, setResultLists] = useState<ProductItem[]>(mockData);
  const [isFilterOpen, setFilterOpen] = useState(false);

  const isDetailOpen = !!selectedProductId;

  const { selectedColors, selectedGenders, selectedCategories } =
    useFilteredData();

  const { brandList } = useFilterStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await PostProductList({
          brandList,
          selectedColors,
          selectedGenders,
          selectedCategories,
        });
        console.log("필터별 검색 결과 조회 성공", data);

        const list = Array.isArray(data?.products) ? data.products : [];
        setResultLists(list);
      } catch (err) {
        console.error("필터별 검색 결과 조회 실패", err);
        setResultLists([]);
      }
    };

    fetchData();
  }, [brandList, selectedColors, selectedGenders, selectedCategories]);

  return (
    <div className="flex gap-5 mt-14">
      <FilterSideBar onOpenFilter={() => setFilterOpen(true)} />
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
              ? "flex flex-col gap-4 h-screen overflow-y-auto hide-scrollbar"
              : "grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] overflow-y-auto hide-scrollbar"
          }
        >
          {resultLists.map((product) => (
            <button
              key={product.itemcode}
              onClick={() => setSelectedProductId(product.itemcode)}
              className="w-full text-left"
            >
              <ProductBox product={product} />
            </button>
          ))}
        </div>
      </section>

      {isDetailOpen && (
        <aside className="flex-1 min-w-0 px-5 py-8 overflow-y-auto bg-white hide-scrollbar rounded-xl shadow-[0_0_8px_0_rgba(0,0,0,0.15)] h-fit">
          <ProductDetailContent />
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
