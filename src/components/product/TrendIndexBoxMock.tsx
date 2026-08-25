import { useMemo } from "react";
import { Icon } from "@iconify/react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { TrendSnapshotDetailDto } from "@/types/Main";

interface TrendIndexBoxMockProps {
  data: TrendSnapshotDetailDto | null;
  isLoading?: boolean;
}

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

const GAUGE_BANDS: { key: string; bgClass: string; textClass: string }[] = [
  { key: "급락", bgClass: "bg-data-blue-medium", textClass: "text-falling" },
  { key: "하락", bgClass: "bg-falling-bg", textClass: "text-tx-assistive" },
  { key: "유지", bgClass: "bg-steady-bg", textClass: "text-tx-assistive" },
  { key: "상승", bgClass: "bg-rising-bg", textClass: "text-tx-assistive" },
  { key: "급상승", bgClass: "bg-data-red-medium", textClass: "text-rising" },
];

const BOX_CLASS_BASE =
  "flex w-full min-w-0 flex-col items-start gap-4 px-6 py-5";
const TOP_BOX_CLASS = `${BOX_CLASS_BASE} min-h-[244px]`;
const BOTTOM_BOX_CLASS = `${BOX_CLASS_BASE} min-h-[238px]`;

const INTEGRATED_BG_CLASS =
  "bg-[linear-gradient(179deg,var(--color-brand-subtle)_48.77%,var(--color-fill-bg-strong)_99.14%)]";
const PANEL_BG_CLASS = "bg-fill-bg-strong";

