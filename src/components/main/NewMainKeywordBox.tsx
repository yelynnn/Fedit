import type { KeywordBox } from "@/types/Main";
import { Icon } from "@iconify/react";
import "dayjs/locale/ko";
import naverIcon from "@/assets/naverIcon.png";
import musinsaIcon from "@/assets/musinsaIcon.png";
import wconceptIcon from "@/assets/wconceptIcon.png";

function getImageByTitle(title: string) {
  switch (title) {
    case "네이버":
      return naverIcon;
    case "무신사":
      return musinsaIcon;
    case "W컨셉":
      return wconceptIcon;
  }
}

function NewMainKeywordBox({ title, keywords }: KeywordBox) {
  // const today = crawledDate
  //   ? dayjs(crawledDate).format("MM.DD HH:mm")
  //   : dayjs().format("MM.DD HH:mm");

  return (
    <section className="w-108 h-92 box-border py-5 px-6 rounded-xl bg-white shadow border border-[#ECEEF0]">
      <header className="flex items-center justify-between pb-5">
        <div className="flex items-center gap-3">
          <img
            src={getImageByTitle(title)}
            alt={title}
            className="object-contain w-6 h-6"
          />
          <h3 className="text-base font-semibold leading-6">{title} 키워드</h3>
        </div>
        {/* <div className="inline-flex items-center justify-center bg-[#ECEEF0] rounded px-2 py-1 max-w-full">
          <span className="text-xs font-normal text-gray-500 whitespace-nowrap">
            {today} 기준
          </span>
        </div> */}
      </header>

      <div>
        {keywords.map((item) => (
          <div
            key={item.idx}
            className="flex items-center justify-between pb-3"
          >
            <div className="flex items-center gap-5">
              <span
                className={`font-semibold leading-6 text-base ${
                  item.idx <= 3 ? "text-[#1A75FF]" : "text-[#56585A]"
                }`}
              >
                {item.idx}
              </span>
              <span className="text-sm">{item.keyword}</span>
            </div>
            <div>
              {item.status === 1 && (
                <Icon icon="fe:drop-up" className="w-4 h-4 text-red-500" />
              )}
              {item.status === -1 && (
                <Icon icon="fe:drop-down" className="w-4 h-4 text-blue-500" />
              )}
              {item.status === 0 && (
                <Icon icon="mdi:minus" className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NewMainKeywordBox;
