import ProductBox from "@/components/product/ProductBox";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import useFilteredData from "@/lib/filteredData";
import { useProductStore } from "@/stores/ProductStore";
import { useEffect, useState } from "react";
import mockData from "@/data/mock/mockup_v3.json";

type ProductItem = (typeof mockData)[number];

function ProductAnalysis() {
  const { selectedProductId, setSelectedProductId } = useProductStore(
    (state) => state
  );
  const [resultLists, setResultLists] = useState<ProductItem[]>([]);
  const {
    selectedBrands,
    selectedColors,
    selectedGenders,
    // selectedDetails,
    // selectedPatterns,
    selectedCategories,
  } = useFilteredData();

  useEffect(() => {
    const filtered = mockData.filter((item) => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.category);

      const brandMatch =
        selectedBrands.length === 0 || selectedBrands.includes(item.brand);

      const genderMatch =
        selectedGenders.length === 0 || selectedGenders.includes(item.gender);

      const colorMatch =
        selectedColors.length === 0 ||
        selectedColors.includes(item.main_color.toLowerCase());

      return categoryMatch && brandMatch && genderMatch && colorMatch;
    });

    setResultLists(filtered);
    console.log("📦 선택된 조건에 맞는 상품 리스트:", filtered);
  }, [selectedCategories, selectedBrands, selectedGenders, selectedColors]);
  return (
    <div className="flex w-full h-full overflow-hidden ">
      <div
        className={`transition-all duration-300 overflow-y-auto hide-scrollbar p-6 bg-white
          ${selectedProductId ? "w-64 border-r" : "flex-1"}`}
        style={{ height: "100vh" }}
      >
        <header className="flex justify-between mt-4 mb-6 ml-4">
          {selectedProductId == null ? (
            <span className="text-xl font-semibold">선택된 상품 전체보기</span>
          ) : (
            <div></div>
          )}
          <span
            className={`text-[#91929D] ${selectedProductId ? "mr-0" : "mr-19"}`}
          >
            최신순 정렬
          </span>
        </header>

        <section
          className="grid pr-4 ml-4 auto-rows-auto gap-y-5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          {resultLists.map((product) => (
            <div
              key={product.itemcode}
              onClick={() => setSelectedProductId(product.itemcode)}
            >
              <ProductBox product={product} />
            </div>
          ))}
        </section>
      </div>

      {selectedProductId && (
        <div className="flex-1 p-8 overflow-y-auto bg-gray-100 hide-scrollbar">
          <ProductDetailContent />
        </div>
      )}
    </div>
  );
}

export default ProductAnalysis;
