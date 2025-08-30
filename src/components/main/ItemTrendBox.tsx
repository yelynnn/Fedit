import vogue from "@/assets/vogue.png";
import W from "@/assets/W.png";
import allure from "@/assets/allure.png";
import SingleChart from "../chart/SingleChart";
import { MockTrendData } from "@/data/mock/MockTrendData";

// type TrendItem = {
//   keyword: string;
//   keyword_image_url: string;
//   search_volume: number;
//   search_trend: number[];
//   magazine: { title: string; magazine_url: string }[];
//   related_item: { item_image_url: string; item_url: string }[];
// };

const MAG_LOGO: Record<string, string> = {
  vogue,
  W,
  allure,
};

function formatK(n: number) {
  if (n >= 1000) return `${Math.round(n / 100) / 10}K`;
  return `${n}`;
}

function ItemTrendBox() {
  return (
    <div>
      <header className="pl-4 my-6 text-xl font-semibold leading-7">
        아이템 트렌드
      </header>
      <section className="border border-gray-200 rounded-xl w-270">
        <div className="flex text-sm font-medium items-center justify-center gap-5 p-4 bg-[#F9FAFB] text-[#374151] h-13 rounded-t-xl">
          <span className="flex-shrink-0 text-center w-60">트렌드 이미지</span>
          <span className="flex-1 text-center">검색 추이</span>
          <span className="flex-1 text-center">검색량</span>
          <span className="flex-1 text-center">연관 매거진</span>
          <span className="flex-1 text-center">연관 아이템</span>
        </div>
        {MockTrendData.map((item) => (
          <div
            key={item.keyword}
            className="text-[#111827] flex items-center justify-center gap-5 py-2 px-5"
          >
            <div className="flex gap-3 w-60">
              <img
                src={item.keyword_image_url}
                alt="keyword_image_url"
                className="object-cover w-20 h-20 rounded-lg"
              />
              <span className="mt-2 text-sm font-medium">{item.keyword}</span>
            </div>
            <div className="justify-center flex-1">
              <SingleChart charList={item.search_trend} />
            </div>
            <div className="flex flex-col flex-1 text-center ">
              <span className="font-semibold">
                {formatK(item.search_volume)}
              </span>
              <span className="font-normal text-[#6B7280] text-xs">
                월간 검색
              </span>
            </div>
            <div className="flex items-center justify-center flex-1 gap-3 leading-none">
              {item.magazine.slice(0, 3).map((m) => (
                <a
                  key={m.title}
                  href={m.magazine_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center"
                >
                  <img
                    src={MAG_LOGO[m.title] || allure}
                    alt={m.title}
                    className="block rounded-full object-cover w-8 h-8 shadow-[0_4px_4px_rgba(0,0,0,0.15)]"
                  />
                </a>
              ))}
            </div>
            <div className="flex items-center justify-center flex-1">
              {item.related_item.map((r, idx) => (
                <a key={idx} href={r.item_url} target="_blank" rel="noreferrer">
                  <img
                    src={r.item_image_url || allure}
                    alt={`related-${idx}`}
                    className={`w-8 h-8 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15)] ${
                      idx > 0 ? "-ml-2" : ""
                    }`}
                  />
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default ItemTrendBox;
