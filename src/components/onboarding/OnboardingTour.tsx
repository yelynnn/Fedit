import { useLayoutEffect, useState, type CSSProperties } from "react";
import { useUIStore } from "@/stores/UIStore";
import { useFilterStore } from "@/stores/FilterStore";
import sparkleIcon from "@/assets/etc/sparkleicon.svg";

type Placement = "bottom" | "right";

type Step = {
  anchor: string;
  fallbackAnchor?: string;
  placement: Placement;
  title: string;
  description: string;
  // true=사이드바 펼침, false=접음, 지정 안하면 사용자가 평소 쓰던 상태 그대로
  sidebarOverride?: boolean;
  // 스포트라이트 세로 길이를 줄이고 싶을 때 아래쪽에서 뺄 픽셀 값
  heightTrim?: number;
};

const STEP_1_NOT_SELECTED: Step = {
  anchor: "brand-banner",
  fallbackAnchor: "brand-chip",
  placement: "bottom",
  title: "분석할 브랜드 범위예요",
  description:
    "지금은 무신사 기본 데이터예요. 관심 브랜드 10개를 선택하면 이 화면이 내 브랜드 기준으로 바뀌어요.",
};

const STEP_1_SELECTED: Step = {
  anchor: "brand-chip",
  placement: "bottom",
  title: "분석할 브랜드 범위예요",
  description:
    "선택한 10개 브랜드를 기준으로 모든 랭킹·분석이 채워져요. 브랜드는 월 1회 변경할 수 있어요.",
};

const STEP_1_FREE_SIGNUP: Step = {
  anchor: "brand-chip",
  placement: "bottom",
  title: "분석할 브랜드 범위예요",
  description:
    "무료 플랜에서는 무신사 기본 데이터만 제공돼요. 관심 브랜드를 선택하면 이 화면이 내 브랜드 기준으로 바뀌어요.",
};

const REST_STEPS: Step[] = [
  {
    anchor: "app-sidebar",
    placement: "right",
    title: "5가지 렌즈로 시장을 읽어요",
    description:
      "실시간 랭킹은 지금 잘 팔리는 순서, 상품·색상·유형 분석은 무엇이 어떻게 팔리는지 보여줘요.",
    sidebarOverride: false,
  },
  {
    anchor: "filter-panel",
    placement: "right",
    title: "원하는 조건만 골라 봐요",
    description:
      "연도·시즌부터 성별·색상·무드까지 겹쳐서 필요한 상품만 추릴 수 있어요.",
    sidebarOverride: true,
  },
  {
    anchor: "first-product-card",
    placement: "right",
    title: "카드 한 장에 데이터가 담겨요",
    description:
      "브랜드·가격과 함께 누적판매로 실제 성과를, 무신사·29 배지로 판매 채널을 알 수 있어요.",
    heightTrim: 16,
  },
  {
    anchor: "my-board-button",
    placement: "bottom",
    title: "참고할 상품은 보드에 모아둬요",
    description: "기획에 쓸 상품을 내 보드에 저장하고 언제든 다시 꺼내 보세요.",
  },
];

const TOOLTIP_WIDTH = 300;
const TOOLTIP_HEIGHT_ESTIMATE = 220;
const GAP = 12;
const SPOTLIGHT_PADDING = 6;

