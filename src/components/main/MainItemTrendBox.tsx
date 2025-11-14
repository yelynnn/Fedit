import vogue from "@/assets/vogue.png";
import W from "@/assets/W.png";
import allure from "@/assets/allure.png";
import SingleChart from "../chart/SingleChart";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { GetItemTrend } from "@/apis/DashBoardAPI";
import type { TrendItem } from "@/types/Main";
import { useTypeStore } from "@/stores/TypeStore";

const MAG_LOGO: Record<string, string> = {
  vogue,
  w: W,
  allure,
};

function formatK(n: number) {
  if (n >= 1000) return `${Math.round(n / 100) / 10}K`;
  return `${n}`;
}

function MainItemTrendBox() {
  const [itemTrendList, setItemTrendList] = useState<TrendItem[]>([]);
  const { audienceType } = useTypeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await GetItemTrend({ audienceType });
        const list: TrendItem[] = Array.isArray(res) ? res : res?.items ?? [];
        setItemTrendList(list ?? []);
      } catch (error) {
        console.error("아이템 트렌드 불러오기 실패:", error);
        setItemTrendList([]);
      }
    };
    fetchData();
  }, [audienceType]);

  return (
    <section className="border border-gray-200 w-335 rounded-xl">
      <div className="flex text-sm font-semibold items-center justify-center gap-5 p-4 bg-[#ECEEF0] text-[#6F7173] h-[38px] rounded-t-xl">
        <span className="flex-shrink-0 w-20 text-center">순위</span>
        <span className="flex-shrink-0 text-center w-41">트렌드 항목</span>
        <span className="flex-1 text-center">검색량 & 검색 추이</span>
        <span className="flex-1 text-center">연관 아이템</span>
        <span className="flex-1 text-center">연관 매거진</span>
      </div>

      {itemTrendList.map((item, idx) => {
        const rank = idx + 1;
        const magazines = item.magazines ?? item.magazine ?? [];
        const related = item.related_item ?? [];

        return (
          <div
            key={`${item.keyword}-${idx}`}
            className="text-[#111827] flex items-center justify-center gap-5 py-3 px-5"
          >
            <div className="w-20">
              <div
                className={`flex items-center justify-center px-2 py-1 rounded-xl w-fit text-sm font-semibold ml-5
    ${
      rank >= 1 && rank <= 3
        ? "bg-[#EAF2FE] text-[#1A75FF]"
        : "bg-[#ECEEF0] text-[#3D3F41]"
    }`}
              >
                {rank}위
              </div>
            </div>
            <div className="flex items-center w-40 gap-4 ml-4">
              <img
                src={item.keyword_image_url}
                alt="keyword_image_url"
                className="object-cover w-16 h-16 rounded-lg"
              />
              <span className="text-sm font-medium">{item.keyword}</span>
            </div>

            <div className="flex items-center justify-center flex-1 gap-1">
              <div className="w-25">
                <SingleChart charList={item.search_trend} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-normal text-[#6B7280] text-sm">
                  월간 검색
                </span>
                <span className="font-semibold text-[#3D3F41] text-base">
                  {formatK(item.search_volume)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center flex-1 gap-1">
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
                      className={`w-16 h-16 rounded-lg shadow-[0_4px_4px_rgba(0,0,0,0.15)] 
                      `}
                    />
                  </a>
                ))
              ) : (
                <Icon icon="mdi:minus" className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {magazines.length > 0 && magazines.some((m) => m.magazine_url) ? (
              <div className="flex items-center justify-center flex-1 ml-2 leading-none">
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
                        className={`inline-flex items-center justify-center ${
                          i > 0 ? "-ml-2" : ""
                        }`}
                        title={m.title}
                      >
                        <img
                          src={logo}
                          alt={m.title}
                          className="block rounded-full object-cover w-11 h-11 shadow-[0_4px_4px_rgba(0,0,0,0.15)]"
                        />
                      </a>
                    );
                  })}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <Icon
                  icon="ph:dots-three-bold"
                  className="text-[#6F7173] h-9 w-9"
                />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default MainItemTrendBox;
