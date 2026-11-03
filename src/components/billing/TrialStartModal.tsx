import { useState } from "react";
import { Icon } from "@iconify/react";
import { useUIStore } from "@/stores/UIStore";
import { getTrialEndsAt, useSubscriptionStore } from "@/stores/SubscriptionStore";
import { useFilterStore } from "@/stores/FilterStore";
import { PostStartTrial } from "@/apis/BillingAPI";

// 무료체험 시작 창 — 체험 전 고객이 잠긴 분석의 "예시 화면 보기" 등을 누르면 요금제 화면 대신 바로 띄운다.
// 시작하면 원래 하려던 일(예: 예시 화면 열기)을 이어서 하고, 관심 브랜드 창을 연다(닫으면 지금 탭으로 돌아온다).
const FEATURES = [
  "실시간 랭킹·상품 분석 전체",
  "경쟁사 모니터링 3개 브랜드",
  "크롬 확장 30개 상품 분석 · 엑셀 다운로드 1회",
  "체험 마지막 날 브랜드 맞춤 리포트 1회",
  "색상·유형·고객 분석 예시 화면",
];

export default function TrialStartModal() {
  const trialModal = useUIStore((s) => s.trialModal);
  const closeTrialModal = useUIStore((s) => s.closeTrialModal);
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const openInterestBrandModal = useUIStore((s) => s.openInterestBrandModal);
  const setAfterOnboardingTab = useUIStore((s) => s.setAfterOnboardingTab);
  const showNotice = useUIStore((s) => s.showNotice);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);
  const [starting, setStarting] = useState(false);

  if (!trialModal) return null;

  const start = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await PostStartTrial();
      await fetchSubscription();
      // 시작됐다는 안내(화면 아래) — 끝나는 날을 알면 같이
      const ends = getTrialEndsAt(useSubscriptionStore.getState().subscription);
      const d = ends ? new Date(ends) : null;
      showNotice(
        d && !Number.isNaN(d.getTime())
          ? `5일 무료체험이 시작됐어요. ${d.getMonth() + 1}월 ${d.getDate()}일까지 이용할 수 있어요.`
          : "5일 무료체험이 시작됐어요.",
      );
      const after = trialModal.onStarted;
      closeTrialModal();
      after?.();
      setAfterOnboardingTab(useFilterStore.getState().selectedTab);
      openInterestBrandModal();
    } catch (error: any) {
      alert(error?.message || "무료체험 시작에 실패했습니다.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={closeTrialModal} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="무료체험 시작"
        className="relative z-10 flex w-full max-w-[420px] flex-col gap-5 rounded-xl bg-white p-6 shadow-[0_12px_32px_0_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="w-fit rounded-full bg-[#EAF2FE] px-2 py-0.5 text-[12px] font-semibold text-[#1A75FF]">5일 무료</span>
            <h2 className="text-[20px] font-bold text-tx-strong">무료체험을 시작해 보세요</h2>
            <p className="text-[14px] break-keep text-tx-alt">시작하면 바로 아래 기능을 쓸 수 있어요.</p>
          </div>
          <button
            type="button"
            onClick={closeTrialModal}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-tx-alt hover:bg-surface-base"
          >
            <Icon icon="ph:x" className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex flex-col gap-2 rounded-lg bg-surface-base px-4 py-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[14px] text-tx-neutral">
              <Icon icon="ph:check-bold" className="mt-1 h-4 w-4 shrink-0 text-[#1A75FF]" aria-hidden />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={start}
            disabled={starting}
            className="flex h-[46px] w-full items-center justify-center rounded-md bg-fill-primary type-title-medium text-tx-inverse hover:opacity-90 disabled:opacity-60"
          >
            {starting ? "시작하는 중…" : "5일 무료체험 시작하기"}
          </button>
          <button
            type="button"
            onClick={() => {
              closeTrialModal();
              openSettingsModal("구독");
            }}
            className="flex h-[40px] w-full items-center justify-center text-[14px] text-tx-alt hover:text-tx-neutral"
          >
            요금제 비교하기
          </button>
        </div>
      </div>
    </div>
  );
}
