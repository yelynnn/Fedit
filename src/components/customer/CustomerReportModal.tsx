import { useCallback } from "react";
import Modal from "react-modal";
import { Icon } from "@iconify/react";
import {
  EXAMPLE_REPORT,
  REPORT_PLAN_NOTE,
  REPORT_TIER_LINES,
  REPORT_TIER_SHORT,
  isReportPreparing,
  useMyReports,
  useReportTier,
} from "@/lib/reports";
import { ReportDocument } from "@/components/report/ReportDocument";
import ReportPdfButton from "@/components/report/ReportPdfButton";
import { useUIStore } from "@/stores/UIStore";

// 고객 분석 탭에서 여는 "리포트" — 맞춤 리포트 문서(요금제별 흐림 포함)를 창으로 띄우고 PDF 로 바로 내려받는다.
// 받은 리포트가 없으면 예시 리포트를 보여 주고, 멤버십이면 "준비 중"(FEDIT 이 직접 만들어 올린다)으로 안내한다.

/** 지금 계정의 리포트 — 받은 게 없으면 예시 */
function useCurrentReport() {
  const own = useMyReports();
  const tier = useReportTier();
  const example = own.length === 0;
  return { report: own[0] ?? EXAMPLE_REPORT, example, tier, preparing: isReportPreparing(tier, example) };
}

const PreparingBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[#E4EDFC] px-2 py-0.5 text-[12px] font-semibold text-[#3566C4]">
    <Icon icon="ph:hourglass-medium" className="h-3.5 w-3.5" aria-hidden />
    준비 중
  </span>
);

export default function CustomerReportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { report, example, tier, preparing } = useCurrentReport();
  const locked = tier !== "pro" && tier !== "enterprise";
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const parentSelector = useCallback(() => document.getElementById("modal-root") ?? document.body, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      className="box-border flex max-h-[92vh] w-[920px] max-w-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_32px_0_rgba(0,0,0,0.16)] outline-none"
      shouldCloseOnOverlayClick
    >
      <div className="flex items-start justify-between gap-4 border-b border-line-alt px-6 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-2 type-title-xlarge text-tx-strong">
            {example ? "예시 리포트" : "브랜드 맞춤 리포트"}
            {preparing && <PreparingBadge />}
          </h2>
          <p className="text-[13px] leading-[1.6] break-keep text-tx-alt">
            {example && (
              <b className="font-semibold text-tx-neutral">
                {preparing ? "고객님 리포트는 준비 중이라 예시 리포트를 보여 드려요. " : "예시 리포트예요. "}
              </b>
            )}
            {REPORT_TIER_LINES[tier]}
          </p>
          {example && <p className="text-[12px] text-tx-assistive">{REPORT_PLAN_NOTE}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ReportPdfButton report={report} example={example} variant="primary" label="PDF 다운로드" />
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded p-1 hover:bg-gray-100">
            <Icon icon="ph:x" className="h-5 w-5 text-icon-neutral" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F3F3F1] px-4 py-6 sm:px-8">
        <ReportDocument
          report={report}
          // 예시 리포트는 요금제와 상관없이 전부 보여 준다(흐림은 내 리포트에만)
          locked={locked && !example}
          example={example}
          onUpgrade={() => {
            onClose();
            openSettingsModal("구독");
          }}
        />
      </div>
    </Modal>
  );
}

/** 고객 분석 화면 위쪽 줄 — 요금제별로 언제·어떻게 받는지 안내하고 리포트를 연다 */
export function CustomerReportStrip({ onOpen }: { onOpen: () => void }) {
  const { report, example, tier, preparing } = useCurrentReport();
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const openTrialModal = useUIStore((s) => s.openTrialModal);
  const cta =
    tier === "none"
      ? { label: "무료체험 시작하기", onClick: () => openTrialModal() }
      : tier === "pro" || tier === "enterprise"
        ? null
        : { label: "요금제 보기", onClick: () => openSettingsModal("구독") };
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#D6E2F7] bg-[#F3F7FE] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white">
          <Icon icon="ph:file-text" className="h-5 w-5 text-[#3566C4]" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-tx-strong">
            브랜드 맞춤 리포트
            {preparing ? (
              <PreparingBadge />
            ) : !example ? (
              <span className="text-[13px] font-normal text-tx-alt">{report.publishedAt} 발행</span>
            ) : null}
          </p>
          <p className="text-[13px] leading-[1.6] break-keep text-tx-alt">{REPORT_TIER_SHORT[tier]}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
        <button
          type="button"
          onClick={onOpen}
          className={
            example && cta
              ? "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-alt bg-white px-4 py-2.5 text-[14px] font-semibold text-tx-neutral hover:bg-surface-base"
              : "inline-flex items-center justify-center gap-1.5 rounded-lg bg-fill-primary px-4 py-2.5 text-[14px] font-semibold text-tx-inverse hover:opacity-90"
          }
        >
          <Icon icon="ph:eye" className="h-4 w-4" aria-hidden />
          {example ? "예시 리포트 보기" : "리포트 보기"}
        </button>
        {cta && (
          <button
            type="button"
            onClick={cta.onClick}
            className="inline-flex items-center justify-center rounded-lg bg-fill-primary px-4 py-2.5 text-[14px] font-semibold text-tx-inverse hover:opacity-90"
          >
            {cta.label}
          </button>
        )}
      </div>
    </div>
  );
}
