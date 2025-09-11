import NewColorBox from "@/components/color/NewColorBox";
import TitleHeader from "@/components/common/TitleHeader";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import { MockNewColorData } from "@/data/mock/MockNewColorData";
import { useProductStore } from "@/stores/ProductStore";
import { useEffect, useState } from "react";
import { GetColorGraph } from "@/apis/AnalysisAPI";
import { useFilterStore } from "@/stores/FilterStore";

type ColorBlock = (typeof MockNewColorData.brands)[number];

function NewColorAnalysis() {
  const { selectedProductId } = useProductStore((s) => s);
  const { brandList } = useFilterStore.getState();

  const isDetailOpen = !!selectedProductId;

  const [blocks, setBlocks] = useState<ColorBlock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await GetColorGraph();
        const list = Array.isArray(res?.brands)
          ? (res.brands as ColorBlock[])
          : [];
        setBlocks(list);
        console.log(res);
      } catch (e) {
        console.error(e);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [brandList]);

  return (
    <div className="mt-14">
      <TitleHeader
        title="색상 분석"
        sub_title="세부 톤까지 확장된 색상 흐름을 브랜드 단위로 확인해보세요."
      />

      <div
        className={
          isDetailOpen
            ? "mt-8 grid grid-cols-[450px_minmax(0,1fr)] gap-6 items-start h-[80vh]"
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
      </div>
    </div>
  );
}

export default NewColorAnalysis;
