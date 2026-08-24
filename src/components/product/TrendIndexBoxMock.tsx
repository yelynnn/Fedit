import { Icon } from "@iconify/react";
import type { TrendSnapshotDetailDto } from "@/types/Main";

// 트렌드 지수 고도화 UI. test/trend/{tempItemId} 응답을 그대로 그린다.
// 이전엔 여기서 목데이터를 직접 들고 있었는데, 실제 API에는 목업에 있던
// "전날 대비/재입고/수요압력", 브랜드·상품·구매 각 항목의 "지난달 대비 %"
// 같은 필드가 없어서(브랜드 지수는 인지도 %만, 상품 지수는 좋아요 증감만
// 제공) 실데이터에 맞춰 레이아웃 내용을 다시 맞췄다 — 큰 틀(4분할, 점수
// 게이지, 하단 지표 리스트)은 그대로 유지.
interface TrendIndexBoxMockProps {
  data: TrendSnapshotDetailDto | null;
  isLoading?: boolean;
}

type Direction = "up" | "down" | "flat";

// 상승(빨강) / 하락(파랑) / 유지(진회색) — FEDIT 트렌드 색상 토큰(index.css의
// --color-rising / --color-falling / --color-steady)을 그대로 사용한다.
const DIRECTION_STYLE: Record<
  Direction,
  { text: string; solidBg: string; subtleBg: string; icon: string }
