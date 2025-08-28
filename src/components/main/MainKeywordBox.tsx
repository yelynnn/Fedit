import type { KeywordBox } from "@/types/Main";
import { Icon } from "@iconify/react/dist/iconify.js";

function MainKeywordBox({ title, keywords }: KeywordBox) {
  return (
    <section
      className={`flex flex-col ${title === "키워드 순위" ? "w-40" : "w-50"}`}
    >
      <header className="text-sm font-bold">{title}</header>
      <div className="w-full h-[1px] bg-[#A6A4B2] mt-1 my-2"></div>
      <div className="flex flex-col gap-2">
        {keywords.map((item) => (
          <div key={item.idx} className="flex items-center gap-1 text-xs ">
            <span className="text-[#7094F4] font-semibold ">{item.idx}위</span>
            <span className="ml-1 font-medium">{item.keyword}</span>
            {item.status !== 0 && (
              <Icon
                icon={item.status === 1 ? "fe:drop-up" : "fe:drop-down"}
                className={`w-[15px] h-[15px] ${
                  item.status === 1 ? "text-[#FF2424]" : "text-[#5B84FF]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default MainKeywordBox;
