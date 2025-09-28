import vogue from "@/assets/vogue.png";
import W from "@/assets/W.png";
import allure from "@/assets/allure.png";
import SingleChart from "../chart/SingleChart";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { GetItemTrend } from "@/apis/DashBoardAPI";
import type { TrendItem } from "@/types/Main";

type Props = { sliceIndex?: number };

const MAG_LOGO: Record<string, string> = {
  vogue,
  w: W,
  allure,
};

function formatK(n: number) {
  if (n >= 1000) return `${Math.round(n / 100) / 10}K`;
  return `${n}`;
}

function MainItemTrendBox({ sliceIndex = 0 }: Props) {
  const [itemTrendList, setItemTrendList] = useState<TrendItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await GetItemTrend();
        const list: TrendItem[] = Array.isArray(res) ? res : res?.items ?? [];
        setItemTrendList(list ?? []);
        // console.log("아이템 트렌드:", list);
      } catch (error) {
        console.error("아이템 트렌드 불러오기 실패:", error);
        setItemTrendList([]);
      }
    };
    fetchData();
  }, []);

  const items = itemTrendList.slice(sliceIndex, sliceIndex + 3);

  return (
    <section className="border border-gray-200 w-165 rounded-xl">
      <div className="flex text-xs font-semibold items-center justify-center gap-5 p-4 bg-[#242628] text-white h-9 rounded-t-xl">
        <span className="flex-shrink-0 text-center w-41">트렌드 항목</span>
        <span className="flex-1 text-center">검색량 & 검색 추이</span>
        <span className="flex-1 text-center">연관 매거진</span>
        <span className="flex-1 text-center">연관 아이템</span>
      </div>

      {items.map((item, idx) => {
        const rank = sliceIndex + idx + 1;
        const magazines = item.magazines ?? item.magazine ?? [];
        const related = item.related_item ?? [];

        return (
          <div
            key={`${item.keyword}-${idx}`}
            className="text-[#111827] flex items-center justify-center gap-5 py-3 px-5"
          >
            <div className="flex gap-3 w-41">
              <img
                src={item.keyword_image_url}
                alt="keyword_image_url"
                className="object-cover w-16 h-16 rounded-lg"
              />
              <div className="flex flex-col">
                <span className="mt-2 text-sm font-medium">{item.keyword}</span>
                <div className="flex gap-1 mt-2">
                  <div className="flex items-center justify-center h-6 rounded w-7 bg-[#FEE6C6] text-xs font-medium text-[#FF9200]">
                    {rank}위
                  </div>
                  {item.category && (
                    <div className="flex items-center justify-center h-6 rounded w-11 bg-[#EAF2FE] text-xs font-medium text-[#1A75FF]">
                      {item.category}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center flex-1">
              <div className="flex items-center gap-3">
                <span className="font-normal text-[#6B7280] text-xs">
                  월간 검색
                </span>
                <span className="font-semibold text-[#56585A] text-sm">
                  {formatK(item.search_volume)}
                </span>
              </div>
              <SingleChart charList={item.search_trend} />
            </div>

            {magazines.length > 0 && magazines.some((m) => m.magazine_url) ? (
              <div className="flex items-center justify-center flex-1 gap-3 leading-none">
                {magazines
                  .filter((m) => m.magazine_url)
                  .slice(0, 3)
                  .map((m, i) => {
                    const key = (m.title || "").toLowerCase();
                    const logo = MAG_LOGO[key] || allure;
                    return (
                      <a
                        key={`${m.title}-${i}`}
                        href={m.magazine_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center"
                        title={m.title}
                      >
                        <img
                          src={logo}
                          alt={m.title}
                          className="block rounded-full object-cover w-8 h-8 shadow-[0_4px_4px_rgba(0,0,0,0.15)]"
                        />
                      </a>
                    );
                  })}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <Icon icon="mdi:minus" className="w-4 h-4 text-gray-400" />
              </div>
            )}

            <div className="flex items-center justify-center flex-1">
              {related.length > 0 ? (
                related.slice(0, 5).map((r, rIdx) => (
                  <a
                    key={rIdx}
                    href={r.item_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={r.item_image_url || allure}
                      alt={`related-${rIdx}`}
                      className={`w-10 h-10 rounded-lg shadow-[0_4px_4px_rgba(0,0,0,0.15)] ${
                        rIdx > 0 ? "-ml-1" : ""
                      }`}
                    />
                  </a>
                ))
              ) : (
                <Icon icon="mdi:minus" className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default MainItemTrendBox;
