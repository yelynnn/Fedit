import { useMemo } from "react";
import { Icon } from "@iconify/react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { TrendSnapshotDetailDto } from "@/types/Main";

interface TrendIndexBoxMockProps {
  data: TrendSnapshotDetailDto | null;
  isLoading?: boolean;
}

// 값이 0이 아닌 이상 막대가 눈에 띄게 — 비교값이 훨씬 커서 비율이 작아져도
// 최소 이 높이(px)는 보장한다.
const MIN_BAR_H = 15;

type Direction = "up" | "down" | "flat";

const DIRECTION_STYLE: Record<
  Direction,
  {
    text: string;
    solidBg: string;
    subtleBg: string;
    chipBg: string;
    icon: string;
  }
> = {
  up: {
    text: "text-rising",
    solidBg: "bg-rising",
    subtleBg: "bg-rising-bg",
    chipBg: "bg-data-red-medium",
    icon: "ph:caret-up-fill",
  },
  down: {
    text: "text-falling",
    solidBg: "bg-falling",
    subtleBg: "bg-falling-bg",
    chipBg: "bg-data-blue-medium",
    icon: "ph:caret-down-fill",
  },
  flat: {
    text: "text-steady",
    solidBg: "bg-steady",
    subtleBg: "bg-steady-bg",
    chipBg: "bg-steady-bg",
    icon: "ph:minus-bold",
  },
};

const directionOf = (value: number | null | undefined): Direction => {
  if (value == null || value === 0) return "flat";
  return value > 0 ? "up" : "down";
};

const bandDirection = (band: string | null | undefined): Direction => {
  if (band === "상승" || band === "급상승") return "up";
  if (band === "하락" || band === "급락") return "down";
  return "flat";
};

// 통합 지수 밴드 5칸 — 액티브 구간만 컬러를 넣고 나머지는 중립 회색으로
// 둔다. 완만한 방향(하락·상승)은 Medium 톤 배경, 급격한 방향(급락·급상승)과
// 유지는 Default 톤 배경 — 라벨 글자색은 배경 톤과 무관하게 항상 Default를 쓴다.
const GAUGE_BAND_KEYS = ["급락", "하락", "유지", "상승", "급상승"] as const;

const GAUGE_BAND_ACTIVE_STYLE: Record<
  (typeof GAUGE_BAND_KEYS)[number],
  { bgClass: string; textClass: string }
> = {
  급락: { bgClass: "bg-falling", textClass: "text-falling" },
  하락: { bgClass: "bg-falling-medium", textClass: "text-falling" },
  유지: { bgClass: "bg-steady", textClass: "text-steady" },
  상승: { bgClass: "bg-rising-medium", textClass: "text-rising" },
  급상승: { bgClass: "bg-rising", textClass: "text-rising" },
};
const GAUGE_BAND_INACTIVE_BG = "bg-line-alt";
const GAUGE_BAND_INACTIVE_TEXT = "text-tx-assistive";

const BOX_CLASS_BASE =
  "flex w-full min-w-0 flex-col items-start gap-2 px-6 py-5";
const TOP_BOX_CLASS = `${BOX_CLASS_BASE} min-h-[244px]`;
const BOTTOM_BOX_CLASS = `${BOX_CLASS_BASE} min-h-[238px]`;

const INTEGRATED_BG_CLASS =
  "bg-[linear-gradient(179deg,var(--color-brand-subtle)_48.77%,var(--color-fill-bg-strong)_99.14%)]";
const PANEL_BG_CLASS = "bg-fill-bg-strong";

const fmtNum = (v: number | null | undefined, digits = 0): string =>
  v == null
    ? "-"
    : v.toLocaleString("ko-KR", { maximumFractionDigits: digits });

// 카드별 데이터 성숙도 뱃지 — measured(실측)/similar(예측)/market(시장 기준).
// brand_index는 "none"이면(스토어찜·검색량 둘 다 없음) 뱃지를 안 띄운다.
const BASIS_BADGE: Record<string, { label: string; className: string }> = {
  measured: { label: "실측", className: "bg-fill-pressed text-tx-alt" },
  similar: {
    label: "예측",
    className: "bg-source-predicted-subtle text-source-predicted-default",
  },
  market: {
    label: "시장 기준",
    className: "bg-source-market-subtle text-source-market-default",
  },
};

