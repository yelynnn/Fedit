import { useState, useEffect, useRef, Fragment } from "react";
import { Icon } from "@iconify/react";
import TrendIndexBoxMock from "../product/TrendIndexBoxMock";
import dayjs from "dayjs";
import MonthModal from "./modal/MonthModal";
import DateNavNotice from "./DateNavNotice";
import { GetTrendRanking, GetTrendSnapshot } from "@/apis/DashBoardAPI";
import type {
  TrendRankingItem,
  TrendRankingPageResponse,
  TrendSnapshotDetailDto,
} from "@/types/Main";
import { useTypeStore } from "@/stores/TypeStore";
import {
  useSubscriptionStore,
  getEffectivePlan,
  isLockedPlan,
} from "@/stores/SubscriptionStore";
import SubscriptionLockOverlay from "@/components/common/SubscriptionLockOverlay";

const PLATFORMS = ["무신사", "29CM", "W컨셉", "플랫폼 통합"];
const CATEGORIES = ["상의", "아우터", "바지", "원피스", "스커트"];
// 남성 탭에는 여성 전용 카테고리를 노출하지 않는다.
const FEMALE_ONLY_CATEGORIES = ["원피스", "스커트"];

// /trend가 받는 platform/category 슬러그.
const PLATFORM_SLUG: Record<string, string> = {
  무신사: "무신사",
  "29CM": "29cm",
  W컨셉: "wconcept",
  "플랫폼 통합": "all",
};

// 잠금 상태(무료체험 미시작/만료)에서는 트렌드 항목 상위 3개까지만 보여준다.
const LOCK_VISIBLE_COUNT = 3;

const DATA_UNAVAILABLE_NOTICE = (
  <>
    아직 누적된 분석 데이터가 없어
    <br />
    8월부터 해당 분석 결과를 제공할 수 있어요
  </>
);

