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

function TrendIndexBox({ itemCode }: TrendIndexBoxProps) {
  const [trendData, setTrendData] = useState<TrendIndexResponse | null>(null);

  useEffect(() => {
    if (!itemCode) return;
    GetTrendIndex(itemCode).then(setTrendData).catch(console.error);
  }, [itemCode]);

  if (!trendData) return null;

  const { isPlatform, brand, purchase, category } = trendData;

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
      <div className="w-full box-border p-3 rounded-xl bg-fill-bg-strong">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-base font-bold text-tx-neutral">{title}</span>
          <Icon
            icon="ph:question"
            className="w-4 h-4 text-icon-alt cursor-pointer"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-base font-bold text-[#151515] whitespace-nowrap">
            {displayValue}
          </span>
          {/* isPlatform true일 때만 주황 뱃지 표시 */}
          {isPlatform && (
            <div className="px-1.5 py-0.5 bg-data-orange-light rounded-md">
              <span className="text-[11px] font-semibold text-status-warning whitespace-nowrap">
                {displayCompareText}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {subBadges.map((badge, idx) => {
            const isGray = isPurchase || (title === "상품 지수" && isPlatform);
            const badgeText =
              badge.value == null
                ? `${badge.label} -`
                : `${badge.label} ${fmt(badge.value)}%`;

            return (
              <div key={idx} className="flex flex-wrap items-center gap-1.5">
                <div
                  className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${
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
                  <span className="text-sm font-bold text-[#151515] whitespace-nowrap">
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

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-3 gap-3">
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
