import { useState } from "react";
import { Icon } from "@iconify/react";
import { useTypeStore } from "@/stores/TypeStore";
import naverIcon from "@/assets/brand/naverIcon.png";
import musinsaIcon from "@/assets/brand/musinsaIcon.png";
import wconceptIcon from "@/assets/brand/wconceptIcon.png";
import MonthModal from "./modal/MonthModal";
import infoFilledIcon from "@/assets/etc/info_filled.svg";
import upIcon from "@/assets/etc/upIcon.svg";
import downIcon from "@/assets/etc/downIcon.svg";
import updownIcon from "@/assets/etc/updown.svg";

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
  const [showNaverInfo, setShowNaverInfo] = useState(false);

  const handleShowNaverInfo = () => {
    setShowNaverInfo(true);
    setTimeout(() => setShowNaverInfo(false), 3000);
  };
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0]?.category ?? "",
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
      className={`${
        isMonthly
          ? "w-[880px]"
          : "flex-grow flex-shrink-0 basis-[calc(33.333%-1rem)] min-w-[300px] max-w-[430px]"
      } box-border`}
    >
      <header className="flex items-center justify-between px-1 pb-3">
        <div className="relative flex items-center">
          <div className="flex items-center gap-3">
            <img
              src={getImageByTitle(title)}
              alt={title}
              className="object-contain w-6 h-6"
            />
            <h3 className="text-base font-semibold leading-6">
              {title} 키워드
            </h3>
          </div>
          {title === "네이버" && (
            <>
              <button
                type="button"
                onClick={handleShowNaverInfo}
                className="flex items-center justify-center flex-shrink-0 w-5 h-5 ml-2"
              >
                <img src={infoFilledIcon} alt="안내" className="w-5 h-5" />
              </button>
              {showNaverInfo && (
                <>
                  <div
                    className="absolute z-50 w-3 h-2 overflow-hidden"
                    style={{ left: 135, top: 19 }}
                  >
                    <div className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[rgba(0,0,0,0.75)]" />
                  </div>
                  <div
                    className="absolute z-50 flex flex-col items-center justify-center gap-2.5 rounded-lg bg-[rgba(0,0,0,0.75)] px-2 py-1 shadow-[0_4px_16px_0_rgba(0,0,0,0.10)]"
                    style={{ left: 8, top: 27 }}
                  >
                    <span className="text-center type-body-xsmall whitespace-nowrap text-tx-inverse">
                      네이버는 상승률을 제공하지 않아 키워드만 표시돼요
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {isMonthly && (
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-tx-neutral">
              {title} 월간 랭킹
            </p>
            <div
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 cursor-pointer select-none"
            >
              <span className="text-base font-semibold text-tx-neutral">
                {formatMonth(selectedMonth)}
              </span>
              <Icon
                icon="mingcute:down-fill"
                className="w-4 h-4 text-tx-neutral"
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

      <div className="pt-4 pb-2 bg-fill-bg-strong rounded-xl">
        {isMonthly && (
          <div className="flex items-center w-full gap-6 px-5 pt-2 mb-5 border-b border-line-alt">
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`relative pb-2 text-base font-semibold transition-colors duration-200 
                ${
                  selectedCategory === cat.category
                    ? "text-tx-alt after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-[#56585A]"
                    : "text-tx-alt"
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        )}

        {audienceType === "kids" && !isMonthly && (
          <div className="flex items-center justify-center w-full gap-6 py-3 mb-5 text-sm font-semibold border-b text-tx-neutral border-line-alt">
            출산육아 / 키즈 키워드
          </div>
        )}

        <div
          className={`px-5 flex ${isMonthly ? "flex-row gap-5 justify-between" : "flex-col"}`}
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
                    className={`relative flex items-center justify-center px-2 rounded-lg ${isMonthly ? "h-14 mb-1" : "py-2"}`}
                  >
                    {isMonthly && hoveredIdx === item.idx && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-fill-primary text-white px-3 py-[6px] rounded-lg shadow-lg min-w-max max-w-50 whitespace-normal break-words z-50">
                        <span className="text-sm leading-5">{keywordText}</span>
                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-b-6 border-r-6 border-t-transparent border-b-transparent border-r-[#2E2E2E]"></div>
                      </div>
                    )}
                    <div className="flex items-center w-full gap-4">
                      <span
                        className={`font-semibold text-[18px] ${item.idx <= 3 ? "text-data-blue" : "text-tx-alt"}`}
                      >
                        {item.idx}
                      </span>
                      <div className="flex flex-col w-full ">
                        {brand && (
                          <span className="text-sm text-tx-alt font-semibold mb-[2px]">
                            {brand}
                          </span>
                        )}
                        <span className="text-base font-semibold text-tx-neutral line-clamp-1">
                          {keywordText}
                        </span>
                      </div>
                    </div>
                    <div className="pl-2">
                      {item.status === 1 && (
                        <img src={upIcon} alt="상승" className="h-6 w-6" />
                      )}
                      {item.status === -1 && (
                        <img src={downIcon} alt="하락" className="h-6 w-6" />
                      )}
                      {item.status === 0 && title !== "네이버" && (
                        <img src={updownIcon} alt="유지" className="h-6 w-6" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NewMainKeywordBox;
