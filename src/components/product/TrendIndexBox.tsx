import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GetTrendIndex } from "@/apis/DashBoardAPI";
import type { TrendIndexResponse } from "@/types/Main";

interface TrendIndexBoxProps {
  itemCode: string;
}

// null/undefined → "-", 숫자 → 콤마 포맷
const fmt = (v: number | null | undefined): string =>
  v == null ? "-" : v.toLocaleString("ko-KR");

const hasDetail = (
  subBadges: { label: string; value: number | null }[],
  extraValues?: (string | null)[],
) =>
  subBadges.some(
    (badge, idx) => badge.value != null || extraValues?.[idx] != null,
  );

const INFO_TEXT: Record<string, string> = {
  "브랜드 지수": "브랜드의 검색 관심도와 SNS 영향력을 종합한 시장 영향력 지표",
  "상품 지수": "핏, 소재, 패턴 등을 반영한 상품 유형별 트렌드 지표",
  "구매 화력도": "조회수, 판매량 등 소비자 반응을 기반으로 한 시장성 지표",
};

function TrendIndexBox({ itemCode }: TrendIndexBoxProps) {
  const [trendData, setTrendData] = useState<TrendIndexResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState<Set<string>>(new Set());

  const showInfo = (title: string) => {
    setInfoOpen((prev) => new Set(prev).add(title));
    setTimeout(() => {
      setInfoOpen((prev) => {
        const next = new Set(prev);
        next.delete(title);
        return next;
      });
    }, 3000);
  };

  useEffect(() => {
    if (!itemCode) return;
    GetTrendIndex(itemCode).then(setTrendData).catch(() => {});
    setDetailsOpen(false);
  }, [itemCode]);

  if (!trendData) return null;

  const { isPlatform, brand, purchase, category } = trendData;

  // 브랜드 지수
  const brandBadges = isPlatform
    ? [
        { label: "플랫폼 화력도", value: brand.likes },
        { label: "시장 주목도", value: brand.search },
      ]
    : [{ label: "유사 브랜드 대비", value: brand.marketScore }];

  // 상품 지수
  const productBadges = isPlatform
    ? [
        { label: "상품 찜하기수", value: null },
        { label: "리오더 여부", value: null },
      ]
    : [{ label: "타스타일 대비", value: category.categoryPctl }];

  const productExtras = isPlatform
    ? [
        category.likes == null ? "-" : fmt(category.likes),
        category.reorder == null
          ? "- 차 리오더"
          : `${category.reorder}차 리오더`,
      ]
    : undefined;

  // 구매 화력도
  const purchaseBadges = [{ label: "판매수량", value: null }];
  const purchaseExtras = isPlatform
    ? [
        purchase.sales != null && purchase.sales <= 100
          ? "지난달 100건 이하"
          : `지난달 ${fmt(purchase.sales)}건`,
      ]
    : ["지난달 - 건"];

  const renderCard = (
    title: string,
    scoreVal: number | null,
    pctlVal: number | null,
    subBadges: { label: string; value: number | null }[],
    extraValues?: (string | null)[],
    isPurchase?: boolean,
  ) => {
    // 브랜드 지수만 토글로 접었다 펼 수 있고, 상품 지수/구매 화력도는 항상 한 줄로 표시한다.
    const isBrand = title === "브랜드 지수";
    const brandHasDetail = isBrand && hasDetail(subBadges, extraValues);
    const isOpen = isBrand ? (brandHasDetail ? true : detailsOpen) : true;
    const showToggle = isBrand && !brandHasDetail;

    const displayValue =
      scoreVal == null
        ? "-"
        : isPlatform
          ? `상위 ${fmt(scoreVal)}%`
          : isPurchase
            ? fmt(scoreVal)
            : `${fmt(scoreVal)} 점`;

    const displayCompareText = isPlatform
      ? isPurchase
        ? `지난달 대비 ${fmt(pctlVal)}% 증가`
        : `지난달 대비 ${fmt(pctlVal)}% 증가`
      : `평균 대비 ${fmt(pctlVal)}%`;

    return (
      <div className="box-border w-full p-4 rounded-xl bg-fill-bg-strong">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-base font-semibold text-tx-neutral">
            {title}
          </span>
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => showInfo(title)}
              className="flex items-center justify-center w-4 h-4"
            >
              <Icon
                icon="ph:question"
                className="w-4 h-4 cursor-pointer text-icon-alt"
              />
            </button>
            {infoOpen.has(title) && (
              <>
                <div
                  className="absolute z-50 h-[6px] w-3 overflow-hidden"
                  style={{ left: 4, top: 18 }}
                >
                  <div className="absolute left-1/2 top-[2px] h-2 w-2 -translate-x-1/2 rotate-45 bg-[rgba(0,0,0,0.75)]" />
                </div>
                <div
                  className="absolute z-50 flex w-[200px] flex-col items-center justify-center gap-2.5 rounded-lg bg-[rgba(0,0,0,0.75)] px-2 py-1.5 shadow-[0_4px_16px_0_rgba(0,0,0,0.10)]"
                  style={{ left: -10, top: 24 }}
                >
                  <span className="text-center type-body-xsmall break-keep text-tx-inverse">
                    {INFO_TEXT[title]}
                  </span>
                </div>
              </>
            )}
          </div>
          {showToggle && (
            <button
              type="button"
              onClick={() => setDetailsOpen((prev) => !prev)}
              className="flex items-center justify-center w-4 h-4 ml-auto text-icon-alt"
            >
              <Icon
                icon="ph:caret-down"
                className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-base font-semibold text-[#151515] whitespace-nowrap">
            {displayValue}
          </span>
          {/* isPlatform true일 때만 주황 뱃지 표시 */}
          {isPlatform && (
            <div className="px-1.5 py-0.5 bg-data-orange-light rounded-md">
              <span className="text-[12px] font-semibold text-status-warning whitespace-nowrap">
                {displayCompareText}
              </span>
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-1.5 ${isOpen ? "" : "hidden"}`}>
          {subBadges.map((badge, idx) => {
            const isGray = isPurchase || (title === "상품 지수" && isPlatform);
            const badgeText =
              badge.value == null
                ? `${badge.label} -`
                : `${badge.label} ${fmt(badge.value)}%`;

            return (
              <div key={idx} className="flex flex-wrap items-center gap-1.5">
                <div
                  className={`px-2 py-1 rounded-md text-[12px] font-semibold whitespace-nowrap ${
                    isGray
                      ? "bg-surface-base text-tx-alt"
                      : "bg-falling-bg text-data-blue"
                  }`}
                >
                  {isPurchase || (extraValues && extraValues[idx] != null)
                    ? badge.label
                    : badgeText}
                </div>
                {extraValues && extraValues[idx] != null && (
                  <span className="text-sm font-semibold text-[#151515] whitespace-nowrap">
                    {extraValues[idx]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-5">
        {renderCard(
          "브랜드 지수",
          brand.brandScore,
          brand.brandPctl,
          brandBadges,
        )}
        {renderCard(
          "상품 지수",
          category.categoryScore,
          category.categoryPctl,
          productBadges,
          productExtras,
        )}
        {renderCard(
          "구매 화력도",
          purchase.purchaseScore,
          purchase.purchasePctl,
          purchaseBadges,
          purchaseExtras,
          true,
        )}
      </div>
    </div>
  );
}

export default TrendIndexBox;
