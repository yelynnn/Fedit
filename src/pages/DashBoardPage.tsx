import { GetTrendKeyword } from "@/apis/DashBoardAPI";
import NewMainKeywordBox from "@/components/main/NewMainKeywordBox";

import RankBox from "@/components/main/RankBox";
import SubTitleBox from "@/components/main/SubTitleBox";
import { useTypeStore } from "@/stores/TypeStore";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";
// import MonthModal from "@/components/main/modal/MonthModal";

function DashBoardPage() {
  const [keywordList, setKeywordList] = useState<any[]>([]);
  const [crawledDate, setCrawledDate] = useState<string | null>(null);
  const { audienceType, selectedMonth, setAudienceType, setSelectedMonth } =
    useTypeStore();

  const [currentDate, setCurrentDate] = useState(dayjs());
  // const isToday = currentDate.isSame(dayjs(), "day");
  const isCurrentMonth = currentDate.isSame(dayjs(), "month");
  // const [isMonthModalOpen, setMonthModalOpen] = useState(false);

  const dateListOptions = [
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
  ];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const baseParams =
          selectedMonth && selectedMonth.trim() !== ""
            ? { audienceType, date: selectedMonth }
            : { audienceType };

        const baseRes = await GetTrendKeyword(baseParams);

        const baseArray = Array.isArray(baseRes)
          ? baseRes
          : (baseRes?.result ?? []);

        let merged = baseArray.flatMap((result: any) => {
          const brands = result.brands ?? [];
          return brands
            .filter((b: any) => b.brand !== "29CM")
            .map((b: any) => ({
              title: b.brand,
              dateType: result.date_type,
              categories: b.categories ?? [],
              date: result.date,
            }));
        });

        if (audienceType === "kids") {
          const naverParams = { audienceType: "kids", brand: "네이버" };

          const naverRes = await GetTrendKeyword(naverParams);

          const naverArray = Array.isArray(naverRes)
            ? naverRes
            : (naverRes?.result ?? []);

          const parsedNaver = naverArray.flatMap((result: any) => {
            const brands = result.brands ?? [];
            return brands.map((b: any) => ({
              title: b.brand,
              dateType: result.date_type,
              categories: b.categories ?? [],
              date: result.date,
            }));
          });

          merged = [...merged, ...parsedNaver];
        }

        setKeywordList(merged);
        setCrawledDate(baseArray[0]?.date ?? null);
      } catch (e: any) {
        console.log("Fetch error:", e);

        setKeywordList([]);
        setCrawledDate(null);
      }
    };

    fetchAll();
  }, [audienceType, selectedMonth]);

  return (
    <div className="w-full h-full px-14">
      <section>
        <div className="flex items-center justify-between p-1 bg-white border border-line-default rounded-full w-64 mt-3">
          {["adult", "kids"].map((type) => (
            <button
              key={type}
              onClick={() => type !== "kids" && setAudienceType(type)}
              disabled={type === "kids"}
              className={`relative w-1/2 h-9 rounded-full text-sm font-semibold transition-colors duration-200 ${
                audienceType === type
                  ? "bg-[#1A1A1A] text-white"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              {type === "adult" ? (
                "어덜트"
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <Icon icon="si:lock-duotone" className="w-4 h-8" />
                  키즈
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 mb-3">
          <SubTitleBox
            title="플랫폼 내 인기 키워드"
            label="플랫폼 검색어"
            infoText="매일 오전 10시, 무신사·W컨셉·네이버 등 주요 패션 플랫폼의 검색어 데이터를 자동 수집하며, 매거진·SNS 언급량 분석을 결합해 월별 종합 랭킹과 최근 주목도가 급상승한 패션 트렌드를 함께 제공합니다."
          />
        </div>

        {audienceType === "adult" && (
          <div className="flex items-center justify-between w-full pl-1 mb-4">
            {/* <div className="relative">
              <button
                onClick={() => setMonthModalOpen(true)}
                className="flex items-center gap-1.5 text-base font-semibold text-tx-alt hover:opacity-80 transition-opacity"
              >
                {isToday
                  ? `오늘(${currentDate.format("YYYY.MM.DD")})`
                  : currentDate.format("YYYY년 M월")}
                <Icon icon="ph:caret-down" className="w-5 h-5 text-tx-alt" />
              </button>

              <MonthModal
                isOpen={isMonthModalOpen}
                onClose={() => setMonthModalOpen(false)}
                onSelect={(value) => {
                  setSelectedMonth(value);
                  setCurrentDate(dayjs(value));
                  setMonthModalOpen(false);
                }}
                dateList={dateListOptions}
              />
            </div> */}
            <div className="text-base font-semibold text-tx-alt">
              {" "}
              오늘({currentDate.format("YYYY.MM.DD")})
            </div>

            <div className="flex items-center gap-4 text-sm font-medium pr-2 text-tx-neutral">
              <button
                onClick={() => {
                  const newDate = currentDate.subtract(1, "month");
                  setCurrentDate(newDate);
                  setSelectedMonth(newDate.format("YYYY-MM"));
                }}
                className="flex items-center gap-1 transition-colors hover:text-[#151515]"
              >
                <Icon icon="ph:caret-left" className="w-4 h-4" /> 이전달
              </button>

              <div className="w-[1px] h-3 bg-line-alt"></div>

              <button
                onClick={() => {
                  const newDate = currentDate.add(1, "month");
                  setCurrentDate(newDate);
                  setSelectedMonth(newDate.format("YYYY-MM"));
                }}
                disabled={isCurrentMonth} // 💡 이번 달이면 버튼 기능 비활성화
                className={`flex items-center gap-1 transition-colors ${
                  isCurrentMonth
                    ? "text-icon-alt cursor-not-allowed" // 💡 비활성화 시 회색 처리 및 마우스 커서 변경
                    : "hover:text-[#151515]"
                }`}
              >
                다음달 <Icon icon="ph:caret-right" className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-5">
          {keywordList.map((box) => (
            <NewMainKeywordBox
              key={`${box.title}-${box.dateType}`}
              title={box.title}
              dateType={box.dateType}
              categories={box.categories}
              crawledDate={crawledDate}
              dateList={dateListOptions}
            />
          ))}

          {keywordList.length === 0 && (
            <div className="text-sm text-gray-500">표시할 키워드가 없어요.</div>
          )}
        </div>
      </section>

      {audienceType === "adult" && (
        <section className="mt-8">
          <div className="flex items-end gap-2 mb-3">
            <SubTitleBox
              title="플랫폼 내 인기 랭킹"
              label="플랫폼 랭킹"
              infoText="매일 오전 10시, 무신사·W컨셉·네이버 등 주요 패션 플랫폼의 검색어 데이터를 자동 수집하며, 매거진·SNS 언급량 분석을 결합해 월별 종합 랭킹과 최근 주목도가 급상승한 패션 트렌드를 함께 제공합니다."
            />
          </div>
          <div>
            <RankBox />
          </div>
        </section>
      )}
    </div>
  );
}

export default DashBoardPage;