function BasisBadge({ basis }: { basis: string }) {
  const cfg = BASIS_BADGE[basis];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold leading-[1.33] ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function HeadlineChange({
  value,
  suffix = "%",
  digits = 1,
  showPrefix = true,
}: {
  value: number | null;
  suffix?: string;
  digits?: number;
  showPrefix?: boolean;
}) {
  if (value == null) return null;
  const dir = directionOf(value);
  const style = DIRECTION_STYLE[dir];
  // 화살표 아이콘 대신 부호로 증감을 표현한다 — 상승 +35%, 하락 -35%.
  const sign = dir === "up" ? "+" : dir === "down" ? "-" : "";
  return (
    <p className="flex items-center gap-0.5 text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-alt">
      {showPrefix && "이전 대비 "}
      <span className={style.text}>
        {sign}
        {fmtNum(Math.abs(value), digits)}
        {suffix}
      </span>
    </p>
  );
}

// 통합 지수 점수 옆 "이전보다 +35%" 칩 — 점(dot) + 문구 + 부호값을 한 알약
// 배경에 담는다. 배경·점 색은 방향(상승/하락/유지)에 따라 바뀐다.
function ScoreChangeChip({ value }: { value: number | null }) {
  if (value == null) return null;
  const dir = directionOf(value);
  const style = DIRECTION_STYLE[dir];
  const sign = dir === "up" ? "+" : dir === "down" ? "-" : "";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-2 py-1 text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-alt ${style.subtleBg}`}
    >
      <span
        className={`flex h-[7px] w-[7px] shrink-0 items-center justify-center rounded-full ${style.chipBg}`}
      >
        <span className={`h-1 w-1 rounded-full ${style.solidBg}`} />
      </span>
      <span>
        이전보다{" "}
        <span className={style.text}>
          {sign}
          {fmtNum(Math.abs(value), 1)}%
        </span>
      </span>
    </span>
  );
}

// "인지도 순위"/"화력 순위"처럼 슬라이더 위에 붙는 라벨 행. valueText가
// 있으면(이전값→현재값 데이터가 있을 때만) 오른쪽에 방향색으로 표시한다.
function RankLabelRow({
  label,
  prev,
  current,
  unit = "위",
  direction,
}: {
  label: string;
  prev?: number | null;
  current?: number | null;
  unit?: string;
  direction?: Direction;
}) {
  const hasValue = prev != null && current != null;
  const style = direction ? DIRECTION_STYLE[direction] : null;
  return (
    <div className="flex items-center justify-between w-full text-sm">
      <span className="text-xs font-semibold leading-[1.33] text-tx-assistive">
        {label}
      </span>
      {hasValue && (
        <span className={`font-semibold ${style?.text ?? "text-tx-strong"}`}>
          {fmtNum(prev)}
          {unit} → {fmtNum(current)}
          {unit}
        </span>
      )}
    </div>
  );
}

function PercentileSlider({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const clampedPct = Math.min(100, Math.max(0, pct));
  const position = 100 - clampedPct;
  const dir: Direction = position > 55 ? "up" : position < 45 ? "down" : "flat";

  const barPosition = Math.min(94, Math.max(6, position));

  const fillClass =
    dir === "flat" ? "bg-line-neutral" : DIRECTION_STYLE[dir].chipBg;
  return (
    <div className="w-full">
      {/* 트랙(회색 배경+채움색)만 rounded로 잘라내는 별도 래퍼 — 핸들(원)은
        이 relative 바깥에 둬서 트랙 높이(8px)보다 큰 12px 원이 위아래로
        잘리지 않게 한다. */}
      <div className="relative w-full h-2">
        <div className="absolute inset-0 overflow-hidden rounded bg-line-alt">
          <div
            className={`absolute inset-y-0 left-0 ${fillClass}`}
            style={{ width: `${barPosition}%` }}
          />
        </div>
        <span
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${DIRECTION_STYLE[dir].solidBg}`}
          style={{ left: `${barPosition}%` }}
        />
      </div>
      <div className="mt-[9px] flex w-full justify-between text-xs font-medium leading-[1.33] text-tx-assistive">
        <span>하위</span>
        <span>상위</span>
      </div>
    </div>
  );
}

function ChipStat({
  label,
  value,
  valueColorClass = "text-tx-default",
  badgeValue,
  badgeSuffix = "%",
  empty = value === "-",
}: {
  label: string;
  value: string;
  valueColorClass?: string;
  badgeValue?: number | null;
  badgeSuffix?: string;
  empty?: boolean;
}) {
  const badgeDir = badgeValue != null ? directionOf(badgeValue) : null;
  const badgeSign = badgeDir === "up" ? "+" : badgeDir === "down" ? "-" : "";
  return (
    <div className="flex flex-col gap-2 shrink-0">
      <span className="text-sm font-semibold leading-[1.43] tracking-[-0.07px] text-tx-alt">
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        <span
          className={
            empty
              ? "whitespace-nowrap text-xs font-medium leading-[1.33] text-tx-assistive"
              : `whitespace-nowrap text-base font-semibold leading-[1.5] tracking-[-0.08px] ${valueColorClass}`
          }
        >
          {value}
        </span>
        {badgeValue != null && badgeValue !== 0 && (
          <span
            className={`whitespace-nowrap text-sm font-medium leading-[1.43] tracking-[-0.07px] ${DIRECTION_STYLE[badgeDir!].text}`}
          >
            {badgeSign}
            {fmtNum(Math.abs(badgeValue), 1)}
            {badgeSuffix}
          </span>
        )}
      </span>
    </div>
  );
}

// gap_days(이전 관측치가 며칠 전 값인지)를 라벨로 바꾼다 — 1이면 "어제",
// 그 외에는 "N일 전". 값이 없으면(과거 데이터라 알 수 없으면) "이전"으로 둔다.
const pastDayLabel = (gapDays: number | null | undefined): string => {
  if (gapDays == null) return "이전";
  return gapDays === 1 ? "어제" : `${gapDays}일 전`;
};

function TodayVsYesterdayBars({
  prev,
  current,
  gapDays,
}: {
  prev: number | null;
  current: number | null;
  gapDays: number | null | undefined;
}) {
  if (prev == null || current == null) return null;
  const max = Math.max(prev, current, 1);
  // 막대 최대 높이는 숫자 라벨 자리를 남기려고 컨테이너(h-16=64px)보다
  // 낮은 44px로 잡는다(CategoryCompareBars와 동일한 방식) — 값이 작아 막대가
  // 짧아져도 숫자가 컨테이너 맨 위가 아니라 막대 바로 위 8px에 붙는다.
  const BAR_MAX_H = 44;
  const barHeight = (value: number) =>
    value > 0 ? `${Math.max(MIN_BAR_H, (value / max) * BAR_MAX_H)}px` : "0px";
  return (
    <div className="flex items-end gap-5 shrink-0">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex flex-col items-center justify-end w-12 h-16 gap-1.5">
          <span className="text-xs font-medium leading-[1.33] text-tx-neutral">
            {fmtNum(prev)}
          </span>
          <div
            className="w-full rounded-t bg-line-alt"
            style={{ height: barHeight(prev) }}
          />
        </div>
        <span className="text-xs font-medium text-center text-tx-neutral">
          {pastDayLabel(gapDays)}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex flex-col items-center justify-end w-12 h-16 gap-1.5">
          <span className="text-xs font-medium leading-[1.33] text-tx-neutral">
            {fmtNum(current)}
          </span>
          <div
            className="w-full rounded-t bg-fill-primary"
            style={{ height: barHeight(current) }}
          />
        </div>
        <span className="text-xs font-medium text-center text-tx-neutral">
          오늘
        </span>
      </div>
    </div>
  );
}

