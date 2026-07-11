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
  subBadges.some((badge, idx) => badge.value != null || extraValues?.[idx] != null);

function TrendIndexBox({ itemCode }: TrendIndexBoxProps) {
  const [trendData, setTrendData] = useState<TrendIndexResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!itemCode) return;
    GetTrendIndex(itemCode).then(setTrendData).catch(console.error);
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
    ? [`지난달 ${fmt(purchase.sales)}건`]
    : ["지난달 - 건"];

  // 세 카드 중 하나라도 상세 값이 있으면 전부 펼치고 화살표를 숨긴다.
  // 셋 다 값이 없을 때만 화살표로 접었다 펼 수 있게 한다.
  const anyHasDetail =
    hasDetail(brandBadges) ||
    hasDetail(productBadges, productExtras) ||
    hasDetail(purchaseBadges, purchaseExtras);
  const isOpen = anyHasDetail ? true : detailsOpen;
  const showToggle = !anyHasDetail;

  const renderCard = (
    title: string,
    scoreVal: number | null,
    pctlVal: number | null,
    subBadges: { label: string; value: number | null }[],
    extraValues?: (string | null)[],
    isPurchase?: boolean,
  ) => {
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
          <span className="text-base font-semibold text-tx-neutral">{title}</span>
          <Icon
            icon="ph:question"
            className="w-4 h-4 cursor-pointer text-icon-alt"
          />
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