> = {
  up: {
    text: "text-rising",
    solidBg: "bg-rising",
    subtleBg: "bg-rising-bg",
    icon: "ph:caret-up-fill",
  },
  down: {
    text: "text-falling",
    solidBg: "bg-falling",
    subtleBg: "bg-falling-bg",
    icon: "ph:caret-down-fill",
  },
  flat: {
    text: "text-steady",
    solidBg: "bg-steady",
    subtleBg: "bg-steady-bg",
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

// 5단계 밴드. 활성 밴드는 방향 색을 진하게, 비활성 밴드는 같은 방향의
// 옅은 색으로 표시해서 급락→하락→유지→상승→급상승으로 이어지는 그라데이션
// 느낌을 준다.
const GAUGE_BANDS: { key: string; range: string; direction: Direction; strong: boolean }[] = [
  { key: "급락", range: "0-25", direction: "down", strong: true },
  { key: "하락", range: "25-45", direction: "down", strong: false },
  { key: "유지", range: "45-65", direction: "flat", strong: false },
  { key: "상승", range: "65-85", direction: "up", strong: false },
  { key: "급상승", range: "85-100", direction: "up", strong: true },
];

// 4분할 카드 한 장의 각 셀 크기. 원래처럼 선으로 이어진 하나의 카드 형태는
// 유지하고, 셀 안쪽 크기만 px-24 py-20 / gap-16(내부)에 맞춘다. 높이는
// 224px을 기준값(min-height)으로만 두고, 지표가 많은 셀(구매 화력도 등)이
// 넘치면 스크롤 대신 셀(=그 행 전체)이 자연스럽게 늘어나게 한다.
const BOX_CLASS =
  "flex min-h-[224px] w-full flex-col items-start gap-4 px-6 py-5";

const fmtNum = (v: number | null | undefined, digits = 0): string =>
  v == null ? "-" : v.toLocaleString("ko-KR", { maximumFractionDigits: digits });

function ChangeBadge({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  if (value == null) {
    return <span className="text-xs font-semibold text-tx-alt">-</span>;
  }
  const dir = directionOf(value);
  const style = DIRECTION_STYLE[dir];
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${style.text}`}>
      {dir === "up" ? "+" : ""}
      {fmtNum(value, 1)}
      {suffix}
      <Icon icon={style.icon} className="h-3 w-3" />
    </span>
  );
}

// 값 자체가 증감분인 지표(리뷰 변화 등) — 별도 변화율 없이 값의 부호만으로
// 방향 색을 정한다.
function DeltaRow({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  const dir = directionOf(value);
  return (
    <div className="flex w-full items-center justify-between rounded-lg bg-fill-bg-strong px-4 py-2">
      <span className="text-sm font-medium text-tx-neutral">{label}</span>
      <span className={`text-sm font-semibold ${DIRECTION_STYLE[dir].text}`}>
        {value == null ? "-" : `${value >= 0 ? "+" : ""}${fmtNum(value)}${suffix}`}
      </span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  change,
  changeSuffix = "%",
}: {
  label: string;
  value: string;
  change?: number | null;
  changeSuffix?: string;
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-lg bg-fill-bg-strong px-4 py-2">
      <span className="text-sm font-medium text-tx-neutral">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold text-tx-strong">{value}</span>
        {change !== undefined && (
          <ChangeBadge value={change} suffix={changeSuffix} />
        )}
      </span>
    </div>
  );
}

// 브랜드 인지도 / 아이템 관심도 / 구매 화력도는 백분위(0~100) 하나만 API가
// 내려줘서, 각 항목이 통합 지수와 별개로 상위/하위 어디쯤인지 한눈에 보이게
// 위치 슬라이더로 표시한다. 방향 색은 50%를 기준으로 위/아래를 나눈다.
function PercentileSlider({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const clamped = Math.min(100, Math.max(0, pct));
  const dir: Direction = clamped > 55 ? "up" : clamped < 45 ? "down" : "flat";
  return (
    <div className="w-full">
      <div className="relative h-1.5 w-full rounded-full bg-gradient-to-r from-falling-bg via-steady-bg to-rising-bg">
        <span
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${DIRECTION_STYLE[dir].solidBg}`}
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="mt-1.5 flex w-full justify-between text-[11px] text-tx-alt">
        <span>하위</span>
        <span>상위</span>
      </div>
    </div>
  );
}

// 아이템 관심도의 좋아요&찜 수를 어제(prev) vs 오늘(current) 막대로 비교.
// 7일 추이 스파크라인은 API가 일자별 배열을 내려주지 않아 아직 구현하지
// 않음 — 추후 백엔드에 like_trend_7d 같은 필드가 추가되면 반영한다.
function TodayVsYesterdayBars({
  prev,
  current,
}: {
  prev: number | null;
  current: number | null;
}) {
  if (prev == null || current == null) return null;
  const max = Math.max(prev, current, 1);
  const dir = directionOf(current - prev);
  return (
    <div className="flex w-full items-end justify-center gap-6 px-2 pb-1">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs text-tx-alt">{fmtNum(prev)}</span>
        <div className="flex h-16 w-7 items-end">
          <div
            className="w-full rounded-t bg-fill-inactive"
            style={{ height: `${(prev / max) * 100}%` }}
          />
        </div>
        <span className="text-[11px] text-tx-alt">어제</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-semibold text-tx-strong">{fmtNum(current)}</span>
        <div className="flex h-16 w-7 items-end">
          <div
            className={`w-full rounded-t ${DIRECTION_STYLE[dir].solidBg}`}
            style={{ height: `${(current / max) * 100}%` }}
          />
        </div>
        <span className="text-[11px] text-tx-alt">오늘</span>
      </div>
    </div>
  );
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

  const { integrated_index, brand_index, product_index, purchase_power_index } = data;
  const overallDir = bandDirection(integrated_index.band);
  const overallStyle = DIRECTION_STYLE[overallDir];
  const activeIndex = GAUGE_BANDS.findIndex(
    (band) => band.key === integrated_index.band,
  );

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-line-alt">
      <div className="grid grid-cols-2 divide-x divide-y divide-line-alt">
        {/* 통합 지수 */}
        <div className={BOX_CLASS}>
          <div className="flex w-full items-center gap-1">
            <span className="text-base font-semibold text-tx-neutral">
              통합 지수
            </span>
            <Icon icon="ph:info" className="h-4 w-4 text-icon-alt" />
            <span className="ml-auto text-xs font-medium text-tx-alt">
              {data.date_asof} 기준
            </span>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2">
            <span className="text-[28px] font-bold leading-none text-tx-strong">
              {fmtNum(integrated_index.score, 1)}점
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${overallStyle.solidBg}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {integrated_index.score_change_pct != null &&
                `전날 대비 ${fmtNum(Math.abs(integrated_index.score_change_pct), 0)}% `}
              {integrated_index.band}
            </span>
          </div>

          {integrated_index.reorder_count != null && (
            <p className="w-full text-xs font-medium text-tx-alt">
              재입고 {fmtNum(integrated_index.reorder_count)}회
            </p>
          )}

          {integrated_index.insight && (
            <p className="w-full rounded-lg bg-fill-bg-strong px-3 py-2.5 text-xs leading-relaxed text-tx-neutral">
              {integrated_index.insight}
            </p>
          )}

          <div className="flex w-full min-h-0 flex-1 items-end gap-1">
            {GAUGE_BANDS.map((band, idx) => {
              const active = idx === activeIndex;
              const style = DIRECTION_STYLE[band.direction];
              return (
                <div key={band.key} className="relative h-full flex-1">
                  {active && (
                    <Icon
                      icon="ph:caret-down-fill"
                      className={`absolute -top-4 left-1/2 h-4 w-4 -translate-x-1/2 ${style.text}`}
                    />
                  )}
                  <div
                    className={`flex h-full flex-col items-center justify-center rounded-lg text-center transition-colors ${
                      active
                        ? `${style.solidBg} text-white`
                        : band.strong
                          ? `${style.solidBg} text-white/90`
                          : `${style.subtleBg} ${style.text}`
                    }`}
                  >
                    {active ? (
                      <span className="text-base font-bold">
                        {fmtNum(integrated_index.score, 1)}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-semibold">
                          {band.key}
                        </span>
                        <span className="text-[11px]">{band.range}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 브랜드 인지도 */}
        <div className={BOX_CLASS}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            브랜드 인지도
          </span>
          <p className="w-full text-[26px] font-bold leading-none text-tx-strong">
            {brand_index.awareness_label ?? "-"}
          </p>
          <p className="w-full text-sm font-medium text-tx-alt">
            시장 인지도{" "}
            <span className="font-semibold text-tx-strong">
              {fmtNum(brand_index.awareness_pct, 1)}%
            </span>
          </p>
          <div className="mt-auto w-full">
            <PercentileSlider pct={brand_index.awareness_pct} />
          </div>
        </div>

        {/* 아이템 관심도 */}
        <div className={BOX_CLASS}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            아이템 관심도
          </span>
          <p className="w-full text-[26px] font-bold leading-none text-tx-strong">
            {product_index.interest_label ?? "-"}
          </p>
          <p className="w-full text-sm font-medium text-tx-alt">
            관심도{" "}
            <span className="font-semibold text-tx-strong">
              {fmtNum(product_index.interest_pct, 1)}%
            </span>
          </p>
          <TodayVsYesterdayBars
            prev={product_index.like_prev}
            current={product_index.like_count}
          />
          <div className="flex w-full flex-1 flex-col gap-1.5">
            <MetricRow
              label="좋아요&찜 수"
              value={fmtNum(product_index.like_count)}
              change={product_index.like_change_pct}
            />
          </div>
        </div>

        {/* 구매 화력도 */}
        <div className={BOX_CLASS}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            구매 화력도
          </span>
          <p className="w-full text-[26px] font-bold leading-none text-tx-strong">
            {purchase_power_index.purchase_label ?? "-"}
          </p>
          <p className="w-full text-sm font-medium text-tx-alt">
            구매력{" "}
            <span className="font-semibold text-tx-strong">
              {fmtNum(purchase_power_index.purchase_pct, 1)}%
            </span>
          </p>
          <PercentileSlider pct={purchase_power_index.purchase_pct} />
          <div className="flex w-full flex-1 flex-col gap-1.5">
            <MetricRow
              label="랭킹"
              value={
                purchase_power_index.rank != null
                  ? purchase_power_index.rank_prev != null
                    ? `${fmtNum(purchase_power_index.rank_prev)}위 → ${fmtNum(purchase_power_index.rank)}위`
                    : `${fmtNum(purchase_power_index.rank)}위`
                  : "-"
              }
              change={purchase_power_index.rank_change}
              changeSuffix="단계"
            />
            <DeltaRow label="리뷰 변화" value={purchase_power_index.review_change} />
            <MetricRow
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
  );
}

export default TrendIndexBoxMock;
