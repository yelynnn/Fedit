import { Icon } from "@iconify/react";

interface TrendRawData {
  value: string | number;
  compareRate: string | number;
  badgeRates?: (string | number)[];
  extraValue?: string | number | (string | number)[];
}

interface TrendIndexBoxProps {
  isEntered: boolean;
}

function TrendIndexBox({ isEntered }: TrendIndexBoxProps) {
  const mockApiData: Record<"brand" | "product" | "purchase", TrendRawData> = {
    brand: {
      value: isEntered ? 15 : 90,
      compareRate: 12,
      badgeRates: [20, 10],
    },
    product: {
      value: isEntered ? 10 : 90,
      compareRate: 8,
      badgeRates: [15],
      extraValue: isEntered ? ["90 (00)", "n 차 리오더 (26.04)"] : undefined,
    },
    purchase: {
      value: isEntered ? 5 : "-",
      compareRate: isEntered ? 25 : "--",
      extraValue: isEntered ? 120 : "--",
    },
  };

  const renderCard = (
    type: "brand" | "product" | "purchase",
    data: TrendRawData,
  ) => {
    let title = "";
    let displayValue = "";
    let displayCompareText = "";
    let displaySubBadges: string[] = [];
    let displayExtraInfo = data.extraValue;

    if (type === "brand") {
      title = "브랜드 지수";
      displayValue = isEntered ? `상위 ${data.value}%` : `${data.value}`;
      displayCompareText = isEntered
        ? `지난달 대비 ${data.compareRate}% 증가`
        : `평균 대비 ${data.compareRate}%`;
      displaySubBadges = isEntered
        ? [
            `플랫폼 화력도 ${data.badgeRates?.[0]}% 증가`,
            `시장 주목도 ${data.badgeRates?.[1]}% 증가`,
          ]
        : [
            `유사 브랜드 대비 ${data.badgeRates?.[0]}% 활성화`,
            `시장 화력도 ${data.badgeRates?.[1]}% 활성화`,
          ];
    } else if (type === "product") {
      title = "상품 지수";
      displayValue = isEntered ? `상위 ${data.value}%` : `${data.value}`;
      displayCompareText = isEntered
        ? `지난달 대비 ${data.compareRate}% 증가`
        : `평균 대비 ${data.compareRate}%`;
      displaySubBadges = isEntered
        ? ["상품 찜하기수", "리오더 여부"]
        : [`타스타일 대비 ${data.badgeRates?.[0]}% 활성화`];
    } else if (type === "purchase") {
      title = "구매 화력도";
      displayValue = isEntered ? `상위 ${data.value}%` : `${data.value}`;
      displayCompareText = `지난달 대비 ${data.compareRate}% 증가`;
      displaySubBadges = ["판매수량"];
      displayExtraInfo = `지난달 ${data.extraValue}건`;
    }

    return (
      // 카드 내부 padding을 px-3 py-4 -> p-3으로 살짝 줄여 공간 확보
      <div className="w-full box-border p-3 rounded-xl  bg-[#F9FAFB]">
        {/* 타이틀 영역: text-base, 아이콘 w-4 h-4로 미세 축소 */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-base font-bold text-[#3D3F41]">{title}</span>
          <Icon
            icon="ph:question"
            className="w-4 h-4 text-[#ADB5BD] cursor-pointer"
          />
        </div>

        {/* 수치 및 비교 뱃지 영역: gap-1.5로 축소, 뱃지 패딩과 텍스트 크기 축소 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-base font-bold text-[#151515] whitespace-nowrap">
            {displayValue}
          </span>
          <div className="px-1.5 py-0.5 bg-[#FFF4E5] rounded-md">
            <span className="text-[11px] font-semibold text-[#FF9200] whitespace-nowrap">
              {displayCompareText}
            </span>
          </div>
        </div>

        {/* 하단 뱃지 영역: gap 축소, 텍스트 크기 text-[11px], text-sm으로 미세 조정 */}
        <div className="flex flex-col gap-1.5">
          {displaySubBadges.map((badge, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-1.5">
              <div
                className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${
                  type === "purchase" || (type === "product" && isEntered)
                    ? "bg-[#F1F3F5] text-[#56585A]"
                    : "bg-[#E7F0FF] text-[#1A75FF]"
                }`}
              >
                {badge}
              </div>
              {displayExtraInfo && (
                <span className="text-sm font-bold text-[#151515] whitespace-nowrap">
                  {Array.isArray(displayExtraInfo)
                    ? displayExtraInfo[idx]
                    : displayExtraInfo}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-3 gap-3">
        {renderCard("brand", mockApiData.brand)}
        {renderCard("product", mockApiData.product)}
        {renderCard("purchase", mockApiData.purchase)}
      </div>
    </div>
  );
}

export default TrendIndexBox;
