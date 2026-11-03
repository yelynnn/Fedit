import type { ReactNode } from "react";
import type { CustomerPlatform, CustomerSummary } from "@/types/CustomerAnalysis";
import { PLATFORM_LABELS, fmtNum, fmtPct, pct } from "./customerFormat";

function KpiCard({ label, value, sub }: { label: string; value: ReactNode; sub: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-line-alt bg-surface-card p-5">
      <span className="text-[13px] font-medium text-tx-alt">{label}</span>
      <span className="text-[24px] font-bold leading-[1.35] text-tx-strong">{value}</span>
      <span className="text-[12px] leading-[1.5] text-tx-alt break-keep">{sub}</span>
    </div>
  );
}

export function CustomerKpiCards({ summary }: { summary: CustomerSummary }) {
  const platformText = (Object.entries(summary.platformCounts) as [CustomerPlatform, number][])
    .filter(([, n]) => n != null)
    .map(([p, n]) => `${PLATFORM_LABELS[p]} ${fmtNum(n)}건`)
    .join(" · ");
  const isMale = summary.male >= 50;
  const genderText = isMale ? `남성 ${fmtPct(summary.male)}` : `여성 ${fmtPct(100 - summary.male)}`;
  const profileSub = [
    summary.heightMedian != null ? `키 중앙값 ${summary.heightMedian}cm` : null,
    summary.weightMedian != null ? `몸무게 중앙값 ${summary.weightMedian}kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="수집 리뷰"
        value={`${fmtNum(summary.reviews)}건`}
        sub={
          <span title={`중복 제거 전 ${fmtNum(summary.rawReviews)}건`}>
            최근 2주 <span className="text-rising">▲{fmtNum(summary.recent14)}</span>
            {platformText && ` · ${platformText}`}
          </span>
        }
      />
      <KpiCard
        label="평균 별점"
        value={`${summary.avg.toFixed(2)}점`}
        sub={`불만 리뷰(3점 이하) ${fmtPct(summary.negRate)}`}
      />
      <KpiCard label="리뷰 고객 프로필" value={genderText} sub={profileSub} />
      <KpiCard
        label="교차구매 포착 고객"
        value={`${fmtNum(summary.crossAny)}명`}
        sub={`리뷰어 ${fmtNum(summary.reviewers)}명 중 ${fmtPct(summary.crossPct)}가 다른 브랜드에서도 구매`}
      />
    </div>
  );
}

export function RepurchaseCard({ summary }: { summary: CustomerSummary }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line-alt bg-surface-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[16px] font-bold text-tx-strong">재구매</h3>
        <p className="text-[13px] text-tx-assistive">리뷰를 남긴 구매만 보여서 실제보다 낮게 잡혀요.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "브랜드 재구매 고객",
            value: `${fmtNum(summary.repBrand)}명`,
            extra: `(${fmtPct(pct(summary.repBrand, summary.reviewers))})`,
          },
          { label: "동일 상품 재구매", value: `${fmtNum(summary.repSame)}명` },
          { label: "다른 색상 추가 구매", value: `${fmtNum(summary.repColor)}명` },
        ].map((m) => (
          <div key={m.label} className="flex flex-col gap-1 rounded-lg bg-surface-base px-4 py-3">
            <span className="text-[14px] font-medium text-tx-neutral">{m.label}</span>
            <span className="flex items-baseline gap-1.5">
              <b className="text-[24px] font-bold leading-tight text-tx-strong">{m.value}</b>
              {m.extra && <span className="text-[15px] font-medium text-tx-alt">{m.extra}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
