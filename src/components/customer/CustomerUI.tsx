import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import defaultImg from "@/assets/logo/defaultImg.svg";

// 고객 분석 화면 공통 조각 — 카드·배지·세그먼트 버튼

export function Card({
  title,
  right,
  children,
  className = "",
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-xl border border-line-alt bg-surface-card p-5 ${className}`}>
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          {title && <h3 className="text-[15px] font-semibold leading-[1.5] text-tx-default">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function NegTag() {
  return (
    <span className="inline-flex shrink-0 items-center rounded px-1.5 py-[1px] text-[11px] font-semibold leading-[1.4] bg-rising-bg text-rising">
      불만
    </span>
  );
}

/** 여러 값 중 하나를 고르는 버튼 묶음(성별·카테고리·정렬 등) */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex max-w-full items-center rounded-lg bg-surface-base p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`whitespace-nowrap rounded-md font-medium transition-colors ${
              size === "sm" ? "h-7 px-2 text-[12px]" : "h-8 px-3 text-[13px]"
            } ${
              active
                ? "bg-white text-tx-strong shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-tx-alt hover:text-tx-neutral"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function LoadingBox({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[14px] text-tx-alt">
      <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[14px] text-tx-alt">
      {message}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-[34px] rounded-lg border border-line-alt px-3 text-[14px] font-medium text-tx-neutral hover:bg-surface-base"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function EmptyText({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-[13px] text-tx-assistive">{children}</p>;
}

/** 상품 썸네일 — 주소가 없거나 깨지면 상품 박스(ProductBox)와 같은 기본 이미지를 썸네일 크기로 보여준다 */
export function ProductThumb({ src, className = "w-12 h-12" }: { src?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <img src={defaultImg} alt="" aria-hidden className={`object-cover rounded-lg shrink-0 ${className}`} />
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`object-cover rounded-lg shrink-0 bg-surface-base ${className}`}
    />
  );
}
