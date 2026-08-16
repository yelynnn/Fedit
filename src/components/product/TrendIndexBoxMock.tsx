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

const GAUGE_BANDS = [
  { key: "급락", range: "0-25" },
  { key: "하락", range: "25-45" },
  { key: "유지", range: "45-65" },
  { key: "상승", range: "65-85" },
  { key: "급상승", range: "85-100" },
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
  const isUp = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isUp ? "text-rising" : "text-[#5B84FF]"
      }`}
    >
      {isUp ? "+" : ""}
      {fmtNum(value, 1)}
      {suffix}
      <Icon
        icon={isUp ? "ph:caret-up-fill" : "ph:caret-down-fill"}
        className="h-3 w-3"
      />
    </span>
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

  const { integrated_index, brand_index, product_index, purchase_power_index, signal_meta } =
    data;
  const activeIndex = GAUGE_BANDS.findIndex(
    (band) => band.key === integrated_index.band,
  );

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-line-alt">
      <div className="grid grid-cols-2 divide-x divide-y divide-line-alt">
        {/* 통합 지수 */}
        <div className={`${BOX_CLASS} bg-[#F4FFEE]`}>
          <div className="flex w-full items-center gap-1">
            <span className="text-base font-semibold text-tx-neutral">
              통합 지수
            </span>
            <Icon icon="ph:info" className="h-4 w-4 text-icon-alt" />
            <span className="ml-auto text-xs font-medium text-tx-alt">
              {data.date_asof} 기준
            </span>
          </div>

          <div className="flex w-full items-center gap-2">
            <span className="text-[28px] font-bold leading-none text-tx-strong">
              {fmtNum(integrated_index.score, 1)}점
            </span>
            <span className="rounded-full bg-rising px-2.5 py-1 text-xs font-semibold text-white">
              {integrated_index.band}
            </span>
          </div>

          <div className="flex w-full items-center justify-between">
            <p className="text-sm font-medium text-tx-alt">
              신뢰도{" "}
              {integrated_index.confidence != null
                ? `${Math.round(integrated_index.confidence * 100)}%`
                : "-"}
            </p>
            <span className="whitespace-nowrap rounded-full border border-line-alt bg-white px-3 py-1.5 text-xs font-semibold text-tx-neutral">
              연속 관측 {fmtNum(signal_meta?.streak_days)}일
            </span>
          </div>

          <div className="flex w-full min-h-0 flex-1 items-end gap-1">
            {GAUGE_BANDS.map((band, idx) => {
              const active = idx === activeIndex;
              return (
                <div key={band.key} className="relative h-full flex-1">
                  {active && (
                    <Icon
                      icon="ph:caret-down-fill"
                      className="absolute -top-4 left-1/2 h-4 w-4 -translate-x-1/2 text-rising"
                    />
                  )}
                  <div
                    className={`flex h-full flex-col items-center justify-center rounded-lg text-center transition-colors ${
                      active
                        ? "bg-rising text-white"
                        : "bg-white/70 text-tx-alt"
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

        {/* 브랜드 지수 */}
        <div className={BOX_CLASS}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            브랜드 지수
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
        </div>

        {/* 상품 지수 */}
        <div className={BOX_CLASS}>
          <span className="w-full text-base font-semibold text-tx-neutral">
            상품 지수
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
          <div className="flex w-full flex-1 flex-col gap-1.5">
            <MetricRow
              label="랭킹"
              value={
                purchase_power_index.rank != null
                  ? `${fmtNum(purchase_power_index.rank)}위`
                  : "-"
              }
              change={purchase_power_index.rank_change}
              changeSuffix="단계"
            />
            <MetricRow
              label="리뷰 변화"
              value={
                purchase_power_index.review_change != null
                  ? `${purchase_power_index.review_change >= 0 ? "+" : ""}${purchase_power_index.review_change}`
                  : "-"
              }
            />
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
