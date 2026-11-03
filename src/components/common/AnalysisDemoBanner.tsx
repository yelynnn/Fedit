import { Icon } from "@iconify/react";
import { useUIStore } from "@/stores/UIStore";

// 색상·유형 분석 예시 화면(멤버십 전 고객) 맨 위 안내 — 예시 브랜드의 실제 상품 데이터라는 것과
// Basic 요금제부터 우리 브랜드로 볼 수 있다는 것을 알리고 요금제로 안내한다.
export default function AnalysisDemoBanner({ brandNames }: { brandNames: string[] }) {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line-alt bg-surface-base px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold text-tx-neutral">
            <Icon icon="ph:eye" className="h-3.5 w-3.5" aria-hidden />
            예시 화면
          </span>
          <span className="text-[15px] font-semibold text-tx-strong">예시 분석을 보고 계세요</span>
        </div>
        <p className="text-[14px] leading-6 break-keep text-tx-alt">
          {brandNames.join(" · ")}의 실제 상품 데이터예요. 상품 데이터는 매주 갱신돼요.
          <br className="hidden sm:block" />
          <span className="text-tx-neutral"> Basic 요금제부터 우리 브랜드와 경쟁 브랜드를 직접 골라 같은 분석을 볼 수 있어요.</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => openSettingsModal("구독")}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-fill-primary px-4 py-2.5 text-[14px] font-semibold text-tx-inverse sm:self-center"
      >
        우리 브랜드로 분석하기
        <Icon icon="ph:arrow-right" className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
