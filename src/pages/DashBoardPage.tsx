import { GetTrendKeyword } from "@/apis/DashBoardAPI";
import QuestionTooltip from "@/components/common/QuestionTooltip";
import TitleHeader from "@/components/common/TitleHeader";
import MainItemTrendBox from "@/components/main/MainItemTrendBox";
import NewMainKeywordBox from "@/components/main/NewMainKeywordBox";
import PasswordModal from "@/components/main/PasswordModal";
import SubTitleBox from "@/components/main/SubTitleBox";
import { useTypeStore } from "@/stores/TypeStore";
import { Icon } from "@iconify/react/dist/iconify.js";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useEffect, useState } from "react";

// type ApiBrandBlock = {
//   brand: string;
//   categories: {
//     category: string;
//     rankings: { idx: number; keyword: string; status: number }[];
//   }[];
// };

function DashBoardPage() {
  const [keywordList, setKeywordList] = useState<any[]>([]);
  const [crawledDate, setCrawledDate] = useState<string | null>(null);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const { audienceType, selectedMonth, setAudienceType } = useTypeStore();

  dayjs.locale("ko");
  const today = dayjs();
  const formatted = today.format("MM월 DD일");
  const weekday = today.format("dd");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const baseParams =
          selectedMonth && selectedMonth.trim() !== ""
            ? { audienceType, date: selectedMonth }
            : { audienceType };

        // 1) 기본 키워드
        const baseRes = await GetTrendKeyword(baseParams);
        const baseArray = Array.isArray(baseRes)
          ? baseRes
          : baseRes?.result ?? [];

        // 기본 브랜드 변환
        let merged = baseArray.flatMap((result: any) => {
          const brands = result.brands ?? [];
          return brands
            .filter((b: any) => b.brand !== "29CM")
            .map((b: any) => ({
              title: b.brand,
              dateType: result.date_type,
              categories: b.categories ?? [],
              date: result.date,
            }));
        });

        // 2) kids라면 네이버 추가 요청
        if (audienceType === "kids") {
          const naverParams = { audienceType: "kids", brand: "네이버" };

          const naverRes = await GetTrendKeyword(naverParams);
          const naverArray = Array.isArray(naverRes)
            ? naverRes
            : naverRes?.result ?? [];

          const parsedNaver = naverArray.flatMap((result: any) => {
            const brands = result.brands ?? [];
            return brands.map((b: any) => ({
              title: b.brand,
              dateType: result.date_type,
              categories: b.categories ?? [],
              date: result.date,
            }));
          });

          merged = [...merged, ...parsedNaver];
        }

        setKeywordList(merged);
        setCrawledDate(baseArray[0]?.date ?? null);
      } catch (e) {
        console.log("Fetch error:", e);
        setKeywordList([]);
        setCrawledDate(null);
      }
    };

    fetchAll();
  }, [audienceType, selectedMonth]);

  return (
    <div className="w-full h-full">
      <TitleHeader
        title="FEDIT 대시보드"
        sub_title="데이터로 보는 오늘의 패션 인사이트"
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      <div className="flex items-center gap-5 w-80 h-18 rounded-xl border-[1px] border-[#ECEEF0] px-4 py-5 mt-4 bg-white">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#EAF2FE]">
          <Icon icon="uit:calender" color="#1A75FF" className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1 text-[#1A75FF] font-semibold">
          <p className="text-sm">Today</p>
          <div className="flex items-end gap-2">
            <span className="text-base">{formatted}</span>
            <span className="text-sm">{weekday}</span>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-end gap-2 mb-3">
          <SubTitleBox
            title="지금 인기 있는"
            sub_title="플랫폼에서 지금 주목받는 패션 키워드와 트렌드 항목을 확인해보세요."
          />
          <QuestionTooltip infoText="매일 오전 10시, 무신사·W컨셉·네이버 등 주요 패션 플랫폼의 검색어 데이터를 자동 수집하며, 매거진·SNS 언급량 분석을 결합해 월별 종합 랭킹과 최근 주목도가 급상승한 패션 트렌드를 함께 제공합니다." />
        </div>
        <div className="flex items-center justify-between p-1 bg-white border border-[#56585A] rounded-full w-80 mt-1 mb-4">
          {["adult", "kids"].map((type) => (
            <button
              key={type}
              onClick={() => setAudienceType(type)}
              className={`w-1/2 h-9 rounded-full text-[18px] font-semibold transition-colors duration-200 ${
                audienceType === type
                  ? "bg-[#1A1A1A] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {type === "adult" ? "어덜트" : "키즈"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-5">
          {keywordList.map((box) => (
            <NewMainKeywordBox
              key={`${box.title}-${box.dateType}`}
              title={box.title}
              dateType={box.dateType}
              categories={box.categories}
              crawledDate={crawledDate}
              dateList={[
                "2024-11",
                "2024-12",
                "2025-01",
                "2025-02",
                "2025-03",
                "2025-04",
                "2025-05",
                "2025-06",
                "2025-07",
                "2025-08",
                "2025-09",
                "2025-10",
              ]}
            />
          ))}

          {keywordList.length === 0 && (
            <div className="text-sm text-gray-500">표시할 키워드가 없어요.</div>
          )}
        </div>
      </section>

      <section className="mt-4">
        <MainItemTrendBox />
      </section>
    </div>
  );
}

export default DashBoardPage;