let trendLineGradientId = 0;
function MiniTrendLine({
  prev,
  current,
  gapDays,
}: {
  prev: number | null;
  current: number | null;
  gapDays: number | null | undefined;
}) {
  const gradientId = useMemo(
    () => `trend-line-fill-${trendLineGradientId++}`,
    [],
  );
  if (prev == null || current == null) return null;
  const dir = directionOf(current - prev);
  const strokeColor =
    dir === "up" ? "#FF4242" : dir === "down" ? "#0066FF" : "#6F7173";
  const steps = 6;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const eased = t * t * t;
    return { v: prev + (current - prev) * eased };
  });

  return (
    <div className="flex w-[140px] max-w-full min-w-0 shrink flex-col items-start gap-1">
      <span className="text-xs text-tx-alt">
        {gapDays == null ? "추이" : `최근 ${gapDays}일 추이`}
      </span>
      <div className="w-full h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 6, right: 3, bottom: 0, left: 3 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={(dotProps: { cx?: number; cy?: number; index?: number }) =>
                dotProps.index === steps ? (
                  <circle
                    key="end-dot"
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    r={3}
                    fill={strokeColor}
                  />
                ) : (
                  <g key={`dot-${dotProps.index}`} />
                )
              }
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between w-full text-xs text-tx-alt">
        <span>{pastDayLabel(gapDays)}</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

// "오늘"만 있고 비교할 이전값(baseline)이 없을 때 쓰는 단일 막대.
function SingleTodayBar({
  value,
  label = "오늘",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="flex items-end gap-5 shrink-0">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-medium leading-[1.33] text-tx-neutral">
          {fmtNum(value)}
        </span>
        <div className="flex items-end w-12 h-16">
          <div className="w-full h-full rounded-t bg-fill-primary" />
        </div>
        <span className="text-xs text-tx-alt">{label}</span>
      </div>
    </div>
  );
}

// "이 상품" vs "카테고리 평균" 비교 막대 — 카테고리 평균이 더 클 수 있다
// (인기 상품이 섞여 있어서 정상). 시간 흐름 비교가 아니라 값 비교라
// TodayVsYesterdayBars와 별도로 둔다.
function CategoryCompareBars({
  thisValue,
  categoryValue,
  categoryLabel = "카테고리 평균",
}: {
  thisValue: number;
  categoryValue: number;
  categoryLabel?: string;
}) {
  const max = Math.max(thisValue, categoryValue, 1);
  // 막대가 짧아도 값 라벨이 막대 바로 위에 붙도록, 값을 h-16 컨테이너
  // 안에 넣고 아래 정렬한다. 막대 최대 높이는 값 라벨 자리를 남기려고
  // 컨테이너(64px)보다 낮은 44px로 잡는다.
  const BAR_MAX_H = 44;
  const bar = (value: number, label: string, fillClass: string) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-col items-center justify-end w-12 h-16 gap-1">
        <span className="text-xs font-medium leading-[1.33] text-tx-neutral">
          {fmtNum(value)}
        </span>
        <div
          className={`w-full rounded-t ${fillClass}`}
          style={{
            // 값이 있으면 아무리 작아도 최소 MIN_BAR_H는 보이게 한다.
            height: `${value > 0 ? Math.max(MIN_BAR_H, (value / max) * BAR_MAX_H) : 0}px`,
          }}
        />
      </div>
      <span className="text-xs text-tx-alt">{label}</span>
    </div>
  );
  return (
    <div className="flex items-end gap-5 shrink-0">
      {bar(categoryValue, categoryLabel, "bg-line-alt")}
      {bar(thisValue, "해당 상품", "bg-fill-primary")}
    </div>
  );
}

