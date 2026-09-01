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

// 남성 탭 선택 시 fetchAll에서 platform 값에 "_male"을 붙여 보낸다.
// 예전 "어덜트/키즈(잠금)" 토글을 대체한다.
const AUDIENCE_TABS: { type: string; label: string }[] = [
  { type: "female", label: "여성" },
  { type: "male", label: "남성" },
];

// W컨셉은 남성 탭에서는 "_male" 접미사가 아니라 완전히 다른 플랫폼(4910)으로
// 요청한다 — W컨셉 자체가 남성 데이터를 제공하지 않아서, 남성 탭에서는
// 그 자리를 4910이 대신한다.
const MALE_PLATFORM_OVERRIDE: Record<string, string> = {
  wconcept: "4910",
};

// 여성은 7월 데이터부터, 남성은 8월 데이터부터 누적돼서 안내 문구의
// 기준월이 다르다.
const getDataUnavailableNotice = (audienceType: string) => (
  <>
    아직 누적된 분석 데이터가 없어
    <br />
    {audienceType === "male" ? "8월" : "7월"}부터 해당 분석 결과를 제공할 수
    있어요
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
  const prevMonth = currentDate.subtract(1, "month");
  const nextMonth = currentDate.add(1, "month");
  const [isMonthModalOpen, setMonthModalOpen] = useState(false);

  // 여성은 7월, 남성은 8월 분석 데이터부터 누적돼서 이전달 이동/월 선택
  // 모달이 열리지만, 그보다 더 이전달은 아직 없어서 그때만 버튼 바로
  // 아래에 안내 토스트를 보여준다.
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

  // 남성은 8월 데이터부터 쌓이기 시작해서 아직 선택 가능한 이전달이 없다.
  const dateListOptions = audienceType === "male" ? [] : ["2026-07"];

  const goToMonth = (value: string) => {
    setSelectedMonth(value);
    setCurrentDate(dayjs(`${value}-01`));
  };

  const handlePrevMonth = () => {
    const target = currentDate.subtract(1, "month");
    const value = target.format("YYYY-MM");
    if (!dateListOptions.includes(value)) {
      handleDateNavBlocked("prev");
      return;
    }
    goToMonth(value);
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    const target = currentDate.add(1, "month");
    if (target.isSame(dayjs(), "month")) {
      // 실제 이번 달로 돌아오는 경우 — 오늘 날짜 그대로 복귀.
      setSelectedMonth("");
      setCurrentDate(dayjs());
      return;
    }
    goToMonth(target.format("YYYY-MM"));
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 달을 따로 고르지 않았으면(초기 진입) 오늘 날짜를 그대로 보내고,
        // 이전달/다음달 화살표나 모달로 달을 고르면 그 달(YYYY-MM)을 보낸다.
        // 플랫폼 키워드 크롤링이 오전 11시에 끝나서 그 전에는 아직 당일
        // 데이터가 없다 — 자정~11시 사이에는 전날 날짜로 요청한다.
        const now = dayjs();
        const isBeforeCrawlDone = now.hour() < 11;
        const today = (isBeforeCrawlDone ? now.subtract(1, "day") : now).format(
          "YYYY-MM-DD",
        );
        const requestDate =
          selectedMonth && selectedMonth.trim() !== "" ? selectedMonth : today;

        // 남성 탭은 platform 값에 "_male" 접미사를 붙여서 보낸다
        // (naver_male / musinsa_male / wconcept_male).
        const responses = await Promise.all(
          PLATFORMS.map(({ platform, title }) => {
            const requestPlatform =
              audienceType === "male"
                ? (MALE_PLATFORM_OVERRIDE[platform] ?? `${platform}_male`)
                : platform;
            return GetTrendKeyword({
              date: requestDate,
              platform: requestPlatform,
            }).then((res) => ({
              res,
              title,
              platform: requestPlatform,
            }));
          }),
        );

        // 새 응답은 플랫폼당 { items, sourceName, sourceUpdatedAt } 형태의
        // 평평한 top-10 리스트라, 기존 카테고리별 랭킹 박스 UI(NewMainKeywordBox)가
        // 기대하는 categories[].rankings 모양으로 감싸서 넣어준다.
        // change로 순위 상승/하락을 판단: isNew거나 change>0이면 상승, change<0이면
        // 하락, 그 외(0)는 유지로 표시한다(네이버는 컴포넌트에서 자체적으로 숨김).
        // 플랫폼 아이콘은 sourceName(백엔드가 주는 표시용 문구, 요청 종류에 따라
        // 값이 달라질 수 있음)이 아니라 우리가 보낸 platform 키로 고정 매칭한다
        // — sourceName 텍스트가 기대와 다르면 아이콘이 깨져 보이는 문제를 막는다.
        const merged = responses.map(({ res, title, platform }) => {
          // 백엔드가 "네이버(전체)"/"네이버(남성)"처럼 괄호로 구분자를 붙여
          // 내려줘서, 화면에는 그 괄호 부분을 떼고 "네이버"만 보여준다.
          const sourceName = (res?.sourceName || title).replace(
            /\s*\([^)]*\)\s*$/,
            "",
          );
          const items = Array.isArray(res?.items) ? res.items : [];
          const rankings = items.map((item) => ({
            idx: item.rank,
            keyword: item.keyword,
            status: item.isNew || item.change > 0 ? 1 : item.change < 0 ? -1 : 0,
          }));

          return {
            title: sourceName,
            platformKey: platform,
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
  }, [selectedMonth, audienceType]);

  return (
    <div className="w-full h-full px-14">
      <section>
        <div className="flex items-end gap-2 mb-3">
          <SubTitleBox
            title="플랫폼 내 인기 키워드"
            label="플랫폼 검색어"
            infoText="무신사·W컨셉·네이버의 검색어 데이터에 매거진·SNS 언급량 분석을 더해, 주간 종합 랭킹과 최근 주목도가 급상승한 트렌드 키워드를 함께 보여드려요."
          />
        </div>

        <div className="flex items-center justify-between w-full pl-1 mb-4">
          <div className="relative">
            <button
              onClick={() => {
                if (dateListOptions.length === 0) {
                  handleDateNavBlocked("modal");
                  return;
                }
                setMonthModalOpen(true);
              }}
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
                goToMonth(value);
                setMonthModalOpen(false);
              }}
              dateList={dateListOptions}
            />

            {dateNoticeTarget === "modal" && (
              <DateNavNotice>
                {getDataUnavailableNotice(audienceType)}
              </DateNavNotice>
            )}
          </div>

          <div className="flex items-center gap-4 pr-2 text-sm font-medium text-tx-neutral">
            <div className="relative">
              <button
                onClick={handlePrevMonth}
                className="flex items-center gap-1 transition-colors hover:text-[#151515]"
              >
                <Icon icon="ph:caret-left" className="w-4 h-4" />
                {prevMonth.month() + 1}월
              </button>
              {dateNoticeTarget === "prev" && (
                <DateNavNotice>
                  {getDataUnavailableNotice(audienceType)}
                </DateNavNotice>
              )}
            </div>

            <div className="w-[1px] h-3 bg-line-alt"></div>

            <div className="relative">
              <button
                onClick={handleNextMonth}
                disabled={isCurrentMonth} // 💡 이번 달이면 버튼 기능 비활성화
                className={`flex items-center gap-1 transition-colors ${
                  isCurrentMonth
                    ? "text-icon-alt cursor-not-allowed" // 💡 비활성화 시 회색 처리 및 마우스 커서 변경
                    : "hover:text-[#151515]"
                }`}
              >
                {nextMonth.month() + 1}월
                <Icon icon="ph:caret-right" className="w-4 h-4" />
              </button>
              {dateNoticeTarget === "next" && (
                <DateNavNotice>
                  {getDataUnavailableNotice(audienceType)}
                </DateNavNotice>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          {keywordList.map((box) => (
            <NewMainKeywordBox
              key={`${box.title}-${box.dateType}`}
              title={box.title}
              platformKey={box.platformKey}
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

      {/* 여성/남성 탭 — 화면 스크롤해도 계속 보이게 하단 고정. 대시보드에서만 */}
      <div className="fixed bottom-[30px] left-1/2 z-40 -translate-x-1/2 inline-flex items-center rounded-full border border-line-subtle bg-lighten-strong p-0.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
        {AUDIENCE_TABS.map(({ type, label }) => {
          const isSelected = audienceType === type;
          return (
            <button
              key={type}
              onClick={() => setAudienceType(type)}
              className={`box-border flex h-[46px] w-[60px] flex-col items-center justify-center gap-2.5 rounded-full px-3 py-2 text-base font-semibold leading-[1.5] tracking-[-0.08px] transition-colors duration-200 ${
                isSelected
                  ? "bg-fill-primary text-tx-inverse"
                  : "text-tx-neutral"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DashBoardPage;
