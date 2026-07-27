import { GetTrendKeyword } from "@/apis/DashBoardAPI";
import NewMainKeywordBox from "@/components/main/NewMainKeywordBox";

import RankBox from "@/components/main/RankBox";
import SubTitleBox from "@/components/main/SubTitleBox";
import { useTypeStore } from "@/stores/TypeStore";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";
import MonthModal from "@/components/main/modal/MonthModal";
import DateNavNotice from "@/components/main/DateNavNotice";

// 인기 키워드는 이제 플랫폼별로 한 번에 한 곳씩만 요청 가능해서(platform 필수),
// 예전에 한 번의 응답에 다 같이 담겨 오던 플랫폼들을 프론트에서 하나씩 나눠 요청해
// 합친다. 29CM은 원래도 화면에 노출하지 않던 플랫폼이라 요청 대상에서 제외했다.
const PLATFORMS: { platform: string; title: string }[] = [
  { platform: "naver", title: "네이버" },
  { platform: "musinsa", title: "무신사" },
  { platform: "wconcept", title: "W컨셉" },
];

const DATA_UNAVAILABLE_NOTICE = (
  <>
    아직 누적된 분석 데이터가 없어
    <br />
    8월부터 해당 분석 결과를 제공할 수 있어요
  </>
);

function DashBoardPage() {
  const [keywordList, setKeywordList] = useState<any[]>([]);
  const [crawledDate, setCrawledDate] = useState<string | null>(null);
  const { audienceType, selectedMonth, setAudienceType, setSelectedMonth } =
    useTypeStore();

  const [currentDate, setCurrentDate] = useState(dayjs());
  const isToday = currentDate.isSame(dayjs(), "day");
  const isCurrentMonth = currentDate.isSame(dayjs(), "month");
  const [isMonthModalOpen, setMonthModalOpen] = useState(false);

  // 아직 누적된 월간 분석 데이터가 없어서(8월부터 제공 예정) 이전달/날짜
  // 선택은 잠시 막아두고, 누른 버튼 바로 아래에 안내 토스트만 3초간 보여준다.
  const [dateNoticeTarget, setDateNoticeTarget] = useState<
    "modal" | "prev" | "next" | null
  >(null);
  const handleDateNavBlocked = (target: "modal" | "prev" | "next") => {
    setDateNoticeTarget(target);
    setTimeout(
      () => setDateNoticeTarget((t) => (t === target ? null : t)),
      3000,
    );
  };

  const dateListOptions = ["2026-07"];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 달을 따로 고르지 않았으면(초기 진입) 오늘 날짜를 그대로 보내고,
        // 이전달/다음달 화살표나 모달로 달을 고르면 그 달(YYYY-MM)을 보낸다.
        const requestDate =
          selectedMonth && selectedMonth.trim() !== ""
            ? selectedMonth
            : dayjs().format("YYYY-MM-DD");

        const responses = await Promise.all(
          PLATFORMS.map(({ platform, title }) =>
            GetTrendKeyword({ date: requestDate, platform }).then((res) => ({
              res,
              title,
            })),
          ),
        );

        // 새 응답은 플랫폼당 { items, sourceName, sourceUpdatedAt } 형태의
        // 평평한 top-10 리스트라, 기존 카테고리별 랭킹 박스 UI(NewMainKeywordBox)가
        // 기대하는 categories[].rankings 모양으로 감싸서 넣어준다.
        // change로 순위 상승/하락을 판단: isNew거나 change>0이면 상승, change<0이면
        // 하락, 그 외(0)는 유지로 표시한다(네이버는 컴포넌트에서 자체적으로 숨김).
        const merged = responses.map(({ res, title }) => {
          const sourceName = res?.sourceName || title;
          const items = Array.isArray(res?.items) ? res.items : [];
          const rankings = items.map((item) => ({
            idx: item.rank,
            keyword: item.keyword,
            status: item.isNew || item.change > 0 ? 1 : item.change < 0 ? -1 : 0,
          }));

          return {
            title: sourceName,
            dateType: undefined,
            categories: [{ category: sourceName, rankings }],
            date: res?.sourceUpdatedAt ?? null,
          };
        });

        setKeywordList(merged);
        setCrawledDate(merged[0]?.date ?? null);
      } catch {
        setKeywordList([]);
        setCrawledDate(null);
      }
    };

    fetchAll();
  }, [selectedMonth]);

  return (
    <div className="w-full h-full px-14">
      <section>
        <div className="flex items-stretch w-full gap-1 p-1 mt-3 border rounded-lg border-line-alt bg-fill-bg-strong">
          {["adult", "kids"].map((type) => {
            const isSelected = audienceType === type;
            return (
              <button
                key={type}
                onClick={() => type !== "kids" && setAudienceType(type)}
                disabled={type === "kids"}
                className={`flex flex-1 h-9 justify-center items-center gap-[10px] px-3 rounded-md text-[16px] font-semibold leading-[150%] tracking-[-0.08px] transition-colors duration-200 ${
                  isSelected
                    ? "border border-line-neutral bg-fill-bg text-tx-default"
                    : "border border-transparent text-tx-alt cursor-not-allowed"
                }`}
              >
                {type === "adult" ? (
                  "어덜트"
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    키즈
                    <Icon icon="si:lock-duotone" className="w-4 h-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-end gap-2 mb-3">
          <SubTitleBox
            title="플랫폼 내 인기 키워드"
            label="플랫폼 검색어"
            infoText="무신사·W컨셉·네이버의 검색어 데이터에 매거진·SNS 언급량 분석을 더해, 주간 종합 랭킹과 최근 주목도가 급상승한 트렌드 키워드를 함께 보여드려요."
          />
        </div>

        {audienceType === "adult" && (
          <div className="flex items-center justify-between w-full pl-1 mb-4">
            <div className="relative">
              <button
                onClick={() => handleDateNavBlocked("modal")}
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

              {dateNoticeTarget === "modal" && <DateNavNotice>{DATA_UNAVAILABLE_NOTICE}</DateNavNotice>}
            </div>

            <div className="flex items-center gap-4 pr-2 text-sm font-medium text-tx-neutral">
              <div className="relative">
                <button
                  onClick={() => handleDateNavBlocked("prev")}
                  className="flex items-center gap-1 transition-colors hover:text-[#151515]"
                >
                  <Icon icon="ph:caret-left" className="w-4 h-4" /> 이전달
                </button>
                {dateNoticeTarget === "prev" && <DateNavNotice>{DATA_UNAVAILABLE_NOTICE}</DateNavNotice>}
              </div>

              <div className="w-[1px] h-3 bg-line-alt"></div>

              <div className="relative">
                <button
                  onClick={() => handleDateNavBlocked("next")}
                  disabled={isCurrentMonth} // 💡 이번 달이면 버튼 기능 비활성화
                  className={`flex items-center gap-1 transition-colors ${
                    isCurrentMonth
                      ? "text-icon-alt cursor-not-allowed" // 💡 비활성화 시 회색 처리 및 마우스 커서 변경
                      : "hover:text-[#151515]"
                  }`}
                >
                  다음달 <Icon icon="ph:caret-right" className="w-4 h-4" />
                </button>
                {dateNoticeTarget === "next" && <DateNavNotice>{DATA_UNAVAILABLE_NOTICE}</DateNavNotice>}
              </div>
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
              infoText="판매량과 소비자 관심 데이터를 바탕으로 FEDIT만의 자체 로직으로 분석해 현재 트렌드에 부합하는 상품을 매월 선정한 랭킹이에요."
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