// 비교 막대 오른쪽에 작게 붙는 "관심도 위치" 퍼센타일 바.
function InterestPositionBar({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  return (
    <div className="flex min-w-0 max-w-[176px] flex-1 flex-col gap-1.5 pb-[17px]">
      <span className="text-xs font-semibold leading-[1.33] text-tx-assistive">
        관심도 위치
      </span>
      <PercentileSlider pct={pct} />
    </div>
  );
}

type ItemInterestMarketData = NonNullable<
  TrendSnapshotDetailDto["item_interest_market"]
>;

// 아이템 관심도 basis="market" — 3단 폴백.
// [1] like_count·category_avg_like 둘 다 있으면 비교 막대 2개 + 위치 바.
// [2] category_avg_like만 있으면 막대 1개.
// [3] 둘 다 없으면 막대 없이 위치 바만.
// like_count===0일 때의 "종합 인사이트" 대체는 아래 "좋아요&찜 수" 칩
// 자리에서 처리한다(이 컴포넌트가 아니라 그 칩을 대체하는 것).
function ItemInterestMarket({ data }: { data: ItemInterestMarketData }) {
  const {
    interest_pct,
    like_count,
    category_avg_like,
    category_momentum_pct,
    category_momentum,
  } = data;

  return (
    <div className="flex flex-col w-full gap-3">
      {/* 비교 막대는 왼쪽, 관심도 위치 바는 그 오른쪽에 작게 나란히 둔다.
        like_count/category_avg_like가 둘 다 없는 케이스에선 막대 없이
        관심도 위치 바만 폭을 채운다. */}
      <div className="flex items-end w-full gap-8">
        {like_count != null && category_avg_like != null ? (
          <CategoryCompareBars
            thisValue={like_count}
            categoryValue={category_avg_like}
          />
        ) : (
          category_avg_like != null && (
            <SingleTodayBar value={category_avg_like} label="카테고리 평균" />
          )
        )}
        <InterestPositionBar pct={interest_pct} />
      </div>
      {category_momentum != null && (
        <p
          className={`flex items-center gap-0.5 text-sm font-medium leading-[1.43] tracking-[-0.07px] ${DIRECTION_STYLE[category_momentum].text}`}
        >
          카테고리 이번주 {fmtNum(Math.abs(category_momentum_pct ?? 0), 1)}%
          <Icon
            icon={DIRECTION_STYLE[category_momentum].icon}
            className="h-3.5 w-3.5"
          />
        </p>
      )}
    </div>
  );
}

function buildInsight(
  data: TrendSnapshotDetailDto,
): { prefix: string; highlight: string; suffix: string } | null {
  const { integrated_index, brand_index, product_index, purchase_power_index } =
    data;
  const band = integrated_index.band;
  const bandDir = bandDirection(band);

  // 변화량이 들어온 지표를 우선순위대로 모은다 — 찜·랭킹에 한정하지 않고
  // 값이 있는 건 뭐든 문구에 쓴다. topic(은/는)·subject(이/가) 조사는
  // 받침에 따라 다르므로 지표마다 직접 들고 있는다. unit "step"은 "N계단",
  // "pct"는 "N%".
  type MetricChange = {
    noun: string;
    topic: string;
    subject: string;
    unit: "pct" | "step";
    value: number;
  };
  const metrics: MetricChange[] = [];
  const pushPct = (
    noun: string,
    topic: string,
    subject: string,
    v: number | null,
  ) => {
    if (v != null)
      metrics.push({ noun, topic, subject, unit: "pct", value: v });
  };
  // 찜 변화율이 안 오면 이전값→현재값으로 직접 계산해서라도 쓴다.
  const likePct =
    product_index.like_change_pct ??
    (product_index.like_prev != null &&
    product_index.like_prev > 0 &&
    product_index.like_count != null
      ? ((product_index.like_count - product_index.like_prev) /
          product_index.like_prev) *
        100
      : null);
  pushPct("찜", "은", "이", likePct);
  if (purchase_power_index.rank_change != null)
    metrics.push({
      noun: "랭킹",
      topic: "은",
      subject: "이",
      unit: "step",
      value: purchase_power_index.rank_change,
    });
  pushPct("리뷰 수", "는", "가", purchase_power_index.review_change_pct);
  pushPct("리오더", "는", "가", purchase_power_index.reorder_change_pct);

  if (metrics.length > 0) {
    const label = (m: MetricChange): string => {
      const d = directionOf(m.value);
      if (m.unit === "step") {
        return d === "flat"
          ? `${m.noun} 변동 없음`
          : `${m.noun} ${fmtNum(Math.abs(m.value))}계단 ${
              d === "up" ? "상승" : "하락"
            }`;
      }
      return `${m.noun} ${m.value >= 0 ? "+" : ""}${fmtNum(m.value, 1)}%`;
    };
    // 문구가 너무 길어지지 않게 최대 3개까지만 나열한다.
    const joined = metrics.slice(0, 3).map(label).join("·");

    // 상승/하락 밴드: 변화 지표를 그대로 나열하고 밴드 진입 문구로 마무리.
    if (bandDir !== "flat") {
      return {
        prefix: "하루 만에 ",
        highlight: joined,
        suffix: `으로 ${band} 구간에 진입했어요.`,
      };
    }

    // 유지 밴드: 가장 크게 오른 지표와 가장 크게 내린 지표를 대비시켜
    // "무엇이 늘었는데 무엇이 줄어서 유지인지"를 설명한다.
    const byMagnitude = (a: MetricChange, b: MetricChange) =>
      Math.abs(b.value) - Math.abs(a.value);
    const up = metrics
      .filter((m) => directionOf(m.value) === "up")
      .sort(byMagnitude)[0];
    const down = metrics
      .filter((m) => directionOf(m.value) === "down")
      .sort(byMagnitude)[0];

    const openClause = (m: MetricChange): string =>
      m.unit === "step"
        ? `${m.noun}${m.subject} ${fmtNum(Math.abs(m.value))}계단 올랐지만`
        : `${m.noun}${m.topic} ${fmtNum(Math.abs(m.value), 1)}% 늘었지만`;
    const closeClause = (m: MetricChange): string =>
      m.unit === "step"
        ? `${m.noun}${m.subject} ${fmtNum(Math.abs(m.value))}계단 내려`
        : `${m.noun}${m.topic} ${fmtNum(Math.abs(m.value), 1)}% 줄어`;

    if (up && down) {
      return {
        prefix: `${openClause(up)} `,
        highlight: closeClause(down),
        suffix: ` ${band} 구간이에요.`,
      };
    }

    // 대비할 상승/하락 쌍이 없으면(둘 다 같은 방향이거나 한쪽만 있음) 지표만 제시.
    return {
      prefix: "",
      highlight: joined,
      suffix: ` 수준으로 ${band} 구간이에요.`,
    };
  }

  // 유지 밴드인데 쓸 변화 지표가 하나도 없으면, 억지로 찜 수를 들이대지 말고
  // "이번 주는 변동이 크지 않다"는 사실 그대로 전한다.
  if (bandDir === "flat") {
    return {
      prefix: `이번 주는 지표 변화가 크지 않아 ${band} 구간이에요.`,
      highlight: "",
      suffix: "",
    };
  }

  if (product_index.like_count != null) {
    return {
      prefix: "",
      highlight: `좋아요·찜 ${fmtNum(product_index.like_count)}건`,
      suffix: ` 기준 ${integrated_index.band} 구간이에요.`,
    };
  }
  if (product_index.interest_label != null) {
    return {
      prefix: "",
      highlight: `아이템 관심도 ${product_index.interest_label}`,
      suffix: ` 수준으로 ${integrated_index.band} 구간이에요.`,
    };
  }
  if (brand_index.awareness_label != null) {
    return {
      prefix: "",
      highlight: `브랜드 인지도 ${brand_index.awareness_label}`,
      suffix: ` 수준으로 ${integrated_index.band} 구간이에요.`,
    };
  }

  return null;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid h-[224px] w-full place-items-center rounded-[20px] border border-line-alt text-sm text-tx-alt">
      {text}
    </div>
  );
}