export default function OnboardingTour() {
  const isOpen = useUIStore((s) => s.isOnboardingTourOpen);
  const source = useUIStore((s) => s.onboardingTourSource);
  const closeOnboardingTour = useUIStore((s) => s.closeOnboardingTour);
  const setSidebarCollapseOverride = useUIStore(
    (s) => s.setSidebarCollapseOverride,
  );
  const brandList = useFilterStore((s) => s.brandList);

  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const step1 =
    source === "signup"
      ? STEP_1_FREE_SIGNUP
      : brandList.length > 0
        ? STEP_1_SELECTED
        : STEP_1_NOT_SELECTED;
  const steps: Step[] = [step1, ...REST_STEPS];
  const current = steps[step];

  useLayoutEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setShowCompletion(false);
  }, [isOpen]);

  // 투어 진행에 맞춰 사이드바를 강제로 펼치거나 접고, 투어가 끝나면 원래 상태로 돌려놓음
  useLayoutEffect(() => {
    if (!isOpen) {
      setSidebarCollapseOverride(null);
      return;
    }
    setSidebarCollapseOverride(current?.sidebarOverride ?? null);
    return () => setSidebarCollapseOverride(null);
  }, [isOpen, current?.sidebarOverride, setSidebarCollapseOverride]);

  useLayoutEffect(() => {
    if (!isOpen || !current || showCompletion) return;
    let cancelled = false;
    let settleAttempts = 0;
    let notFoundAttempts = 0;

    const tryMeasure = () => {
      if (cancelled) return;
      const primaryEl = document.querySelector(`[data-tour="${current.anchor}"]`);
      const el =
        primaryEl ??
        (current.fallbackAnchor
          ? document.querySelector(`[data-tour="${current.fallbackAnchor}"]`)
          : null);

      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "instant" as ScrollBehavior });
        setRect(el.getBoundingClientRect());
      }

      if (!primaryEl) {
        // 주 대상(예: 브랜드 배너)이 아직 안 떴으면 로딩이 늦는 것뿐일 수 있으니
        // 폴백을 잠깐 보여주는 동안에도 계속 주 대상을 찾아본다 (최대 약 12초)
        notFoundAttempts += 1;
        if (notFoundAttempts < 60) {
          setTimeout(tryMeasure, el ? 200 : 150);
        } else if (!el) {
          setRect(null);
        }
        return;
      }

      // 사이드바 펼침/접힘 등 CSS 트랜지션이 끝날 때까지 잠깐 동안 재측정해서
      // 스포트라이트 크기가 최종 상태에 맞춰지도록 함
      settleAttempts += 1;
      if (settleAttempts < 8) {
        setTimeout(tryMeasure, 80);
      }
    };

    setRect(null);
    tryMeasure();
    window.addEventListener("resize", tryMeasure);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", tryMeasure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, current?.anchor, showCompletion]);

  if (!isOpen) return null;

  if (showCompletion) {
    return (
      <>
        <div className="fixed inset-0 z-[9997] bg-[rgba(11,14,15,0.55)]" />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="flex w-[420px] flex-col items-center gap-6 rounded-2xl bg-white p-6 shadow-[0_12px_32px_0_rgba(0,0,0,0.18)]">
            <img src={sparkleIcon} alt="" className="h-11 w-11" />
            <div className="flex flex-col items-center gap-2">
              <h3 className="type-title-xlarge text-tx-strong">
                이제 준비가 끝났어요!
              </h3>
              <p className="type-body-small break-keep text-center text-tx-neutral">
                사용법이 헷갈리면 왼쪽 아래 가이드에서
                <br />
                투어를 다시 볼 수 있어요.
              </p>
            </div>
            <button
              type="button"
              onClick={closeOnboardingTour}
              className="flex h-[46px] w-full items-center justify-center gap-1 rounded-md bg-fill-primary type-title-medium text-tx-inverse"
            >
              FEDIT 시작하기
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!current || !rect) return null;

  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) setShowCompletion(true);
    else setStep((s) => s + 1);
  };
  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const spotlightStyle: CSSProperties = {
    position: "fixed",
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2 - (current.heightTrim ?? 0),
    borderRadius: 16,
    boxShadow: "0 0 0 4px #fff, 0 0 0 9999px rgba(11,14,15,0.55)",
    pointerEvents: "none",
    zIndex: 9998,
    transition: "top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease",
  };

  let tooltipTop = 0;
  let tooltipLeft = 0;
  let arrowStyle: CSSProperties;

  if (current.placement === "bottom") {
    tooltipTop = rect.bottom + SPOTLIGHT_PADDING + GAP;
    tooltipLeft = Math.min(
      Math.max(rect.left, 16),
      viewportW - TOOLTIP_WIDTH - 16,
    );
    const arrowLeft = Math.min(
      Math.max(rect.left + rect.width / 2 - tooltipLeft, 20),
      TOOLTIP_WIDTH - 20,
    );
    arrowStyle = { top: -6, left: arrowLeft - 6 };
  } else {
    tooltipLeft = rect.right + SPOTLIGHT_PADDING + GAP;
    tooltipTop = Math.min(
      Math.max(rect.top + rect.height / 2 - 90, 16),
      viewportH - TOOLTIP_HEIGHT_ESTIMATE - 16,
    );
    const arrowTop = Math.min(
      Math.max(rect.top + rect.height / 2 - tooltipTop, 20),
      TOOLTIP_HEIGHT_ESTIMATE - 20,
    );
    arrowStyle = { left: -6, top: arrowTop - 6 };
  }

  return (
    <>
      <div className="fixed inset-0 z-[9997]" />
      <div style={spotlightStyle} />
      <div
        className="fixed z-[9999] flex w-[300px] flex-col items-start gap-4 rounded-2xl bg-white p-4 shadow-[0_12px_32px_0_rgba(0,0,0,0.18)]"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div
          className="absolute h-3 w-3 rotate-45 bg-white"
          style={arrowStyle}
        />

        <span className="type-title-small text-tx-assistive">
          STEP {step + 1}/{steps.length}
        </span>

        <div className="flex flex-col gap-2">
          <h3 className="type-title-large break-keep text-data-blue">
            {current.title}
          </h3>
          <p className="type-body-small break-keep text-tx-neutral">
            {current.description}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className={
                i === step
                  ? "h-1.5 w-6 rounded-full bg-[#0B0E0F]"
                  : "h-1.5 w-1.5 rounded-full bg-[#E4E4E4]"
              }
            />
          ))}
        </div>

        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={closeOnboardingTour}
            className="flex h-7 items-center gap-1 rounded-pill px-2 type-body-small text-tx-default"
          >
            건너뛰기
          </button>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="type-body-small text-tx-assistive"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex h-[34px] w-[50px] items-center justify-center gap-1.5 rounded-md bg-fill-primary type-body-small text-tx-inverse"
            >
              {isLast ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