const fmtNum = (v: number | null | undefined, digits = 0): string =>
  v == null
    ? "-"
    : v.toLocaleString("ko-KR", { maximumFractionDigits: digits });

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
  return (
    <p
      className={`flex items-center gap-0.5 text-sm font-semibold ${style.text}`}
    >
      {showPrefix && "전날 대비 "}
      {fmtNum(Math.abs(value), digits)}
      {suffix}
      <Icon icon={style.icon} className="h-3.5 w-3.5" />
    </p>
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
      <span className="font-medium text-tx-neutral">{label}</span>
      {hasValue && (
        <span
          className={`inline-flex items-center gap-1 font-semibold ${style?.text ?? "text-tx-strong"}`}
        >
          {fmtNum(prev)}
          {unit} → {fmtNum(current)}
          {unit}
          {style && <Icon icon={style.icon} className="h-3.5 w-3.5" />}
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
      <div className="relative w-full h-2 overflow-hidden rounded bg-line-alt">
        <div
          className={`absolute inset-y-0 left-0 ${fillClass}`}
          style={{ width: `${barPosition}%` }}
        />
        <span
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${DIRECTION_STYLE[dir].solidBg}`}
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
}: {
  label: string;
  value: string;
  valueColorClass?: string;
  badgeValue?: number | null;
  badgeSuffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-fill-pressed px-2 py-1 text-sm font-semibold leading-[1.43] tracking-[-0.07px] text-tx-neutral">
        {label}
      </span>
      <span
        className={`whitespace-nowrap text-base font-semibold leading-[1.5] tracking-[-0.08px] ${valueColorClass}`}
      >
        {value}
      </span>
      {badgeValue != null && (
        <span
          className={`inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold leading-[1.33] ${DIRECTION_STYLE[directionOf(badgeValue)].text}`}
        >
          {fmtNum(Math.abs(badgeValue), 1)}
          {badgeSuffix}
          <Icon
            icon={DIRECTION_STYLE[directionOf(badgeValue)].icon}
            className="w-3 h-3"
          />
        </span>
      )}
    </div>
  );
}

function TodayVsYesterdayBars({
  prev,
  current,
}: {
  prev: number | null;
  current: number | null;
}) {
  if (prev == null || current == null) return null;
  const max = Math.max(prev, current, 1);
  return (
    <div className="flex items-end gap-5 shrink-0">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-medium leading-[1.33] text-tx-neutral">
          {fmtNum(prev)}
        </span>
        <div className="flex items-end w-12 h-16">
          <div
            className="w-full rounded-t bg-line-alt"
            style={{ height: `${(prev / max) * 100}%` }}
          />
        </div>
        <span className="text-[11px] text-tx-alt">어제</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-medium leading-[1.33] text-tx-neutral">
          {fmtNum(current)}
        </span>
        <div className="flex items-end w-12 h-16">
          <div
            className="w-full rounded-t bg-fill-primary"
            style={{ height: `${(current / max) * 100}%` }}
          />
        </div>
        <span className="text-[11px] text-tx-alt">오늘</span>
      </div>
    </div>
  );
}

let trendLineGradientId = 0;
function MiniTrendLine({
  prev,
  current,
}: {
  prev: number | null;
  current: number | null;
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
      <span className="text-[11px] text-tx-alt">최근 7일 추이</span>
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
      <div className="flex w-full justify-between text-[11px] text-tx-alt">
        <span>7일 전</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

function buildInsight(
  data: TrendSnapshotDetailDto,
): { prefix: string; highlight: string; suffix: string } | null {
  const { integrated_index, product_index, purchase_power_index } = data;
  const likePct = product_index.like_change_pct;
  const rankChange = purchase_power_index.rank_change;
  if (likePct == null || rankChange == null) return null;
  const dir = bandDirection(integrated_index.band);
  const dirWord = dir === "up" ? "상승" : dir === "down" ? "하락" : "유지";
  return {
    prefix: "하루 만에 ",
    highlight: `찜${likePct >= 0 ? "+" : ""}${fmtNum(likePct, 1)}%·랭킹${fmtNum(Math.abs(rankChange))}계단 ${dirWord}`,
    suffix: `으로 ${integrated_index.band} 구간에 진입했어요.`,
  };
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid h-[224px] w-full place-items-center rounded-[20px] border border-line-alt text-sm text-tx-alt">
      {text}
    </div>
  );
}

function TrendIndexBoxMock({ data, isLoading }: TrendIndexBoxMockProps) {
  if (isLoading) return <EmptyState text="불러오는 중..." />;
  if (!data) return <EmptyState text="트렌드 지수 데이터가 없어요." />;

  const { integrated_index, brand_index, product_index, purchase_power_index } =
    data;
  const overallDir = bandDirection(integrated_index.band);
  const overallStyle = DIRECTION_STYLE[overallDir];
  const insight = buildInsight(data);

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

          <div className="flex flex-wrap items-center w-full gap-2">
            <span className="text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
              {fmtNum(integrated_index.score, 1)}점
            </span>
            {integrated_index.score_change_pct != null && (
              <>
                <span className="h-px w-[83px] shrink-0 bg-line-alt" />
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-alt ${overallStyle.subtleBg}`}
                >
                  <span
                    className={`flex h-[7px] w-[7px] shrink-0 items-center justify-center rounded-full ${overallStyle.chipBg}`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${overallStyle.solidBg}`}
                    />
                  </span>
                  전날 대비{" "}
                  {fmtNum(Math.abs(integrated_index.score_change_pct), 0)}%{" "}
                  {integrated_index.band}
                </span>
              </>
            )}
          </div>

          {(integrated_index.reorder_count ?? purchase_power_index.reorder) !=
            null && (
            <p className="w-full text-xs font-semibold leading-[1.33] text-tx-assistive">
              재입고{" "}
              {fmtNum(
                integrated_index.reorder_count ?? purchase_power_index.reorder,
              )}
              회
            </p>
          )}

          {(insight || integrated_index.insight) && (
            <div className="flex items-center w-full px-3 py-3 border rounded-md min-h-10 border-line-alt bg-fill-bg">
              <p className="text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-neutral">
                {insight ? (
                  <>
                    {insight.prefix}
                    <span
                      className={`rounded px-1 font-semibold ${overallStyle.subtleBg}`}
                    >
                      {insight.highlight}
                    </span>
                    {insight.suffix}
                  </>
                ) : (
                  integrated_index.insight
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col justify-end flex-1 w-full min-h-0 gap-1">
            {/* 현재 밴드를 가리키는 화살표 — 칸 안이 아니라 색 막대 위에 뜬다 */}
            <div className="flex w-full">
              {GAUGE_BANDS.map((band) => (
                <div key={band.key} className="flex justify-center flex-1">
                  {band.key === integrated_index.band && (
                    <Icon
                      icon="ph:caret-down-fill"
                      className="w-5 h-5 text-icon-default"
                    />
                  )}
                </div>
              ))}
            </div>
            {/* 색 막대 — 글자 없이 밴드별 고정 배경색만 */}
            <div className="flex w-full gap-[1px]">
              {GAUGE_BANDS.map((band, idx) => {
                const roundedClass =
                  idx === 0
                    ? "rounded-l-md"
                    : idx === GAUGE_BANDS.length - 1
                      ? "rounded-r-md"
                      : "";
                return (
                  <div
                    key={band.key}
                    className={`h-[22px] flex-1 ${roundedClass} ${band.bgClass}`}
                  />
                );
              })}
            </div>
            {/* 밴드 이름 — 막대 "안"이 아니라 막대 아래 별도 줄 */}
            <div className="flex w-full">
              {GAUGE_BANDS.map((band) => (
                <span
                  key={band.key}
                  className={`flex-1 text-center text-xs font-medium leading-[1.33] ${band.textClass}`}
                >
                  {band.key}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 브랜드 인지도 */}
        <div className={`${TOP_BOX_CLASS} ${PANEL_BG_CLASS}`}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            브랜드 인지도
          </span>
          <p className="w-full text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
            {brand_index.awareness_label ?? "-"}
          </p>

          <div className="flex flex-col w-full gap-2 mt-auto">
            <RankLabelRow label="인지도 순위" />
            <PercentileSlider pct={brand_index.awareness_pct} />
          </div>
        </div>

        <div className={`${BOTTOM_BOX_CLASS} ${PANEL_BG_CLASS} @container`}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            아이템 관심도
          </span>
          <div className="flex w-full flex-col gap-1.5">
            <p className="w-full text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
              {product_index.interest_label ?? "-"}
            </p>
            <HeadlineChange value={product_index.like_change_pct} />
          </div>
          ]
          <div className="flex flex-col justify-end flex-1 w-full gap-4">
            <div className="flex w-full items-end gap-10 overflow-hidden @max-[380px]:justify-center">
              <TodayVsYesterdayBars
                prev={product_index.like_prev}
                current={product_index.like_count}
              />
              <MiniTrendLine
                prev={product_index.like_prev}
                current={product_index.like_count}
              />
            </div>
            <ChipStat
              label="좋아요&찜 수"
              value={fmtNum(product_index.like_count)}
              badgeValue={product_index.like_change_pct}
            />
          </div>
        </div>

        {/* 구매 화력도 */}
        <div className={`${BOTTOM_BOX_CLASS} ${PANEL_BG_CLASS}`}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            구매 화력도
          </span>
          <div className="flex w-full flex-col gap-1.5">
            <p className="w-full text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
              {purchase_power_index.purchase_label ?? "-"}
            </p>
            <HeadlineChange
              value={purchase_power_index.rank_change}
              suffix="단계"
              digits={0}
              showPrefix={false}
            />
          </div>
          \
          <div className="flex flex-col justify-end flex-1 w-full gap-4">
            <div className="flex flex-col w-full gap-2">
              <RankLabelRow
                label="화력 순위"
                prev={purchase_power_index.rank_prev}
                current={purchase_power_index.rank}
                direction={directionOf(purchase_power_index.rank_change)}
              />
              <PercentileSlider pct={purchase_power_index.purchase_pct} />
            </div>
            <div className="flex flex-wrap items-center w-full gap-x-6 gap-y-2">
              <ChipStat
                label="리뷰 수"
                value={
                  purchase_power_index.review_change != null
                    ? `${purchase_power_index.review_change >= 0 ? "+" : ""}${fmtNum(purchase_power_index.review_change)}`
                    : "-"
                }
                valueColorClass={
                  DIRECTION_STYLE[
                    directionOf(purchase_power_index.review_change)
                  ].text
                }
              />
              <ChipStat
                label="리오더"
                value={
                  purchase_power_index.reorder != null
                    ? `${purchase_power_index.reorder}차`
                    : "-"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendIndexBoxMock;
