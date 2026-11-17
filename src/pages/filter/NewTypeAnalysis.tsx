import NewTypeBox from "@/components/type/NewTypeBox";
import { MockNewTypeData } from "@/data/mock/MockNewTypeData";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GetCategoryGraph } from "@/apis/AnalysisAPI";
import QuestionTooltip from "@/components/common/QuestionTooltip";
import { useFilterStore, useFilterStoreHydrated } from "@/stores/FilterStore";
import AnalysisDemoBanner from "@/components/common/AnalysisDemoBanner";
import { ANALYSIS_DEMO_BRANDS } from "@/lib/analysisDemo";
import OwnBrandInsights from "@/components/type/OwnBrandInsights";
import AnalysisSeasonSelect, {
  EMPTY_ANALYSIS_PERIOD,
  useAnalysisPeriodEnabled,
  useAnalysisPeriodParams,
  type AnalysisPeriod,
} from "@/components/filter/AnalysisSeasonSelect";

type TypeBlock = (typeof MockNewTypeData)[number];

// demo: 멤버십 전 고객의 예시 화면 — 필터 대신 예시 브랜드(ANALYSIS_DEMO_BRANDS)로 조회한다
function NewTypeAnalysis({ demo = false }: { demo?: boolean }) {
  const [blocks, setBlocks] = useState<TypeBlock[]>([]);
  const [loading, setLoading] = useState(false);
  // GetCategoryGraph는 브랜드 필터를 인자로 안 받고 useFilterStore.getState()로
  // 직접 읽는다. 이 effect는 원래 마운트 시 한 번만(deps=[]) 돌아서, 새로고침
  // 직후 localStorage 복원이 끝나기 전에 실행되면 brandList가 계속 빈
  // 값으로 조회돼버리고 이후에 복원이 끝나도 다시 불러오지 않았다 — 저장해둔
  // 브랜드 필터가 "유형 분석"에는 아예 반영 안 되는 상태로 계속 남는 버그.
  // brandList를 deps에 넣고 복원 완료까지 기다리도록 고친다.
  const { brandList } = useFilterStore();
  const isFilterHydrated = useFilterStoreHydrated();
  const [period, setPeriod] = useState<AnalysisPeriod>(EMPTY_ANALYSIS_PERIOD);
  // 연도·시즌 선택과 자사 맞춤 분석은 관리자에게만 먼저 공개
  const periodEnabled = useAnalysisPeriodEnabled();
  const periodParams = useAnalysisPeriodParams(period);

  // 카드 목록은 카드 폭(340~400px)이 정해져 있어 화면 오른쪽 끝까지 차지 않는다.
  // 연도·시즌 칸이 카드보다 더 오른쪽으로 나가지 않도록, 머리 줄 폭을 '카드가 실제로 끝나는 위치'에 맞춘다.
  const gridRef = useRef<HTMLDivElement>(null);
  const [headerWidth, setHeaderWidth] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const left = grid.getBoundingClientRect().left;
      const cards = Array.from(grid.children) as HTMLElement[];
      const right = cards.reduce((m, el) => Math.max(m, el.getBoundingClientRect().right - left), 0);
      setHeaderWidth(right > 0 ? right : undefined);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [blocks, loading]);

  useEffect(() => {
    if (!isFilterHydrated && !demo) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await GetCategoryGraph(
          demo ? ANALYSIS_DEMO_BRANDS : undefined,
          periodParams,
        );

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
  }, [brandList, isFilterHydrated, demo, periodParams]);

  return (
    <div className="px-14">
      {demo && (
        <div className="mb-6">
          <AnalysisDemoBanner brandNames={ANALYSIS_DEMO_BRANDS} />
        </div>
      )}
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
        {/* 연도·시즌은 설명 문구 줄의 오른쪽 끝 — 단, 아래 카드 목록의 오른쪽 끝을 넘지 않게 */}
        <div
          className="flex items-center justify-between gap-4"
          style={{ maxWidth: headerWidth }}
        >
          <p className="text-base font-semibold leading-6 text-icon-neutral">
            최근 주목받는 상품 유형과 연관 키워드를 탐색해보세요.
          </p>
          {periodEnabled && (
            <AnalysisSeasonSelect value={period} onChange={setPeriod} strong />
          )}
        </div>
      </div>

      {!demo && periodEnabled && <OwnBrandInsights period={periodParams} />}

      <div
        ref={gridRef}
        // 표 폭은 340~400px 사이에서만 움직이고 개수는 화면에 맞춘다 — 노트북에서 한 줄 3개, 큰 화면은 4개 이상.
        // 화면이 커져도 표가 끝없이 늘어나지 않게 최대 폭을 둔다.
        className="grid justify-start gap-6 mt-8"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 400px))",
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
