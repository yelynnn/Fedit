import { useEffect, useState } from "react";
import { useOwnBrandStore } from "@/stores/OwnBrandStore";
import { useUIStore } from "@/stores/UIStore";
import { useUserStore } from "@/stores/UserStore";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from "@/stores/SubscriptionStore";
import { GetOwnBrandInsights, type OwnBrandInsights as Insights } from "@/apis/OwnBrandAPI";

// 유형 분석 상단의 '자사 맞춤 분석' (2026-11-17). 데이터는 GET /category/own-insights.
// 설정 > 관심 브랜드 설정에서 자사 브랜드를 지정한 경우에만 보여 준다.
//   - 키워드: 키워드 분석의 플랫폼별 최신 뜨는 키워드 중 옷 종류가 든 것(최대 30개) 가운데 자사 상품에 있는 비율
//   - 판매가: 큰 분류별 자사 판매가 중앙값과 시장 전체 중 그보다 싼 상품 비율(백분위). 연도·시즌 조건을 따른다.

type Period = { year?: string; season?: string };

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

// 카드: padding 20 · 세로 정렬 · 항목 간격 16 · 모서리 12 · 테두리 #E4E4E4 · 바탕 #FFF (디자인 값)
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start shrink-0 gap-4 p-5 bg-white border rounded-[12px] border-[#E4E4E4]">
      <h3 className="text-[16px] font-semibold leading-[150%] tracking-[-0.08px] text-[#6F7173]">{title}</h3>
      {children}
    </div>
  );
}

function KeywordCoverageCard({ data }: { data: NonNullable<Insights["keyword"]> }) {
  const pct = data.total > 0 ? Math.round((data.covered / data.total) * 100) : 0;
  const missing = data.total - data.covered;
  return (
    <Card title="요즘 뜨는 키워드 중 우리가 취급하는 비율">
      {/* 카드 항목 간격(16)은 Card 가 주고, 묶음 안쪽만 좁게 */}
      <div className="flex flex-col w-full gap-2">
        <p className="text-[28px] font-semibold leading-[136%] tracking-[-0.616px] text-[#0B0E0F]">{pct}%</p>
        <div className="w-full h-2 overflow-hidden rounded-full bg-line-alt">
          <div className="h-full rounded-full bg-[#9DBBF5]" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[12px] font-normal leading-[133%] text-[#A1A3A5]">
          뜨는 키워드 {data.total}개 중 {data.covered}개 취급 중 · {missing}개는 아직 없음
        </p>
      </div>
      {data.missingKeywords.length > 0 && (
      <div className="flex flex-col w-full gap-2">
        <p className="text-[12px] font-medium leading-[133%] text-[#6F7173]">아직 취급 안 하는 키워드</p>
        <div className="flex flex-wrap gap-1.5">
          {data.missingKeywords.map((k) => (
            <span
              key={k}
              className="flex items-center justify-center gap-1 px-2 py-1 rounded-[4px] bg-[#F0ECFE] text-[12px] font-semibold leading-[133%] text-[#6541F2]"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
      )}
    </Card>
  );
}

function PricePositionCard({ prices }: { prices: Insights["prices"] }) {
  return (
    <Card title="종류별 우리 판매가가 시장 어디쯤">
      {prices.length === 0 && (
        <p className="text-[12px] font-medium leading-[133%] text-[#A1A3A5]">이 기간에 비교할 우리 상품이 없어요.</p>
      )}
      <div className="flex flex-col w-full gap-3.5">
        {prices.map((p) => (
          <div key={p.type} className="flex items-center gap-4">
            <span className="w-12 text-[12px] font-medium leading-[133%] text-[#6F7173] shrink-0">{p.type}</span>
            <div className="relative flex-1 h-2 rounded-full bg-line-alt">
              <div className="absolute inset-y-0 left-0 rounded-full bg-[#9DBBF5]" style={{ width: `${p.percentile}%` }} />
            </div>
            <span className="w-16 text-[12px] font-medium leading-[133%] text-right text-[#3D3F41] shrink-0">{won(p.price)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** 자사 브랜드를 지정했으면 맞춤 분석 두 개, 아니면 지정 안내 한 줄. period: 유형 분석의 연도·시즌 */
export default function OwnBrandInsights({ period }: { period: Period }) {
  const { ownBrand, loaded, load } = useOwnBrandStore();
  // 자사 브랜드는 Basic·Pro(관심 브랜드 안에서)·Enterprise·관리자만 지정할 수 있다 — 그 밖에는 안내도 띄우지 않는다
  const subscription = useSubscriptionStore((s) => s.subscription);
  const isAdmin = useUserStore((s) => s.admin);
  const plan = toBillingPlan(getEffectivePlan(subscription));
  const canUseOwnBrand = isAdmin || plan === "basic" || plan === "pro" || plan === "enterprise";
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const periodKey = `${period.year ?? ""}|${period.season ?? ""}`;
  useEffect(() => {
    if (!ownBrand) {
      setData(null);
      return;
    }
    let ignore = false;
    GetOwnBrandInsights(period)
      .then((res) => !ignore && setData(res))
      .catch(() => !ignore && setData(null));
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownBrand, periodKey]);

  if (!loaded || !canUseOwnBrand) return null;

  if (!ownBrand) {
    return (
      // 내용 길이만큼만 — 큰 화면에서 줄이 끝까지 늘어나지 않게
      <div className="inline-flex items-center gap-6 py-2 pl-4 pr-2 mt-6 rounded-lg bg-[#EAF2FE] max-w-full">
        <p className="text-sm font-medium text-tx-neutral [word-break:keep-all]">
          자사 브랜드를 지정하면 유형별로 우리 상품과 시장을 비교해 볼 수 있어요.
        </p>
        <button
          type="button"
          onClick={() => openSettingsModal("관심브랜드")}
          className="h-8 px-3 text-[13px] font-semibold text-white rounded-md shrink-0 bg-fill-primary"
        >
          자사 브랜드 지정하기
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-semibold text-tx-neutral">{ownBrand} 맞춤 분석</span>
      </div>
      {!data ? (
        <div className="h-40 rounded-[12px] bg-surface-base animate-pulse" />
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 520px))" }}>
          {data.keyword && <KeywordCoverageCard data={data.keyword} />}
          <PricePositionCard prices={data.prices} />
        </div>
      )}
    </div>
  );
}