export default function RankBox() {
  const { audienceType } = useTypeStore();
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("무신사");
  const [selectedCategory, setSelectedCategory] = useState<string>("상의");
  const visibleCategories =
    audienceType === "male"
      ? CATEGORIES.filter((category) => !FEMALE_ONLY_CATEGORIES.includes(category))
      : CATEGORIES;
  // 트렌드 지수 고도화 — /trend(랭킹), /trend/{tempItemId}(스냅샷 상세)로
  // 받아온 데이터. 왼쪽 트렌드 항목 리스트와 우측 트렌드 지수 박스를 이걸로 그린다.
  const [testRankingList, setTestRankingList] = useState<TrendRankingItem[]>(
    [],
  );
  const [activeTempItemId, setActiveTempItemId] = useState<number | null>(null);
  const [snapshotDetail, setSnapshotDetail] =
    useState<TrendSnapshotDetailDto | null>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const trendListRef = useRef<HTMLUListElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [showThumb, setShowThumb] = useState(false);
  const TREND_THUMB_HEIGHT = 100;
  const subscription = useSubscriptionStore((s) => s.subscription);
  const subscriptionLoaded = useSubscriptionStore((s) => s.loaded);
  const isLocked =
    subscriptionLoaded && isLockedPlan(getEffectivePlan(subscription));
  const isCurrentMonth = currentDate.isSame(dayjs(), "month");
  const MOCK_DATE_LIST = ["2026-01", "2026-02"];

  const updateTrendThumb = () => {
    const el = trendListRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setShowThumb(false);
      return;
    }
    setShowThumb(true);
    const maxThumbTop = Math.max(clientHeight - TREND_THUMB_HEIGHT, 0);
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    setThumbTop(Math.min(maxThumbTop, Math.max(0, scrollRatio * maxThumbTop)));
  };

  useEffect(() => {
    updateTrendThumb();
  }, [testRankingList]);

  // 남성 탭에선 여성 전용 카테고리가 안 보이니, 그 상태로 남성으로 넘어오면
  // 기본 카테고리로 되돌린다.
  useEffect(() => {
    if (
      audienceType === "male" &&
      FEMALE_ONLY_CATEGORIES.includes(selectedCategory)
    ) {
      setSelectedCategory("상의");
    }
  }, [audienceType, selectedCategory]);

  useEffect(() => {
    if (detailPanelRef.current) detailPanelRef.current.scrollTop = 0;
  }, [activeTempItemId]);

  // 트렌드 지수 고도화 — 왼쪽 트렌드 항목 리스트를 /trend로 받아온다. trend_score
  // 내림차순으로 정렬한 뒤 position을 1부터 다시 매긴다. gender는 남성 탭일 때만
  // "남성"으로 넘긴다 — 현재 남성 외에는(여성 포함) gender 값 자체가 없다.
  useEffect(() => {
    const platform = PLATFORM_SLUG[selectedPlatform] ?? selectedPlatform;
    // 일단 date 없이 보내서 백엔드가 최신 점수값을 주도록 확인해본다.
    const gender = audienceType === "male" ? "남성" : undefined;

    GetTrendRanking({
      platform,
      category: selectedCategory,
      page: 0,
      size: 20,
      gender,
    })
      .then((res: TrendRankingPageResponse) => {
        const sorted = (res.content ?? [])
          .slice()
          .sort((a, b) => b.trend_score - a.trend_score)
          .map((item, index) => ({ ...item, position: index + 1 }));
        setTestRankingList(sorted);
        setActiveTempItemId(sorted[0]?.temp_item_id ?? null);
      })
      .catch(() => {
        setTestRankingList([]);
        setActiveTempItemId(null);
      });
  }, [selectedPlatform, selectedCategory, currentDate, audienceType]);

  // 트렌드 지수 고도화 — 선택된 항목의 트렌드 지수 상세를
  // /trend/{tempItemId}로 받아온다. date를 안 넘기면 최신 스냅샷을 준다.
  useEffect(() => {
    if (activeTempItemId == null) {
      setSnapshotDetail(null);
      return;
    }
    setIsSnapshotLoading(true);
    GetTrendSnapshot(activeTempItemId)
      .then(setSnapshotDetail)
      .catch(() => setSnapshotDetail(null))
      .finally(() => setIsSnapshotLoading(false));
  }, [activeTempItemId]);

  const handleMonthSelect = (value: string) => {
    setCurrentDate(dayjs(`${value}-01`));
    setIsMonthModalOpen(false);
  };

  const prevMonth = currentDate.subtract(1, "month");
  const nextMonth = currentDate.add(1, "month");

  // 아직 누적된 월간 분석 데이터가 없어서(8월부터 제공 예정) 이전달 이동은
  // 잠시 막아두고, 누른 버튼 바로 아래에 안내 토스트만 3초간 보여준다.
  const [dateNoticeTarget, setDateNoticeTarget] = useState<
    "prev" | "next" | null
  >(null);
  const handleDateNavBlocked = (target: "prev" | "next") => {
    setDateNoticeTarget(target);
    setTimeout(
      () => setDateNoticeTarget((t) => (t === target ? null : t)),
      3000,
    );
  };

  return (
    <div className="relative w-full min-h-screen mx-auto overflow-hidden">
      <div className="flex items-center mb-4">
        <div className="text-base font-semibold text-tx-alt">
          {" "}
          이번 달({currentDate.format("YYYY.MM")})
        </div>
        <div className="flex items-center gap-4 ml-auto text-sm font-medium text-tx-neutral">
          {" "}
          <div className="relative">
            <button
              onClick={() => handleDateNavBlocked("prev")}
              className="flex items-center gap-1 transition-colors hover:text-[#151515]"
            >
              <Icon icon="ph:caret-left" />
              {prevMonth.month() + 1}월
            </button>
            {dateNoticeTarget === "prev" && (
              <DateNavNotice>{DATA_UNAVAILABLE_NOTICE}</DateNavNotice>
            )}
          </div>
          <div className="w-[1px] h-3 bg-gray-300"></div>
          <div className="relative">
            <button
              onClick={() => handleDateNavBlocked("next")}
              disabled={isCurrentMonth}
              className={`flex items-center gap-1 transition-colors ${
                isCurrentMonth
                  ? "text-icon-alt cursor-not-allowed"
                  : "hover:text-[#151515]"
              }`}
            >
              {nextMonth.month() + 1}월
              <Icon icon="ph:caret-right" />
            </button>
            {dateNoticeTarget === "next" && (
              <DateNavNotice>{DATA_UNAVAILABLE_NOTICE}</DateNavNotice>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {PLATFORMS.map((platform) => (
            <Fragment key={platform}>
              {platform === "플랫폼 통합" && (
                <div className="w-[2px] h-5 bg-[#E4E4E4]" />
              )}
              <button
                onClick={() => setSelectedPlatform(platform)}
                className={`flex h-[38px] justify-center items-center gap-2 px-3 py-2 rounded-md text-[16px] font-medium leading-[150%] tracking-[-0.08px] transition-colors ${
                  selectedPlatform === platform
                    ? "bg-fill-primary text-white"
                    : "bg-white text-tx-neutral border border-line-alt hover:bg-gray-50"
                }`}
              >
                {platform}
              </button>
            </Fragment>
          ))}
        </div>

        <div className="flex items-center gap-[4px] p-1 bg-fill-bg-strong border border-line-alt rounded-full">
          {visibleCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex justify-center items-center gap-0.5 px-5 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-white text-black font-semibold border border-gray-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex bg-white border border-gray-200 rounded-[24px] overflow-hidden h-[620px] shadow-sm">
        <div className="flex flex-col flex-shrink-0 border-r border-gray-200 w-85">
          <div className="flex items-center justify-center text-sm font-semibold text-center text-[#6F7173] border-b border-gray-200 h-9">
            트렌드 항목
          </div>
          <div className="relative flex-1 overflow-hidden">
            <ul
              ref={trendListRef}
              onScroll={updateTrendThumb}
              className={`h-full hide-scrollbar ${isLocked ? "overflow-hidden" : "overflow-y-auto"}`}
            >
              {testRankingList.map((item, index) => {
                const isActive = activeTempItemId === item.temp_item_id;
                const isHidden = isLocked && index >= LOCK_VISIBLE_COUNT;
                return (
                  <li
                    key={item.temp_item_id}
                    onClick={() =>
                      !isHidden && setActiveTempItemId(item.temp_item_id)
                    }
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                      isActive
                        ? "border-b border-[#E4E4E4] bg-[#F4FFEE]"
                        : "border-b border-gray-100 hover:bg-gray-50"
                    } ${isHidden ? "pointer-events-none select-none" : ""}`}
                    style={
                      isHidden
                        ? { opacity: 0.5, filter: "blur(3px)" }
                        : undefined
                    }
                  >
                    <div className="relative flex-shrink-0 w-18 h-18">
                      <img
                        src={item.thumbnail}
                        alt={item.product_name}
                        className="object-cover w-full h-full border border-gray-200 rounded-sm"
                      />
                      <div className="absolute top-0 left-0 flex items-center justify-center w-[19px] h-[19px] bg-[#242628] rounded text-[12px] font-medium leading-[133%] text-white">
                        {item.position}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="overflow-hidden text-[12px] font-medium leading-[133%] text-[#6F7173] text-ellipsis truncate">
                        {item.brand}
                      </span>
                      <span className="overflow-hidden text-[14px] font-semibold leading-[143%] tracking-[-0.07px] text-[#3D3F41] text-ellipsis line-clamp-2">
                        {item.product_name}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {showThumb && !isLocked && (
              <div
                className="absolute pointer-events-none right-1 rounded-xl"
                style={{
                  width: 8,
                  height: TREND_THUMB_HEIGHT,
                  top: thumbTop,
                  background: "rgba(11, 14, 15, 0.08)",
                }}
              />
            )}
          </div>
        </div>

        <div
          ref={detailPanelRef}
          className={`relative flex-1 py-3 px-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isLocked ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          {isLocked && <SubscriptionLockOverlay />}

          <div
            className={isLocked ? "pointer-events-none select-none" : ""}
            style={isLocked ? { opacity: 0.5, filter: "blur(3px)" } : undefined}
          >
            {snapshotDetail && (
              <div className="mb-3 overflow-hidden">
                <span className="block overflow-hidden text-xs font-medium text-tx-alt text-ellipsis truncate">
                  {snapshotDetail.brand}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="min-w-0 overflow-hidden text-sm font-semibold text-tx-strong text-ellipsis truncate">
                    {snapshotDetail.product_name}
                  </span>
                  {snapshotDetail.product_detail_url && (
                    <a
                      href={snapshotDetail.product_detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors rounded-lg shrink-0 text-tx-alt bg-fill-bg-strong hover:text-tx-neutral"
                    >
                      상세페이지
                      <Icon icon="lucide:external-link" className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
            <div className="px-8 mb-4 -mx-8">
              <TrendIndexBoxMock
                data={snapshotDetail}
                isLoading={isSnapshotLoading}
              />
            </div>
          </div>
        </div>
      </div>
      <MonthModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        onSelect={handleMonthSelect}
        dateList={MOCK_DATE_LIST}
      />
    </div>
  );
}
