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
      <span className="text-xs font-semibold leading-[1.33] text-tx-assistive">
        {label}
      </span>
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
  empty = value === "-",
}: {
  label: string;
  value: string;
  valueColorClass?: string;
  badgeValue?: number | null;
  badgeSuffix?: string;
  empty?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 shrink-0">
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-fill-pressed px-2 py-1 text-sm font-semibold leading-[1.43] tracking-[-0.07px] text-tx-neutral">
        {label}
      </span>
      <span className="flex items-center gap-x-2">
        <span
          className={
            empty
              ? "whitespace-nowrap text-xs font-medium leading-[1.33] text-tx-assistive"
              : `whitespace-nowrap text-base font-semibold leading-[1.5] tracking-[-0.08px] ${valueColorClass}`
          }
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
        <span className="text-[11px] text-tx-alt">{pastDayLabel(gapDays)}</span>
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
      <span className="text-[11px] text-tx-alt">
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
      <div className="flex w-full justify-between text-[11px] text-tx-alt">
        <span>{pastDayLabel(gapDays)}</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

function buildInsight(
  data: TrendSnapshotDetailDto,
): { prefix: string; highlight: string; suffix: string } | null {
  const { integrated_index, brand_index, product_index, purchase_power_index } =
    data;
  const likePct = product_index.like_change_pct;
  const rankChange = purchase_power_index.rank_change;
  const dir = bandDirection(integrated_index.band);
  const dirWord = dir === "up" ? "상승" : dir === "down" ? "하락" : "유지";

  if (likePct != null || rankChange != null) {
    const parts: string[] = [];
    if (likePct != null)
      parts.push(`찜${likePct >= 0 ? "+" : ""}${fmtNum(likePct, 1)}%`);
    if (rankChange != null)
      parts.push(`랭킹${fmtNum(Math.abs(rankChange))}계단 ${dirWord}`);

    return {
      prefix: "하루 만에 ",
      highlight: parts.join("·"),
      suffix: `으로 ${integrated_index.band} 구간에 진입했어요.`,
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
    subtitle: "홀터넥 · 크롭 · 스트라이프",
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
        <div className="min-w-6 flex-1 border-t border-dashed border-line-alt" />
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-falling-bg px-3 py-1.5 text-sm font-semibold leading-[1.43] tracking-[-0.07px] text-tx-strong">
          <span className="flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-falling">
            <span className="h-1 w-1 rounded-full bg-white" />
          </span>
          분석 진행 중
        </span>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-xl border border-line-alt bg-fill-bg-strong px-4 py-4">
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
                  step.status === "pending" ? "text-tx-assistive" : "text-tx-strong"
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

function TrendIndexBoxMock({ data, isLoading }: TrendIndexBoxMockProps) {
  if (isLoading) return <EmptyState text="불러오는 중..." />;
  if (!data) return <EmptyState text="트렌드 지수 데이터가 없어요." />;

  const { integrated_index, brand_index, product_index, purchase_power_index } =
    data;
  const isPreparing = integrated_index.score == null;
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

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-line-alt">
      {data.referenced_snapshot && (
        <p className="w-full px-4 py-2 text-xs font-medium border-b text-tx-assistive bg-fill-bg-strong border-line-alt">
          오늘자 데이터가 아직 없어 가장 최근 스냅샷({data.date_asof})을
          보여드려요.
        </p>
      )}
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
              <div className="flex flex-wrap items-center w-full gap-2">
                <span className="text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
                  {fmtNum(integrated_index.score, 1)}점
                </span>
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
                  {integrated_index.band}
                </span>
              </div>

              {purchase_power_index.reorder != null && (
                <p className="w-full text-xs font-semibold leading-[1.33] text-tx-assistive">
                  재입고 {fmtNum(purchase_power_index.reorder)}회
                </p>
              )}

              {(apiInsight || computedInsight) && (
                <div className="flex items-center w-full px-3 py-3 my-2 border rounded-md min-h-10 border-line-alt bg-fill-bg">
                  <p className="text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-neutral">
                    {useComputedInsight ? (
                      <>
                        {computedInsight!.prefix}
                        <span
                          className={`rounded px-1 font-semibold ${overallStyle.subtleBg}`}
                        >
                          {computedInsight!.highlight}
                        </span>
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
            </>
          )}
        </div>

        {/* 브랜드 인지도 */}
        <div className={`${TOP_BOX_CLASS} ${PANEL_BG_CLASS}`}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            브랜드 인지도
          </span>
          <p className="w-full text-xl font-semibold leading-[1.4] tracking-[-0.24px] text-tx-strong">
            {brand_index.awareness_label ?? "-"}
          </p>
          {/* 스토어 찜 수 필드가 아직 없어 항상 브랜드 검색 데이터 기준임을 안내한다 */}
          <p className="w-full mb-2 text-xs font-semibold leading-[1.33] text-falling">
            브랜드 검색 데이터 기준
          </p>

          <div className="flex flex-col w-full gap-2 mt-auto">
            <RankLabelRow label="인지도 순위" />
            <PercentileSlider pct={brand_index.awareness_pct} />
            {/* 네이버 검색량·스토어 찜 수 — 아직 백엔드 필드가 없어 항상
              플레이스홀더만 보여준다. 값이 생기면 조건부로 실제 수치를 표시하게 바꾼다. */}
            <div className="flex flex-col w-full gap-1.5">
              <ChipStat label="네이버 검색량" value="-" />
              <ChipStat label="스토어 찜 수" value="입점 플랫폼 없음" empty />
            </div>
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
          <div className="flex flex-col justify-end flex-1 w-full gap-4">
            <div className="flex w-full items-end gap-10 overflow-hidden @max-[380px]:justify-center">
              <TodayVsYesterdayBars
                prev={product_index.like_prev}
                current={product_index.like_count}
                gapDays={data.signal_meta.gap_days}
              />
              <MiniTrendLine
                prev={product_index.like_prev}
                current={product_index.like_count}
                gapDays={data.signal_meta.gap_days}
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