type PrepStepStatus = "done" | "active" | "pending";

// 통합 지수 계산에 필요한 데이터가 아직 쌓이는 중일 때 보여주는 진행 체크리스트.
// 단계별 완료 여부를 알려주는 필드가 백엔드에 없어 항상 같은 목업 문구로 보여준다.
const PREP_STEPS: {
  status: PrepStepStatus;
  title: string;
  subtitle?: string;
}[] = [
  { status: "done", title: "상품 등록 완료" },
  {
    status: "done",
    title: "AI 스타일 분석 완료",
  },
  {
    status: "active",
    title: "비슷한 상품 찾는 중",
    subtitle: "비교할 유사 상품 데이터를 모으고 있어요",
  },
  {
    status: "pending",
    title: "추정 지수 오픈",
    subtitle: "유사 상품이 충분해지면 먼저 추정으로 열려요",
  },
];

function IndexPreparingState() {
  return (
    <>
      <div className="flex flex-wrap items-center w-full gap-3">
        <span className="text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
          지수 준비 중이에요
        </span>
        <div className="flex-1 border-t border-dashed min-w-6 border-line-alt" />
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-falling-bg px-3 py-1.5 text-sm font-semibold leading-[1.43] tracking-[-0.07px] text-tx-strong">
          <span className="flex items-center justify-center w-2 h-2 rounded-full shrink-0 bg-falling">
            <span className="w-1 h-1 bg-white rounded-full" />
          </span>
          분석 진행 중
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {PREP_STEPS.map((step) => (
          <div key={step.title} className="flex items-start gap-2.5">
            {step.status === "done" ? (
              <Icon
                icon="ph:check-circle-fill"
                className="mt-0.5 h-4 w-4 shrink-0 text-status-success"
              />
            ) : step.status === "active" ? (
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-falling" />
              </span>
            ) : (
              <Icon
                icon="ph:circle"
                className="mt-0.5 h-4 w-4 shrink-0 text-icon-alt"
              />
            )}
            <div className="flex flex-col gap-0.5">
              <span
                className={`text-sm font-semibold leading-[1.43] tracking-[-0.07px] ${
                  step.status === "pending"
                    ? "text-tx-assistive"
                    : "text-tx-strong"
                }`}
              >
                {step.title}
              </span>
              {step.subtitle && (
                <span className="text-xs font-medium leading-[1.33] text-tx-alt">
                  {step.subtitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

type PurchasePowerMarket = NonNullable<
  TrendSnapshotDetailDto["purchase_power_market"]
>;

// 상품 자체의 판매 데이터가 아직 없을 때, 카테고리 시장 흐름으로 대신
// 보여주는 상태. 블록은 있어도 하위 필드가 null이면 그 행만 숨긴다.
function PurchaseMarketFallback({
  data,
}: {
  data: PurchasePowerMarket | null;
}) {
  return (
    <>
      <p className="mt-2 w-full text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-alt">
        해당 상품의 판매 데이터가 모이기 전까지,
        <br />
        속한 카테고리의 시장 흐름을 보여드려요.
      </p>
      <div className="grid w-full grid-cols-2 gap-x-3 gap-y-3 mt-auto">
        {data?.category_interest_change_pct != null && (
          <ChipStat
            label="카테고리 관심도"
            value="이번주"
            badgeValue={data.category_interest_change_pct}
          />
        )}
        {/* 값이 없거나 0이면 칩은 유지하되 "데이터 수집 중"으로 표시한다. */}
        <ChipStat
          label="평균 리뷰 수"
          value={
            data?.avg_review_weekly
              ? `${fmtNum(data.avg_review_weekly)}건`
              : "데이터 수집 중"
          }
          empty={!data?.avg_review_weekly}
        />
        {data?.similar_weekly_sales && (
          <ChipStat
            label="유사 상품 판매량"
            value={`${fmtNum(data.similar_weekly_sales.lo)}~${fmtNum(data.similar_weekly_sales.hi)}건`}
          />
        )}
        {/* 상품 자체 판매 데이터는 market 케이스에선 있을 수가 없어 항상 표시 */}
        <ChipStat label="상품 판매량" value="데이터 수집 중" empty />
      </div>
    </>
  );
}

function TrendIndexBoxMock({ data, isLoading }: TrendIndexBoxMockProps) {
  if (isLoading) return <EmptyState text="불러오는 중..." />;
  if (!data) return <EmptyState text="트렌드 지수 데이터가 없어요." />;

  const { integrated_index, brand_index, product_index, purchase_power_index } =
    data;
  // score/band는 basis와 무관하게 항상 값이 온다는 게 스펙이라, 준비중
  // 체크리스트는 그 계약이 깨졌을 때만 뜨는 방어적 fallback으로 남겨둔다.
  const isPreparing = integrated_index.score == null;
  const isPurchaseFallback = purchase_power_index.basis === "market";
  // basis="similar"인데 그걸 뒷받침할 유사상품 근거가 실제로 하나도 없으면
  // "예측" 뱃지만 붙고 근거 문구는 안 뜨는 어색한 상태가 된다 — 그 경우엔
  // 그냥 실측처럼 취급한다(뱃지·헤드라인 분기 전부 이 값 기준으로 통일).
  const itemInterestBasis =
    product_index.basis === "similar" &&
    data.similar_estimate?.similar_count == null
      ? "measured"
      : product_index.basis;
  // similar 카드에서 baseline(어제값)이 없어 추이 막대를 못 그릴 때는,
  // 유사상품 평균(cohort_avg) vs 해당 상품(like_count) 비교 막대로 대체한다.
  const showSimilarCompareBars =
    itemInterestBasis === "similar" &&
    product_index.like_prev == null &&
    product_index.like_count != null &&
    data.similar_estimate?.like?.cohort_avg != null;
  // "상위권" 같은 관심도 등급 값이 아예 없으면 "-" 짝대기 대신 안내 문구를 띄운다.
  const hasInterestLabel =
    product_index.interest_label != null &&
    product_index.interest_label !== "-";
  const purchaseHasSimilarEvidence =
    data.similar_estimate?.weekly_review != null ||
    data.similar_estimate?.reorder_avg != null ||
    data.similar_estimate?.weekly_sales != null;
  const purchaseBasis =
    purchase_power_index.basis === "similar" && !purchaseHasSimilarEvidence
      ? "measured"
      : purchase_power_index.basis;
  const storeLikesChangePct =
    brand_index.store_likes != null && brand_index.store_likes_prev
      ? ((brand_index.store_likes - brand_index.store_likes_prev) /
          brand_index.store_likes_prev) *
        100
      : null;
  const overallDir = bandDirection(integrated_index.band);
  const overallStyle = DIRECTION_STYLE[overallDir];
  const apiInsight = integrated_index.insight;
  const computedInsight = buildInsight(data);
  // API insight가 "상승이에요."/"유지 구간이에요." 처럼 숫자 없는 짧은
  // 문구면, 그 뒤에 이어붙이는 대신 프론트가 계산한 한 문장(찜%·계단
  // 수치 포함)으로 통째로 대체한다 — 두 문장이 나란히 붙는 부자연스러움을
  // 피하기 위해서다. API가 이미 수치까지 담은 완성 문장을 주면 그걸 그대로 쓴다.
  const apiInsightHasDetail = apiInsight != null && /%|계단/.test(apiInsight);
  const useComputedInsight = !apiInsightHasDetail && computedInsight != null;
  // 통합 지수를 유사상품 흐름으로 추정한 경우엔, 흰 인사이트 박스를
  // "직접 판매 데이터가 없어 유사상품 N개의 흐름으로 추정했어요. 이 유형은
  // 최근 OO세예요." 문구로 대체한다. N/추세 단어는 상품 데이터에서 채운다.
  const similarBasisCount = data.similar_estimate?.similar_count ?? null;
  const showSimilarBasisInsight =
    integrated_index.basis === "similar" && similarBasisCount != null;
  const similarBasisTrendWord =
    overallDir === "up"
      ? "상승세"
      : overallDir === "down"
        ? "하락세"
        : "보합세";

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-line-alt">
      <div className="grid grid-cols-2 divide-x divide-y divide-line-alt">
        {/* 통합 지수 */}
        <div className={`${TOP_BOX_CLASS} ${INTEGRATED_BG_CLASS}`}>
          <div className="flex items-center w-full gap-1">
            <span className="text-base font-semibold leading-[1.5] tracking-[-0.08px] text-tx-neutral">
              통합 지수
            </span>
            <Icon icon="ph:info" className="w-4 h-4 text-icon-alt" />
          </div>

          {isPreparing ? (
            <IndexPreparingState />
          ) : (
            <>
              <div className="flex items-center w-full gap-5">
                <span className="text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong shrink-0">
                  {fmtNum(integrated_index.score, 1)}점
                </span>
                {/* 회색줄은 고정 폭이 아니라 남는 공간을 채운다 — 사이드바가
                  열리고 닫히면서 이 박스 너비가 바뀌어도 줄 길이가 그에 맞춰
                  늘고 줄고, 칩만 오른쪽에 고정 크기로 붙는다. */}
                <div className="flex items-center flex-1 min-w-0 gap-2">
                  <span className="h-px min-w-[24px] flex-1 bg-line-alt" />
                  {integrated_index.score_change_pct != null ? (
                    <ScoreChangeChip value={integrated_index.score_change_pct} />
                  ) : (
                    // 이전 대비 변화율이 없으면(비교할 이전 값이 없는 경우) 예전처럼
                    // 밴드 칩("평균 대비 급락" 등)을 대신 보여준다 — 회색줄은
                    // 그대로 두고 칩 안 내용만 바뀐다.
                    <span
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-2 py-1 text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-alt ${overallStyle.subtleBg}`}
                    >
                      <span
                        className={`flex h-[7px] w-[7px] shrink-0 items-center justify-center rounded-full ${overallStyle.chipBg}`}
                      >
                        <span
                          className={`h-1 w-1 rounded-full ${overallStyle.solidBg}`}
                        />
                      </span>
                      <span>
                        평균 대비{" "}
                        <span className={`font-semibold ${overallStyle.text}`}>
                          {integrated_index.band}
                        </span>
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {purchase_power_index.reorder != null && (
                <p className="w-full text-xs font-semibold leading-[1.33] text-tx-assistive">
                  재입고 {fmtNum(purchase_power_index.reorder)}회
                </p>
              )}

              {(showSimilarBasisInsight || apiInsight || computedInsight) && (
                <div className="flex items-center w-full px-3 py-3 my-2 border rounded-md min-h-10 border-line-alt bg-fill-bg">
                  <p className="text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-neutral">
                    {showSimilarBasisInsight ? (
                      <>
                        직접 판매 데이터가 없어 유사상품{" "}
                        <span
                          className={`rounded px-1 font-semibold ${overallStyle.subtleBg}`}
                        >
                          {fmtNum(similarBasisCount)}개
                        </span>
                        의 흐름으로 추정했어요. 이 유형은 최근{" "}
                        <span
                          className={`rounded px-1 font-semibold ${overallStyle.subtleBg}`}
                        >
                          {similarBasisTrendWord}
                        </span>
                        예요.
                      </>
                    ) : useComputedInsight ? (
                      <>
                        {computedInsight!.prefix}
                        {computedInsight!.highlight && (
                          <span
                            className={`rounded px-1 font-semibold ${overallStyle.subtleBg}`}
                          >
                            {computedInsight!.highlight}
                          </span>
                        )}
                        {computedInsight!.suffix}
                      </>
                    ) : (
                      apiInsight
                    )}
                  </p>
                </div>
              )}

              <div className="flex flex-col justify-end flex-1 w-full min-h-0 gap-1">
                {/* 현재 밴드를 가리키는 화살표 — 칸 안이 아니라 색 막대 위에 뜬다 */}
                <div className="flex w-full">
                  {GAUGE_BAND_KEYS.map((band) => (
                    <div key={band} className="flex justify-center flex-1">
                      {band === integrated_index.band && (
                        <Icon
                          icon="ph:caret-down-fill"
                          className="w-5 h-5 text-icon-default"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {/* 색 막대 — 액티브 구간만 컬러, 나머지는 중립 회색 */}
                <div className="flex w-full gap-[1px]">
                  {GAUGE_BAND_KEYS.map((band, idx) => {
                    const roundedClass =
                      idx === 0
                        ? "rounded-l-md"
                        : idx === GAUGE_BAND_KEYS.length - 1
                          ? "rounded-r-md"
                          : "";
                    const isActive = band === integrated_index.band;
                    const bgClass = isActive
                      ? GAUGE_BAND_ACTIVE_STYLE[band].bgClass
                      : GAUGE_BAND_INACTIVE_BG;
                    return (
                      <div
                        key={band}
                        className={`h-[22px] flex-1 ${roundedClass} ${bgClass}`}
                      />
                    );
                  })}
                </div>
                {/* 밴드 이름 — 막대 "안"이 아니라 막대 아래 별도 줄. 라벨
                  글자색은 배경 톤(Default/Medium)과 무관하게 항상 Default. */}
                <div className="flex w-full">
                  {GAUGE_BAND_KEYS.map((band) => {
                    const isActive = band === integrated_index.band;
                    const textClass = isActive
                      ? GAUGE_BAND_ACTIVE_STYLE[band].textClass
                      : GAUGE_BAND_INACTIVE_TEXT;
                    return (
                      <span
                        key={band}
                        className={`flex-1 text-center text-xs leading-[1.33] ${isActive ? "font-semibold" : "font-medium"} ${textClass}`}
                      >
                        {band}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 브랜드 인지도 — 브랜드 단위 실측이라 measured/similar/market
          3케이스와 무관하게 항상 같은 UI. 스토어찜·검색량 둘 다 없을 때만
          basis="none"이라 그때만 빈 상태로 바뀐다. */}
        <div className={`${TOP_BOX_CLASS} ${PANEL_BG_CLASS}`}>
          <div className="flex items-center w-full gap-2">
            <span className="text-base font-semibold text-tx-neutral">
              브랜드 인지도
            </span>
            <BasisBadge basis={brand_index.basis} />
          </div>
          <div className="flex flex-wrap items-baseline w-full gap-2">
            <p className="text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
              {brand_index.awareness_label ?? "-"}
            </p>
            {/* 스토어 찜 수가 없을 때만 브랜드 검색 데이터 기준임을 안내한다 */}
            {brand_index.store_likes == null && (
              <p className="text-xs font-semibold leading-[1.33] text-falling">
                브랜드 검색 데이터 기준
              </p>
            )}
          </div>

          <div className="flex flex-col w-full gap-2 mt-auto">
            <RankLabelRow label="인지도 순위" />
            <PercentileSlider pct={brand_index.awareness_pct} />
            <div className="grid w-full grid-cols-2 gap-3 mt-[34px]">
              <ChipStat
                label="네이버 검색량"
                value={fmtNum(brand_index.search_volume)}
              />
              <ChipStat
                label="스토어 찜 수"
                value={
                  brand_index.store_likes != null
                    ? fmtNum(brand_index.store_likes)
                    : "입점 플랫폼 없음"
                }
                empty={brand_index.store_likes == null}
                badgeValue={storeLikesChangePct}
              />
            </div>
          </div>
        </div>

        <div className={`${BOTTOM_BOX_CLASS} ${PANEL_BG_CLASS} @container`}>
          <div className="flex items-center w-full gap-2">
            <span className="text-base font-semibold text-tx-neutral">
              아이템 관심도
            </span>
            <BasisBadge basis={itemInterestBasis} />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            {hasInterestLabel ? (
              <div className="flex flex-wrap items-baseline w-full gap-2">
                <p className="text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
                  {product_index.interest_label}
                </p>
                {itemInterestBasis === "similar" ? (
                  data.similar_estimate?.similar_count != null && (
                    <p className="text-xs font-semibold leading-[1.33] text-falling">
                      유사상품 {fmtNum(data.similar_estimate.similar_count)}개
                      평균 분포 기준
                    </p>
                  )
                ) : (
                  <HeadlineChange value={product_index.like_change_pct} />
                )}
              </div>
            ) : (
              <p className="mt-2 w-full text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-alt">
                아직 해당 상품의 반응 데이터가 모이기 전이라, <br />
                유사 스타일의 시장 흐름을 먼저 보여드려요.{" "}
              </p>
            )}
          </div>
          <div className="flex flex-col justify-end flex-1 w-full gap-4">
            {/* like_prev/like_count는 basis 상관없이 항상 "이 상품" 값이다
              (similar_estimate.like.now/baseline과 동일한 값) — 막대는
              basis별로 갈라 만들지 않고 한 곳에서만 그린다. */}
            {product_index.basis !== "market" &&
              (product_index.like_prev != null &&
              product_index.like_count != null ? (
                <div className="flex w-full items-end gap-10 overflow-hidden @max-[380px]:justify-center">
                  <TodayVsYesterdayBars
                    prev={product_index.like_prev}
                    current={product_index.like_count}
                    gapDays={
                      data.similar_estimate?.like?.baseline_lag_days ??
                      data.signal_meta.gap_days
                    }
                  />
                  <MiniTrendLine
                    prev={product_index.like_prev}
                    current={product_index.like_count}
                    gapDays={
                      data.similar_estimate?.like?.baseline_lag_days ??
                      data.signal_meta.gap_days
                    }
                  />
                </div>
              ) : showSimilarCompareBars ? (
                <div className="flex items-end w-full gap-8">
                  <CategoryCompareBars
                    thisValue={product_index.like_count as number}
                    categoryValue={
                      data.similar_estimate!.like!.cohort_avg as number
                    }
                    categoryLabel="유사상품 평균"
                  />
                  <InterestPositionBar pct={product_index.interest_pct} />
                </div>
              ) : (
                product_index.like_count != null && (
                  <SingleTodayBar
                    value={product_index.like_count}
                    label="해당 상품"
                  />
                )
              ))}
            {/* market은 카테고리 비교 막대/위치 바가 먼저 오고, "이 상품"
              찜 수 칩은 그 아래로 — 근거 없이 칩부터 보이지 않게 한다. */}
            {product_index.basis === "market" && data.item_interest_market && (
              <ItemInterestMarket data={data.item_interest_market} />
            )}
            {/* 좋아요&찜 수가 0이면 "0"이라는 숫자 자체가 근거 없이 허전해
              보이니, 그 자리를 종합 인사이트 문구로 대체한다(값이 있으면
              기존처럼 칩으로). */}
            {product_index.like_count === 0 && data.item_interest_market ? (
              <div className="flex flex-col w-full gap-1">
                <span className="text-sm font-semibold leading-[1.43] tracking-[-0.07px] text-tx-strong">
                  종합 인사이트
                </span>
                <p className="text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-neutral">
                  {data.item_interest_market.insight}
                </p>
              </div>
            ) : (
              <ChipStat
                label="좋아요&찜 수"
                value={fmtNum(product_index.like_count)}
                badgeValue={product_index.like_change_pct}
              />
            )}
            {/* 유사상품들의 평균 찜 수 — 비교 막대에 이미 들어간 경우
              (showSimilarCompareBars)엔 중복되니 칩은 생략한다. */}
            {itemInterestBasis === "similar" &&
              !showSimilarCompareBars &&
              data.similar_estimate?.like?.cohort_avg != null && (
                <ChipStat
                  label="유사상품 평균 찜 수"
                  value={`약 ${fmtNum(data.similar_estimate.like.cohort_avg)}개`}
                />
              )}
          </div>
        </div>

        {/* 구매 화력도 */}
        <div className={`${BOTTOM_BOX_CLASS} ${PANEL_BG_CLASS}`}>
          <div className="flex items-center w-full gap-1.5">
            <span className="text-base font-semibold text-tx-neutral">
              구매 화력도
            </span>

            <BasisBadge basis={purchaseBasis} />
          </div>

          {isPurchaseFallback ? (
            <PurchaseMarketFallback data={data.purchase_power_market} />
          ) : (
            <>
              <div className="flex flex-wrap items-baseline w-full gap-2">
                <p className="text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
                  {purchase_power_index.purchase_label ?? "-"}
                </p>
                <HeadlineChange
                  value={purchase_power_index.rank_change}
                  suffix="단계"
                  digits={0}
                />
              </div>
              <div className="flex flex-col justify-end flex-1 w-full gap-5 mt-5">
                <div className="flex flex-col w-full gap-2">
                  <RankLabelRow
                    label="화력 순위"
                    prev={purchase_power_index.rank_prev}
                    current={purchase_power_index.rank}
                    direction={directionOf(purchase_power_index.rank_change)}
                  />
                  <PercentileSlider pct={purchase_power_index.purchase_pct} />
                </div>
                <div className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
                  <ChipStat
                    label="리뷰 수"
                    value={
                      purchase_power_index.review_count
                        ? fmtNum(purchase_power_index.review_count)
                        : "-"
                    }
                    badgeValue={purchase_power_index.review_change_pct}
                  />
                  <ChipStat
                    label="리오더"
                    value={
                      purchase_power_index.reorder != null
                        ? `${purchase_power_index.reorder}차`
                        : "-"
                    }
                    badgeValue={purchase_power_index.reorder_change_pct}
                  />
                  {purchaseBasis === "similar" && data.similar_estimate && (
                    <>
                      {data.similar_estimate.weekly_review && (
                        <ChipStat
                          label="유사상품 평균 리뷰 수"
                          value={`${fmtNum(data.similar_estimate.weekly_review.hi)}개`}
                        />
                      )}
                      {data.similar_estimate.reorder_avg != null && (
                        <ChipStat
                          label="유사상품 평균 리오더"
                          value={`${fmtNum(data.similar_estimate.reorder_avg, 1)}회`}
                        />
                      )}
                      {data.similar_estimate.weekly_sales && (
                        <ChipStat
                          label="유사상품 판매량"
                          value={`${fmtNum(data.similar_estimate.weekly_sales.lo)}~${fmtNum(data.similar_estimate.weekly_sales.hi)}건`}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrendIndexBoxMock;
