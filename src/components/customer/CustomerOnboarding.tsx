import { Icon } from "@iconify/react";

// 분석할 브랜드가 하나도 없을 때 — 기획 활용법과 사용법, 브랜드 선택 버튼.
// 예시 화면(Pro 미만)에서도 처음에 이 안내를 먼저 보여 주고, 버튼으로 예시 분석을 연다.
const STEPS = [
  "분석할 브랜드를 골라요 — 우리 브랜드와 궁금한 브랜드를 함께 담아요.",
  "위쪽 칩에서 브랜드를 눌러요 — 그 브랜드 고객이 다른 브랜드에서 무엇을 샀는지도 함께 보여줘요.",
  "기간을 3·6·12개월로 바꿔 시즌별 변화를 봐요.",
  "찾는 브랜드가 없으면 '리뷰 분석 신청'을 눌러요 — 1~2일 내로 리뷰를 수집해 분석할 브랜드에 추가해 드려요.",
];

// 기획에서 어디에 쓰는지 — 화면의 각 분석과 연결
const USES = [
  {
    icon: "ph:user-focus",
    title: "타깃 고객과 사이즈 기준 잡기",
    desc: "실제로 산 고객의 성별·키·몸무게로 사이즈 스펙과 모델 핏 기준을 정해요.",
    from: "고객 프로필",
  },
  {
    icon: "ph:wrench",
    title: "다음 시즌 개선점 찾기",
    desc: "불만 키워드와 사이즈·색감 만족도로 핏 수정, 소재 교체, 색상 보정 포인트를 찾아요.",
    from: "리뷰 분석",
  },
  {
    icon: "ph:arrows-clockwise",
    title: "스테디셀러·컬러 확장 후보 고르기",
    desc: "같은 상품 재구매, 다른 색 추가 구매가 많은 상품으로 리오더와 컬러 추가를 정해요.",
    from: "재구매",
  },
];

// 교차 구매 활용 — 같은 고객이 다른 브랜드에서 산 기록으로 보는 것들
const CROSS_USES = [
  {
    icon: "ph:users",
    title: "우리 고객이 같이 많이 산 브랜드",
    desc: "같은 플랫폼에서 우리 고객이 같이 많이 산 브랜드로, 고객이 실제로 비교하며 사는 브랜드를 알 수 있어요.",
  },
  {
    icon: "ph:puzzle-piece",
    title: "카테고리 빈틈 찾기",
    desc: "상의는 우리에게서 사고 바지는 다른 브랜드에서 산다면, 그 카테고리가 확장 기회예요.",
  },
  {
    icon: "ph:binoculars",
    title: "벤치마킹할 상품 찾기",
    desc: "우리 고객이 다른 브랜드에서 많이 산 상품과 자주 나온 특징(와이드·데님 등)으로 다음 시즌 아이템을 정해요.",
  },
];

export function CustomerOnboarding({
  onSelectBrands,
  demo = false,
  startLabel,
}: {
  /** 버튼 — 브랜드 선택 창(예시 화면에선 예시 분석 열기, 사용법 다시 보기에선 분석 화면으로) */
  onSelectBrands: () => void;
  demo?: boolean;
  /** 버튼 글자를 바꿀 때(예: "고객 분석 시작하기") */
  startLabel?: string;
}) {
  return (
    <section className="flex flex-col gap-6 rounded-xl border border-line-alt bg-surface-card p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-semibold text-tx-strong">리뷰로 브랜드의 고객을 분석해요</h3>
        <p className="text-[14px] leading-[1.6] text-tx-alt">
          무신사·29CM·W컨셉 리뷰로 누가 사는지, 무엇에 만족하고 아쉬워하는지, 다른 어떤 브랜드를 같이
          사는지 보여줘요. 다음 시즌 기획과 리오더 판단의 근거로 써 보세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[14px] font-semibold text-tx-default">기획에 이렇게 써요</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {USES.map((u) => (
            <div key={u.title} className="flex gap-3 rounded-lg bg-fill-bg-strong p-4">
              <Icon icon={u.icon} className="mt-0.5 h-5 w-5 shrink-0 text-icon-neutral" aria-hidden />
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-semibold text-tx-default">{u.title}</p>
                <p className="text-[13px] leading-[1.5] text-tx-alt">{u.desc}</p>
                <p className="text-[12px] text-tx-assistive">{u.from}에서 확인</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-line-alt p-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-semibold text-tx-default">교차 구매로 같이 사는 브랜드와 기회 찾기</p>
            <p className="text-[13px] text-tx-alt">우리 고객이 다른 브랜드에서 산 기록으로 볼 수 있어요.</p>
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
            {CROSS_USES.map((u) => (
              <li key={u.title} className="flex gap-3">
                <Icon icon={u.icon} className="mt-0.5 h-5 w-5 shrink-0 text-icon-neutral" aria-hidden />
                <div className="flex flex-col gap-1">
                  <p className="text-[14px] font-semibold text-tx-default">{u.title}</p>
                  <p className="text-[13px] leading-[1.5] text-tx-alt">{u.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[14px] font-semibold text-tx-default">사용 방법</p>
        <ol className="flex flex-col gap-2.5">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fill-primary text-[12px] font-semibold text-tx-inverse">
                {i + 1}
              </span>
              <p className="text-[14px] leading-6 text-tx-neutral">{step}</p>
            </li>
          ))}
        </ol>
        <p className="text-[12px] leading-[1.6] text-tx-assistive">
          교차 구매는 같은 플랫폼(무신사·29CM·W컨셉)에 입점한 브랜드끼리만 추적할 수 있고, 리뷰가 있는 브랜드만
          분석할 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onSelectBrands}
          className="inline-flex h-[46px] w-full items-center justify-center gap-1.5 rounded-md bg-fill-primary type-title-medium text-tx-inverse hover:opacity-90 sm:w-fit sm:px-8"
        >
          <Icon icon={startLabel ? "ph:arrow-right" : demo ? "ph:eye" : "ph:plus"} className="h-4 w-4" aria-hidden />
          {startLabel ?? (demo ? "예시 분석 보기" : "분석할 브랜드 선택")}
        </button>
        {demo && (
          <p className="text-[13px] text-tx-alt">
            실제 브랜드의 리뷰로 만든 분석이에요. 브랜드를 직접 골라 분석하는 건 Pro에서 할 수 있어요.
          </p>
        )}
      </div>
    </section>
  );
}
