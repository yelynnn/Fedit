import { useState, useEffect, useRef, Fragment } from "react";
import { Icon } from "@iconify/react";
import TrendIndexBoxMock from "../product/TrendIndexBoxMock";
import AIAnalysisBox from "../product/AIAnalysisBox";
import RankSimilarBox from "./RankSimilarBox";
import dayjs from "dayjs";
import MonthModal from "./modal/MonthModal";
import DateNavNotice from "./DateNavNotice";

// assets/etc/arrow_left·right.svg의 path만 그대로 가져오되 fill을 고정값
// (#3D3F41) 대신 currentColor로 바꿔 인라인 렌더한다 — <img>나 mask-image로
// 쓰면 파일에 박힌 고정 fill 때문에 활성/비활성 색을 못 바꾼다.
const ARROW_LEFT_PATH =
  "M9.73075 11.9998L13.804 16.0728C13.9423 16.2113 14.0132 16.3853 14.0165 16.595C14.0197 16.8045 13.9488 16.9818 13.804 17.1268C13.659 17.2716 13.4833 17.344 13.277 17.344C13.0707 17.344 12.895 17.2716 12.75 17.1268L8.25575 12.6325C8.16225 12.5388 8.09625 12.4401 8.05775 12.3363C8.01925 12.2324 8 12.1203 8 11.9998C8 11.8793 8.01925 11.7671 8.05775 11.6633C8.09625 11.5594 8.16225 11.4607 8.25575 11.367L12.75 6.87276C12.8885 6.73442 13.0626 6.66359 13.2722 6.66026C13.4817 6.65709 13.659 6.72792 13.804 6.87276C13.9488 7.01776 14.0213 7.19342 14.0213 7.39976C14.0213 7.60609 13.9488 7.78176 13.804 7.92676L9.73075 11.9998Z";
const ARROW_RIGHT_PATH =
  "M14.2905 11.9995L10.2173 7.92652C10.0789 7.78802 10.0081 7.61394 10.0048 7.40427C10.0016 7.19477 10.0724 7.01752 10.2173 6.87252C10.3623 6.72769 10.5379 6.65527 10.7442 6.65527C10.9506 6.65527 11.1262 6.72769 11.2712 6.87252L15.7655 11.3668C15.859 11.4604 15.925 11.5592 15.9635 11.663C16.002 11.7669 16.0213 11.879 16.0213 11.9995C16.0213 12.12 16.002 12.2322 15.9635 12.336C15.925 12.4399 15.859 12.5386 15.7655 12.6323L11.2712 17.1265C11.1327 17.2649 10.9587 17.3357 10.749 17.339C10.5395 17.3422 10.3623 17.2714 10.2173 17.1265C10.0724 16.9815 10 16.8059 10 16.5995C10 16.3932 10.0724 16.2175 10.2173 16.0725L14.2905 11.9995Z";

function NavArrowIcon({
  direction,
  disabled,
}: {
  direction: "left" | "right";
  disabled?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={`h-6 w-6 shrink-0 ${disabled ? "text-icon-alt" : "text-icon-default"}`}
    >
      <path
        d={direction === "left" ? ARROW_LEFT_PATH : ARROW_RIGHT_PATH}
        fill="currentColor"
      />
    </svg>
  );
}
import { GetTrendRanking, GetTrendSnapshot } from "@/apis/DashBoardAPI";
import type {
  TrendRankingItem,
  TrendRankingPageResponse,
  TrendSnapshotDetailDto,
} from "@/types/Main";
import { useProductStore } from "@/stores/ProductStore";
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
  const { setModalTrendSnapshot } = useProductStore((s) => s);
  const { audienceType } = useTypeStore();
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("무신사");
  const [selectedCategory, setSelectedCategory] = useState<string>("상의");
  const visibleCategories =
    audienceType === "male"
      ? CATEGORIES.filter(
          (category) => !FEMALE_ONLY_CATEGORIES.includes(category),
        )
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
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsMonthModalOpen(true)}
          className="flex items-center gap-1.5 text-base font-semibold text-tx-alt hover:opacity-80 transition-opacity"
        >
          {isCurrentMonth
            ? `오늘(${currentDate.format("YYYY.MM.DD")})`
            : currentDate.format("YYYY년 M월")}
          <Icon icon="ph:caret-down" className="w-5 h-5 text-tx-alt" />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDateNavBlocked("prev")}
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center gap-2.5 rounded-full border border-line-alt bg-white p-1 transition-colors hover:bg-fill-bg-strong"
            >
              <NavArrowIcon direction="left" />
            </button>
            {dateNoticeTarget === "prev" && (
              <DateNavNotice>{DATA_UNAVAILABLE_NOTICE}</DateNavNotice>
            )}
          </div>

          <span className="flex h-[34px] items-center justify-center gap-2 rounded-full border border-line-alt bg-white px-3 py-2 text-sm font-medium leading-[1.43] tracking-[-0.07px] text-tx-neutral">
            {isCurrentMonth ? "이번달" : `${currentDate.month() + 1}월`}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => handleDateNavBlocked("next")}
              disabled={isCurrentMonth}
              className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center gap-2.5 rounded-full border border-line-alt bg-white p-1 transition-colors ${
                isCurrentMonth ? "cursor-not-allowed" : "hover:bg-fill-bg-strong"
              }`}
            >
              <NavArrowIcon direction="right" disabled={isCurrentMonth} />
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
            <div className="px-8 mb-4 -mx-8">
              <TrendIndexBoxMock
                data={snapshotDetail}
                isLoading={isSnapshotLoading}
              />
            </div>

            {snapshotDetail && (
              <>
                <AIAnalysisBox
                  content={snapshotDetail.vlm?.ai_description ?? ""}
                  itemcode={String(activeTempItemId ?? "")}
                  isRanking={true}
                  onDetailClick={() => setModalTrendSnapshot(snapshotDetail)}
                />
                <RankSimilarBox tempItemId={activeTempItemId} />
              </>
            )}
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
