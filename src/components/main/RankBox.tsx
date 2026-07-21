import { useState, useEffect, useRef, Fragment } from "react";
import { Icon } from "@iconify/react";
import TrendIndexBox from "../product/TrendIndexBox";
import dayjs from "dayjs";
import AIAnalysisBox from "../product/AIAnalysisBox";
import MonthModal from "./modal/MonthModal";
import { GetDashboardRanking, GetRankingItemDetail } from "@/apis/DashBoardAPI";
import type { RankingProduct, RankingItemDetailResponse } from "@/types/Main";
import { useProductStore } from "@/stores/ProductStore";

const PLATFORMS = ["무신사", "29CM", "W컨셉", "플랫폼 통합"];
const CATEGORIES = ["상의", "아우터", "바지", "원피스/스커트"];

const toApiDate = (date: dayjs.Dayjs) => date.format("YYYY-MM");

export default function RankBox() {
  const { setModalProductId } = useProductStore((s) => s);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("무신사");
  const [selectedCategory, setSelectedCategory] = useState<string>("상의");
  const [activeRank, setActiveRank] = useState<number>(1);
  const [rankingList, setRankingList] = useState<RankingProduct[]>([]);
  const [itemDetail, setItemDetail] =
    useState<RankingItemDetailResponse | null>(null);
  const [similarCurrentPage, setSimilarCurrentPage] = useState(1);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const trendListRef = useRef<HTMLUListElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [showThumb, setShowThumb] = useState(false);
  const TREND_THUMB_HEIGHT = 100;
  const isCurrentMonth = currentDate.isSame(dayjs(), "month");
  const ITEMS_PER_PAGE = 6;
  const relatedItems = itemDetail?.related_items ?? [];
  const totalPages = Math.ceil(relatedItems.length / ITEMS_PER_PAGE);

  const currentSimilarItems = relatedItems.slice(
    (similarCurrentPage - 1) * ITEMS_PER_PAGE,
    similarCurrentPage * ITEMS_PER_PAGE,
  );
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
  }, [rankingList]);

  useEffect(() => {
    const activeItem = rankingList.find((item) => item.rank === activeRank);
    if (!activeItem) return;
    setSimilarCurrentPage(1);
    setIsDetailLoading(true);
    GetRankingItemDetail(activeItem.itemcode)
      .then(setItemDetail)
      .catch(() => {})
      .finally(() => setIsDetailLoading(false));
  }, [activeRank, rankingList]);

  useEffect(() => {
    if (detailPanelRef.current) detailPanelRef.current.scrollTop = 0;
  }, [activeRank]);

  useEffect(() => {
    GetDashboardRanking({
      platform: selectedPlatform,
      category: selectedCategory,
      date: toApiDate(currentDate),
    })
      .then((res) => {
        const result = res.rankData?.rankData?.result ?? [];
        setRankingList(result);
        setActiveRank(result[0]?.rank ?? 1);
      })
      .catch(() => {});
  }, [selectedPlatform, selectedCategory, currentDate]);

  const handleMonthSelect = (value: string) => {
    setCurrentDate(dayjs(`${value}-01`));
    setIsMonthModalOpen(false);
  };

  const handlePrevPage = () => {
    if (similarCurrentPage > 1) setSimilarCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (similarCurrentPage < totalPages)
      setSimilarCurrentPage((prev) => prev + 1);
  };

  const handlePrevMonth = () =>
    setCurrentDate(currentDate.subtract(1, "month"));
  const handleNextMonth = () => setCurrentDate(currentDate.add(1, "month"));

  const prevMonth = currentDate.subtract(1, "month");
  const nextMonth = currentDate.add(1, "month");

  return (
    <div className="relative w-full min-h-screen mx-auto overflow-hidden">
      <div className="flex items-center mb-4">
        {/* <button
          onClick={() => setIsMonthModalOpen(true)}
          className="flex items-center gap-1.5 text-base font-semibold text-tx-alt hover:text-tx-default transition-colors"
        >
          {isCurrentMonth
            ? `이번 달(${currentDate.format("YYYY.MM")})`
            : currentDate.format("YYYY년 M월")}
          <Icon icon="ph:caret-down" className="w-4 h-4 text-gray-500" />
        </button> */}
        <div className="text-base font-semibold text-tx-alt">
          {" "}
          이번 달({currentDate.format("YYYY.MM")})
        </div>
        <div className="flex items-center gap-4 ml-auto text-sm font-medium text-tx-neutral">
          {" "}
          <button
            onClick={handlePrevMonth}
            className="flex items-center gap-1 transition-colors hover:text-[#151515]"
          >
            <Icon icon="ph:caret-left" />
            {prevMonth.month() + 1}월
          </button>
          <div className="w-[1px] h-3 bg-gray-300"></div>
          <button
            onClick={handleNextMonth}
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
          {CATEGORIES.map((category) => (
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

      <div className="flex bg-white border border-gray-200 rounded-[24px] overflow-hidden h-[757px] shadow-sm">
        <div className="flex flex-col flex-shrink-0 border-r border-gray-200 w-85">
          <div className="flex items-center justify-center text-sm font-semibold text-center text-[#6F7173] border-b border-gray-200 h-9">
            트렌드 항목
          </div>
          <div className="relative flex-1 overflow-hidden">
            <ul
              ref={trendListRef}
              onScroll={updateTrendThumb}
              className="h-full overflow-y-auto hide-scrollbar"
            >
              {rankingList.map((item, index) => {
                const isActive = activeRank === item.rank;
                return (
                  <li
                    key={item.itemcode}
                    onClick={() => setActiveRank(item.rank)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                      isActive
                        ? "border-b border-[#E4E4E4] bg-[#F4FFEE]"
                        : "border-b border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative flex-shrink-0 w-18 h-18">
                      <img
                        src={item.thumbnail}
                        alt={item.product_name}
                        className="object-cover w-full h-full border border-gray-200 rounded-sm"
                      />
                      <div className="absolute top-0 left-0 flex items-center justify-center w-[19px] h-[19px] bg-[#242628] rounded text-[12px] font-medium leading-[133%] text-white">
                        {index + 1}
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
            {showThumb && (
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
          className="relative flex-1 py-3 px-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {isDetailLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[2px]">
              <div className="border-2 border-gray-200 rounded-full w-7 h-7 border-t-gray-700 animate-spin" />
              <span className="text-sm text-gray-500">불러오는 중...</span>
            </div>
          )}

          <div className="px-8 mb-4 -mx-8">
            <TrendIndexBox
              itemCode={
                rankingList.find((item) => item.rank === activeRank)
                  ?.itemcode ?? ""
              }
            />
          </div>

          <AIAnalysisBox
            content={itemDetail?.ai_description ?? ""}
            itemcode={
              rankingList.find((item) => item.rank === activeRank)?.itemcode ??
              ""
            }
            isRanking={true}
            onDetailClick={() => {
              const itemcode = rankingList.find(
                (item) => item.rank === activeRank,
              )?.itemcode;
              if (itemcode) setModalProductId(itemcode);
            }}
          />

          <div>
            <div className="flex items-center gap-1.5 mt-8 mb-4">
              <Icon
                icon="tabler:capture-filled"
                className="w-5 h-5 text-gray-700"
              />
              <h3 className="text-base font-semibold text-gray-800">
                디테일 유사 아이템
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {currentSimilarItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setModalProductId(item.itemCode)}
                  className="flex gap-4 cursor-pointer"
                >
                  <div className="flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200 rounded-lg w-22 h-22">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.product_name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-1.5">
                    <span className="overflow-hidden text-[12px] font-medium leading-[133%] text-[#6F7173] text-ellipsis truncate">
                      {item.brand}
                    </span>
                    <span className="overflow-hidden text-[14px] font-semibold leading-[143%] tracking-[-0.07px] text-[#3D3F41] text-ellipsis line-clamp-2">
                      {item.product_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={similarCurrentPage === 1}
                  className={`flex items-center justify-center w-8 h-8 transition-colors border border-gray-200 rounded-full ${
                    similarCurrentPage === 1
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-gray-800 hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  <Icon icon="ph:caret-left" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={similarCurrentPage === totalPages}
                  className={`flex items-center justify-center w-8 h-8 transition-colors border border-gray-200 rounded-full ${
                    similarCurrentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-gray-800 hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  <Icon icon="ph:caret-right" />
                </button>
              </div>
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
