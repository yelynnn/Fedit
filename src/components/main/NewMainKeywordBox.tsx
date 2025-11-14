import { useState } from "react";
import { Icon } from "@iconify/react";
import { useTypeStore } from "@/stores/TypeStore";
import naverIcon from "@/assets/naverIcon.png";
import musinsaIcon from "@/assets/musinsaIcon.png";
import wconceptIcon from "@/assets/wconceptIcon.png";
import MonthModal from "./MonthModal";

function getImageByTitle(title: string) {
  switch (title) {
    case "네이버":
      return naverIcon;
    case "무신사":
    case "무신사 키즈":
      return musinsaIcon;
    case "W컨셉":
      return wconceptIcon;
    default:
      return "";
  }
}

interface CategoryBlock {
  category: string;
  rankings: { idx: number; keyword: string; status: number }[];
}

interface BrandBoxProps {
  title: string;
  dateType?: string;
  dateList?: string[];
  categories?: CategoryBlock[];
  keywords?: { idx: number; keyword: string; status: number }[];
  crawledDate?: string | null;
}

function NewMainKeywordBox({
  title,
  dateType,
  dateList = [],
  categories = [],
}: BrandBoxProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { audienceType, selectedMonth, setSelectedMonth } = useTypeStore();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0]?.category ?? ""
  );

  const isMonthly = dateType === "monthly";
  const currentCategory =
    categories.find((c) => c.category === selectedCategory) || categories[0];
  const rankings = currentCategory?.rankings || [];

  const formatMonth = (val: string) => {
    const [year, month] = val.split("-");
    return `${year}년 ${parseInt(month)}월`;
  };

  const chunkedRankings = isMonthly
    ? Array.from({ length: 3 }, (_, i) => rankings.slice(i * 10, i * 10 + 10))
    : [rankings.slice(0, 10)];

  return (
    <section
      className={`box-border pt-4 pb-2 rounded-xl bg-white shadow border border-[#ECEEF0] ${
        isMonthly ? "w-[880px]" : "w-[430px]"
      }`}
    >
      <header className="flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-3">
          <img
            src={getImageByTitle(title)}
            alt={title}
            className="object-contain w-6 h-6"
          />
          <h3 className="text-base font-semibold leading-6">{title} 키워드</h3>
        </div>

        {isMonthly && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#3D3F41] font-semibold">
              {title} 월간 랭킹
            </p>

            <div
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 cursor-pointer select-none"
            >
              <span className="text-base font-semibold text-[#3D3F41]">
                {formatMonth(selectedMonth)}
              </span>
              <Icon
                icon="mingcute:down-fill"
                className="w-4 h-4 text-[#3D3F41]"
              />
            </div>

            <MonthModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSelect={(value) => setSelectedMonth(value)}
              dateList={dateList}
            />
          </div>
        )}
      </header>

      {isMonthly && (
        <div className="flex pt-2 items-center gap-6 w-full bg-[#F6F8FA] border-b border-[#E5E7EB] mb-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`relative pb-2 text-base font-semibold transition-colors duration-200 
          ${
            selectedCategory === cat.category
              ? "text-[#56585A] after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-[#56585A]"
              : "text-[#6F7173]"
          }`}
            >
              {cat.category}
            </button>
          ))}
        </div>
      )}
      {audienceType === "kids" && !isMonthly && (
        <div className="flex text-[#3D3F41] text-sm font-semibold py-3 justify-center items-center gap-6 w-full bg-[#F6F8FA] border-b border-[#E5E7EB] mb-5 px-5">
          출산육아 / 키즈 키워드
        </div>
      )}

      <div
        className={`px-5 flex ${
          isMonthly ? "flex-row gap-5 justify-between" : "flex-col"
        }`}
      >
        {chunkedRankings.map((column, colIdx) => (
          <div key={colIdx} className="flex flex-col w-full ">
            {column.map((item) => {
              const match = item.keyword.match(/^\[(.*?)\]\s*(.*)$/);
              const brand = match ? match[1] : "";
              const keywordText = match ? match[2] : item.keyword;

              return (
                <div
                  key={item.idx}
                  onMouseEnter={() => setHoveredIdx(item.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`relative flex items-center justify-center px-2 rounded-lg hover:bg-[#EAF2FE] transition-colors duration-150 ${
                    isMonthly ? "h-14 mb-1" : "py-2"
                  }`}
                >
                  {isMonthly && hoveredIdx === item.idx && (
                    <div
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-3
                      bg-[#242628] text-white px-3 py-[6px] rounded-lg shadow-lg
                      min-w-max max-w-50 whitespace-normal break-words z-50"
                    >
                      <span className="text-sm leading-5">{keywordText}</span>

                      <div
                        className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 
      border-t-6 border-b-6 border-r-6 
      border-t-transparent border-b-transparent border-r-[#2E2E2E]"
                      ></div>
                    </div>
                  )}
                  <div className="flex items-center w-full gap-4">
                    <span
                      className={`font-semibold text-[18px] ${
                        item.idx <= 3 ? "text-[#1A75FF]" : "text-[#56585A]"
                      }`}
                    >
                      {item.idx}
                    </span>

                    <div className="flex flex-col w-full ">
                      {brand && (
                        <span className="text-sm text-[#6F7173] font-semibold mb-[2px]">
                          {brand}
                        </span>
                      )}
                      <span className="text-base text-[#3D3F41] font-semibold line-clamp-1">
                        {keywordText}
                      </span>
                    </div>
                  </div>

                  <div className="pl-2">
                    {item.status === 1 && (
                      <Icon
                        icon="fe:drop-up"
                        className="w-4 h-4 text-red-500"
                      />
                    )}
                    {item.status === -1 && (
                      <Icon
                        icon="fe:drop-down"
                        className="w-4 h-4 text-blue-500"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export default NewMainKeywordBox;
