import { GetTrendKeyword } from "@/apis/DashBoardAPI";
import TitleHeader from "@/components/common/TitleHeader";
import MainColorBox from "@/components/main/MainColorBox";
import MainItemTrendBox from "@/components/main/MainItemTrendBox";
import MainTypeBox from "@/components/main/MainTypeBox";
import NewMainKeywordBox from "@/components/main/NewMainKeywordBox";
import PasswordModal from "@/components/main/PasswordModal";
import SubTitleBox from "@/components/main/SubTitleBox";
import type { KeywordBox } from "@/types/Main";
import { Icon } from "@iconify/react/dist/iconify.js";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useEffect, useState } from "react";

type ApiBrandBlock = {
  brand: string;
  keywords: { idx: number; keyword: string; status: number }[];
};

function DashBoardPage() {
  const [keywordList, setKeywordList] = useState<KeywordBox[]>([]);
  const [crawledDate, setCrawledDate] = useState<string | null>(null);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  dayjs.locale("ko");
  const today = dayjs();
  const formatted = today.format("MM월 DD일");
  const weekday = today.format("dd");

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const res = await GetTrendKeyword();

        const brands: ApiBrandBlock[] = Array.isArray(res?.brands)
          ? res.brands
          : [];

        const normalized: KeywordBox[] = brands
          .filter((b) => b.brand !== "29CM")
          .map((b) => ({
            title: b.brand,
            keywords: (b.keywords ?? [])
              .slice()
              .sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
              .slice(0, 8),
          }));

        setKeywordList(normalized);
        setCrawledDate(res?.crawled_date ?? null);
      } catch (error) {
        console.error("플랫폼 키워드 가져오기 실패:", error);
        setKeywordList([]);
        setCrawledDate(null);
      }
    };
    fetchKeywords();
  }, []);

  return (
    <div className="w-full h-full">
      <button
        type="button"
        onClick={() => setPasswordModalOpen(true)}
        className="w-full text-left"
      >
        <TitleHeader
          title="FEDIT 대시보드"
          sub_title="데이터로 보는 오늘의 패션 인사이트"
        />
      </button>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={(password) => {
          console.log("입력된 비밀번호:", password);
          setPasswordModalOpen(false);
        }}
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
        <SubTitleBox
          title="지금 인기 있는"
          sub_title={"플랫폼에서 지금 주목받는 패션 키워드를 확인해보세요."}
        />
        <div className="flex flex-wrap gap-5">
          {keywordList.map((box) => (
            <NewMainKeywordBox
              key={box.title}
              title={box.title}
              keywords={box.keywords}
              crawledDate={crawledDate}
            />
          ))}
          {keywordList.length === 0 && (
            <div className="text-sm text-gray-500">표시할 키워드가 없어요.</div>
          )}
        </div>
      </section>

      <section>
        <SubTitleBox
          title="급상승 중인"
          sub_title="데이터로 지금 떠오르는 패션 유형을 확인해보세요."
        />
        <div className="flex gap-5">
          <MainColorBox />
          <MainTypeBox />
        </div>
      </section>

      <section>
        <SubTitleBox
          title="지금 가장 주목받는 아이템"
          sub_title="데이터로 확인하고 실시간 패션 아이템 트렌드를 확인해보세요."
        />
        <div className="flex gap-5">
          <MainItemTrendBox sliceIndex={0} />
          <MainItemTrendBox sliceIndex={3} />
        </div>
      </section>
    </div>
  );
}

export default DashBoardPage;
