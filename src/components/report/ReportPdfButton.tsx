import { useState } from "react";
import { Icon } from "@iconify/react";
import { useSaveReportPdf } from "@/lib/reports";
import type { CustomerReport } from "@/types/Report";

// 리포트 PDF 버튼(고객 분석 리포트 창) — 예시 리포트는 내려받지 못하게 막고, 호버하면 이유를 알려 준다.
// 호버는 감싼 영역에서 감지한다(비활성 버튼은 브라우저가 마우스 이벤트를 보내지 않는다).

const EXAMPLE_NOTICE = "예시 리포트는 PDF로 받을 수 없어요";

// 예시(비활성)는 호버해도 색이 바뀌지 않게 회색으로 고정한다
const STYLES = {
  primary: {
    on: "h-[36px] px-3.5 font-semibold bg-fill-primary text-tx-inverse hover:opacity-90",
    off: "h-[36px] px-3.5 font-semibold bg-[#E9EAEA] text-[#A1A3A5] cursor-not-allowed",
  },
  outline: {
    on: "h-[34px] px-3 font-medium border border-line-alt bg-white text-tx-neutral hover:bg-surface-base",
    off: "h-[34px] px-3 font-medium border border-line-alt bg-white text-[#A1A3A5] cursor-not-allowed",
  },
};

export default function ReportPdfButton({
  report,
  example,
  variant = "outline",
  label = "PDF로 저장",
}: {
  report: CustomerReport;
  /** 받은 리포트가 없어 예시를 보여 주는 중 — 내려받기 막음 */
  example: boolean;
  variant?: keyof typeof STYLES;
  label?: string;
}) {
  const { saving, save } = useSaveReportPdf();
  const [hover, setHover] = useState(false);
  const disabled = example || saving;
  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        // Trial·Basic 은 흐린 절반까지 그대로 PDF 에 담긴다
        onClick={() => !example && save(report, false)}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-lg text-[14px] ${example ? STYLES[variant].off : STYLES[variant].on} ${saving ? "opacity-60" : ""}`}
      >
        <Icon icon={saving ? "ph:spinner" : "ph:download-simple"} className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} aria-hidden />
        {saving ? "PDF 만드는 중…" : label}
      </button>
      {hover && example && (
        // 한 줄 말풍선 — 버튼 오른쪽 끝에 맞춰 창 밖으로 나가지 않게
        <div className="absolute right-0 top-full z-50 flex flex-col items-end pt-2">
          <div className="mr-6 h-0 w-0 border-x-[6px] border-b-[6px] border-x-transparent border-b-[rgba(0,0,0,0.75)]" />
          <div className="whitespace-nowrap rounded-lg bg-[rgba(0,0,0,0.75)] px-3 py-2 text-[13px] font-medium text-white shadow-lg">
            {EXAMPLE_NOTICE}
          </div>
        </div>
      )}
    </div>
  );
}
