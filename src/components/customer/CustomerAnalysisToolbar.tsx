import { Icon } from "@iconify/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerBrand, CustomerPeriod } from "@/types/CustomerAnalysis";

const PERIOD_OPTIONS: { value: CustomerPeriod; label: string }[] = [
  { value: 3, label: "최근 3개월" },
  { value: 6, label: "최근 6개월" },
  { value: 12, label: "최근 12개월" },
  { value: 0, label: "전체 기간" },
];


const TRIGGER =
  "h-[34px] w-auto min-w-[120px] gap-2 rounded-lg border-line-alt bg-white text-[14px] font-medium text-tx-neutral shadow-none focus:ring-0";

export function CustomerAnalysisHeader({
  period,
  onPeriodChange,
  onRequestAnalysis,
  demo = false,
  onOpenGuide,
  onOpenReport,
}: {
  period: CustomerPeriod;
  onPeriodChange: (p: CustomerPeriod) => void;
  /** "리뷰 분석 신청" — 분석할 수 없는 브랜드의 리뷰 수집을 신청하는 창을 연다(예시 화면에선 Pro 안내) */
  onRequestAnalysis: () => void;
  /** 예시 화면(Pro 미만) — 신청 버튼에 Pro 표시 */
  demo?: boolean;
  /** "사용법" — 처음 화면(사용 안내)을 다시 연다 */
  onOpenGuide?: () => void;
  /** "맞춤 리포트" — 리포트를 창으로 열고 PDF 로 내려받는다 */
  onOpenReport?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold leading-9 text-tx-neutral">고객 분석</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onOpenReport && (
          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-lg bg-fill-primary px-3 text-[14px] font-semibold text-tx-inverse hover:opacity-90"
          >
            <Icon icon="ph:file-text" className="h-4 w-4" aria-hidden />
            맞춤 리포트
          </button>
        )}
        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-line-alt bg-white px-3 text-[14px] font-medium text-tx-neutral hover:bg-surface-base"
          >
            <Icon icon="ph:question" className="h-4 w-4" aria-hidden />
            사용법
          </button>
        )}
        <button
          type="button"
          onClick={onRequestAnalysis}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-line-alt bg-white px-3 text-[14px] font-medium text-tx-neutral hover:bg-surface-base"
        >
          <Icon icon={demo ? "ph:lock-simple" : "ph:plus-circle"} className="h-4 w-4" aria-hidden />
          리뷰 분석 신청
          {demo && <ProBadge />}
        </button>
        <Select value={String(period)} onValueChange={(v) => onPeriodChange(Number(v) as CustomerPeriod)}>
          <SelectTrigger className={TRIGGER} aria-label="기간">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-line-divider">
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export const ProBadge = () => (
  <span className="rounded-full bg-fill-primary px-1.5 py-px text-[11px] font-semibold leading-4 text-tx-inverse">
    Pro
  </span>
);

/** 분석 묶음 브랜드 칩 — 누른 칩이 기준 브랜드(교차 구매는 플랫폼 전체 브랜드 기준).
 *  예시 화면(demo)은 칩을 눌러 브랜드만 바꿔 볼 수 있고, 빼기(×)는 없으며 "+ 브랜드" 자리는 Pro 안내다. */
export function BrandChips({
  brands,
  selectedId,
  onSelect,
  onRemove,
  onAdd,
  demo = false,
}: {
  brands: CustomerBrand[];
  selectedId: string | null;
  onSelect: (brandId: string) => void;
  /** 칩 × — 마지막 브랜드도 뺄 수 있고, 다 빼면 처음 화면(브랜드 선택 안내)이 나온다 */
  onRemove: (brandId: string) => void;
  /** "+ 브랜드"(예시 화면에선 Pro 안내) */
  onAdd: () => void;
  demo?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {brands.map((b) => {
          const active = b.brandId === selectedId;
          const label = b.isOwn ? `${b.name} (자사)` : b.name;
          return (
            <span
              key={b.brandId}
              className={`inline-flex h-[34px] items-center rounded-full border text-[14px] font-medium whitespace-nowrap transition-colors ${
                active
                  ? "border-fill-primary bg-fill-primary text-tx-inverse"
                  : "border-line-alt bg-white text-tx-neutral hover:bg-surface-base"
              }`}
            >
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(b.brandId)}
                className={`h-full pl-3 ${demo ? "pr-3" : "pr-1"}`}
              >
                {label}
              </button>
              {!demo && (
              <button
                type="button"
                onClick={() => onRemove(b.brandId)}
                aria-label={`${b.name} 빼기`}
                className={`mr-1.5 rounded-full p-0.5 ${
                  active ? "text-tx-inverse/70 hover:text-tx-inverse" : "text-icon-alt hover:text-tx-neutral"
                }`}
              >
                <Icon icon="ph:x" className="w-3.5 h-3.5" />
              </button>
              )}
            </span>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-[34px] items-center gap-1 rounded-full border border-dashed border-line-neutral bg-white px-3 text-[14px] font-medium whitespace-nowrap text-tx-alt transition-colors hover:bg-surface-base hover:text-tx-neutral"
        >
          <Icon icon="ph:plus" className="w-3.5 h-3.5" />
          {demo ? "우리 브랜드" : "브랜드"}
          {demo && <ProBadge />}
        </button>
      </div>
    </div>
  );
}
