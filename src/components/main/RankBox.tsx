import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import TrendIndexBox from "../product/TrendIndexBox";
import dayjs from "dayjs";
import AIAnalysisBox from "../product/AIAnalysisBox";
import WeekModal from "./modal/WeekModal";
import { GetDashboardRanking, GetRankingItemDetail } from "@/apis/DashBoardAPI";
import type { RankingProduct, RankingItemDetailResponse } from "@/types/Main";

const PLATFORMS = ["무신사", "29CM", "W컨셉", "플랫폼 통합"];
const CATEGORIES = ["상의", "아우터", "바지", "원피스/스커트"];

const getWeekOfMonth = (date: dayjs.Dayjs) => {
  const firstDayOfMonth = date.startOf("month").day();
  return Math.ceil((date.date() + firstDayOfMonth) / 7);
};

const toApiDate = (date: dayjs.Dayjs) => {
  const year = date.year();
  const month = String(date.month() + 1).padStart(2, "0");
  const week = String(getWeekOfMonth(date)).padStart(2, "0");
  return `${year}-${month}-w${week}`;
};

export default function RankBox() {
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("무신사");
  const [selectedCategory, setSelectedCategory] = useState<string>("상의");
  const [activeRank, setActiveRank] = useState<number>(1);
  const [rankingList, setRankingList] = useState<RankingProduct[]>([]);
  const [itemDetail, setItemDetail] =
    useState<RankingItemDetailResponse | null>(null);
  const [similarCurrentPage, setSimilarCurrentPage] = useState(1);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const isCurrentWeek = currentDate.isSame(dayjs(), "week");
  const ITEMS_PER_PAGE = 4;
  const relatedItems = itemDetail?.related_items ?? [];
  const totalPages = Math.ceil(relatedItems.length / ITEMS_PER_PAGE);

  const currentSimilarItems = relatedItems.slice(
    (similarCurrentPage - 1) * ITEMS_PER_PAGE,
    similarCurrentPage * ITEMS_PER_PAGE,
  );
  const MOCK_DATE_LIST = ["2026-01", "2026-02"];

  useEffect(() => {
    const activeItem = rankingList.find((item) => item.rank === activeRank);
    if (!activeItem) return;
    setSimilarCurrentPage(1);
    setIsDetailLoading(true);
    GetRankingItemDetail(activeItem.itemcode)
      .then(setItemDetail)
      .catch(console.error)
      .finally(() => setIsDetailLoading(false));
  }, [activeRank, rankingList]);

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
      .catch(console.error);
  }, [selectedPlatform, selectedCategory, currentDate]);

  const handleWeekSelect = (year: number, month: number, week: number) => {
    let newDate = dayjs(`${year}-${month}-01`);

    const firstDayOfMonth = newDate.startOf("month").day();
    const daysToAdd = (week - 1) * 7 - firstDayOfMonth + 1;
    newDate = newDate.add(daysToAdd > 0 ? daysToAdd : 0, "day");

    setCurrentDate(newDate);
    setIsWeekModalOpen(false);
  };

  const handlePrevPage = () => {
    if (similarCurrentPage > 1) setSimilarCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (similarCurrentPage < totalPages)
      setSimilarCurrentPage((prev) => prev + 1);
  };

  const handlePrevWeek = () => setCurrentDate(currentDate.subtract(1, "week"));
  const handleNextWeek = () => setCurrentDate(currentDate.add(1, "week"));

  const getWeekOfMonth = (date: dayjs.Dayjs) => {
    const firstDayOfMonth = date.startOf("month").day();
    return Math.ceil((date.date() + firstDayOfMonth) / 7);
  };

  const prevWeek = currentDate.subtract(1, "week");
  const nextWeek = currentDate.add(1, "week");

  return (
    <div className="relative w-full min-h-screen mx-auto overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsWeekModalOpen(true)}
          className="flex items-center gap-1.5 text-base font-semibold text-[#6F7173] hover:text-[#212121] transition-colors"
        >
          {currentDate.isSame(dayjs(), "week")
            ? `이번 주(${currentDate.month() + 1}월 ${getWeekOfMonth(currentDate)}주차)`
            : `${currentDate.month() + 1}월 ${getWeekOfMonth(currentDate)}주차`}
          <Icon icon="ph:caret-down" className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex items-center gap-4 text-sm font-medium text-[#3D3F41]">
          <button
            onClick={handlePrevWeek}
            className="flex items-center gap-1 transition-colors hover:text-[#151515]"
          >
            <Icon icon="ph:caret-left" />
            {prevWeek.month() + 1}월 {getWeekOfMonth(prevWeek)}주차
          </button>

          <div className="w-[1px] h-3 bg-gray-300"></div>

          <button
            onClick={handleNextWeek}
            disabled={isCurrentWeek}
            className={`flex items-center gap-1 transition-colors ${
              isCurrentWeek
                ? "text-[#ADB5BD] cursor-not-allowed"
                : "hover:text-[#151515]"
            }`}
          >
            {nextWeek.month() + 1}월 {getWeekOfMonth(nextWeek)}주차
            <Icon icon="ph:caret-right" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                selectedPlatform === platform
                  ? "bg-[#212121] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-[#F9FAFB] border border-gray-200 rounded-full">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-white text-black font-semibold border border-gray-200 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex bg-white border border-gray-200 rounded-[24px] overflow-hidden h-[650px] shadow-sm">
        <div className="flex flex-col flex-shrink-0 border-r border-gray-200 w-85">
          <div className="py-4 text-sm font-bold text-center text-gray-700 border-b border-gray-200">
            트렌드 항목
          </div>
          <ul className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {rankingList.map((item, index) => {
              const isActive = activeRank === item.rank;
              return (
                <li
                  key={item.itemcode}
                  onClick={() => setActiveRank(item.rank)}
                  className={`flex items-start gap-3 p-2 border-b border-gray-100 cursor-pointer transition-colors ${
                    isActive ? "bg-[#F8F9FA]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative flex-shrink-0 w-18 h-18">
                    <img
                      src={item.thumbnail}
                      alt={item.product_name}
                      className="object-cover w-full h-full border border-gray-200 rounded-md"
                    />
                    <div className="absolute top-1 left-1 flex items-center justify-center w-3 h-3 bg-white rounded text-[10px] font-normal text-gray-800">
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-xs text-gray-500 truncate">
                      {item.brand}
                    </span>
                    <span className="text-sm font-medium leading-tight text-gray-800 line-clamp-2">
                      {item.product_name}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex-1 p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isDetailLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[2px]">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">불러오는 중...</span>
            </div>
          )}

          <div className="px-8 mb-6 -mx-8">
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
              rankingList.find((item) => item.rank === activeRank)?.itemcode ?? ""
            }
            isRanking={true}
          />

          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Icon
                icon="tabler:capture-filled"
                className="w-5 h-5 text-gray-700"
              />
              <h3 className="text-base font-bold text-gray-800">
                디테일 유사 아이템
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-5">
              {currentSimilarItems.map((item, idx) => (
                <div key={idx} className="flex gap-4">
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
                    <span className="text-xs text-gray-500">{item.brand}</span>
                    <span className="text-sm font-medium text-gray-800 line-clamp-2">
                      {item.product_name}
                    </span>
                    {item.details.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {item.details.map((detail, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-1 bg-[#E7F0FF] text-[#1A75FF] text-[11px] font-semibold rounded"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-3">
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
      <WeekModal
        isOpen={isWeekModalOpen}
        onClose={() => setIsWeekModalOpen(false)}
        onSelect={handleWeekSelect}
        dateList={MOCK_DATE_LIST}
      />
    </div>
  );
}
