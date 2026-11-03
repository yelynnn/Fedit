import { Icon } from "@iconify/react";
import { ProBadge } from "@/components/customer/CustomerAnalysisToolbar";

// 고객 분석 예시 화면(트라이얼·Basic) — 서버가 정한 예시 묶음의 실제 리뷰 분석을 그대로 보여 주고,
// 위·아래에서 "우리 브랜드로 보면 어떨까"를 묻고 Pro로 안내한다.

const LiveDot = () => (
  <span className="relative flex h-2 w-2" aria-hidden>
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-data-green opacity-60" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-data-green" />
  </span>
);

export function CustomerDemoBanner({
  brandNames,
  onUpgrade,
}: {
  brandNames: string[];
  onUpgrade: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line-alt bg-surface-base px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold text-tx-neutral">
            <LiveDot />
            실시간 업데이트
          </span>
          <span className="text-[15px] font-semibold text-tx-strong">예시 분석을 보고 계세요</span>
        </div>
        <p className="text-[14px] leading-6 break-keep text-tx-alt">
          {brandNames.join(" · ")}의 실제 리뷰 고객 데이터예요. 리뷰는 수집되는 대로 매일 반영돼요.
          <br className="hidden sm:block" />
          <span className="text-tx-neutral"> Pro에서는 우리 브랜드와 경쟁 브랜드를 직접 골라 같은 분석을 볼 수 있어요.</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-fill-primary px-4 py-2.5 text-[14px] font-semibold text-tx-inverse sm:self-center"
      >
        우리 브랜드로 분석하기
        <Icon icon="ph:arrow-right" className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

const QUESTIONS: { icon: string; text: string }[] = [
  { icon: "ph:user-circle", text: "우리 고객은 키·체형이 어떻고, 어떤 불만을 가장 많이 남길까요?" },
  { icon: "ph:arrows-left-right", text: "우리 고객이 같이 사는 브랜드는 어디고, 거기서 무엇을 샀을까요?" },
  { icon: "ph:arrow-counter-clockwise", text: "다시 사러 오는 고객은 몇 %이고, 어떤 상품으로 돌아올까요?" },
];

export function CustomerDemoCta({ baseName, onUpgrade }: { baseName: string; onUpgrade: () => void }) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line-alt bg-white px-6 py-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[18px] font-semibold text-tx-strong">우리 브랜드 고객은 어떨까요?</h3>
          <ProBadge />
        </div>
        <p className="text-[14px] break-keep text-tx-alt">
          방금 본 {baseName} 분석을 우리 브랜드와 경쟁 브랜드로 똑같이 볼 수 있어요.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {QUESTIONS.map((q) => (
          <li key={q.text} className="flex items-start gap-2.5 rounded-lg bg-surface-base px-4 py-3">
            <Icon icon={q.icon} className="mt-0.5 h-5 w-5 shrink-0 text-tx-neutral" aria-hidden />
            <span className="text-[14px] leading-6 break-keep text-tx-neutral">{q.text}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] break-keep text-tx-alt">
          Pro는 브랜드 30개까지 고를 수 있고, 아직 분석하지 않은 브랜드는 리뷰 분석을 신청할 수 있어요.
        </span>
        <button
          type="button"
          onClick={onUpgrade}
          className="inline-flex items-center gap-1.5 rounded-lg bg-fill-primary px-4 py-2.5 text-[14px] font-semibold text-tx-inverse"
        >
          Pro로 시작하기
          <Icon icon="ph:arrow-right" className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
