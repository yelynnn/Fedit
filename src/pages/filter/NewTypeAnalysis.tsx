import NewTypeBox from "@/components/type/NewTypeBox";
import { MockNewTypeData } from "@/data/mock/MockNewTypeData";
import { useEffect, useState } from "react";
import { GetCategoryGraph } from "@/apis/AnalysisAPI";
import QuestionTooltip from "@/components/common/QuestionTooltip";

type TypeBlock = (typeof MockNewTypeData)[number];

function NewTypeAnalysis() {
  const [blocks, setBlocks] = useState<TypeBlock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await GetCategoryGraph();

        const list = (
          Array.isArray(res)
            ? res
            : (res?.brands ?? res?.items ?? res?.data ?? [])
        ) as TypeBlock[];

        setBlocks(list);
      } catch {
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="px-14">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <header className="text-2xl font-semibold leading-9 text-tx-neutral">
            유형 분석
          </header>
          <QuestionTooltip
            label="유형 트렌드"
            infoText="상품 유형별 출시 비중과 최근 빠르게 증가한 실루엣을 확인하고, 시장에서 성장하고 있는 유형의 흐름을 남보다 먼저 잡아보세요."
          />
        </div>
        <p className="text-base font-semibold leading-6 text-icon-neutral">
          최근 주목받는 상품 유형과 연관 키워드를 탐색해보세요.
        </p>
      </div>

      <div
        className="grid justify-start gap-6 mt-8"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(430px, max-content))",
        }}
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
          blocks.map((block) => <NewTypeBox key={block.brand} block={block} />)}
      </div>
    </div>
  );
}

export default NewTypeAnalysis;
