import TypeBox from "@/components/type/TypeBox";
import { MockTypeData } from "@/data/mock/MockTypeData";
import useFilteredData from "@/lib/filteredData";

function TypeAnalysis() {
  const { selectedBrands } = useFilteredData();

  const filteredBrands =
    selectedBrands.length === 0
      ? MockTypeData.filter((brand) => brand.title === "전체")
      : MockTypeData.filter(
          (brand) =>
            brand.title === "전체" || selectedBrands.includes(brand.title)
        );

  return (
    <div
      className="grid gap-6 p-6 "
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
      }}
    >
      {filteredBrands.map((brand) => (
        <TypeBox
          key={brand.title}
          title={brand.title}
          chartData={brand.chartData}
          rows={brand.rows}
        />
      ))}
    </div>
  );
}

export default TypeAnalysis;
