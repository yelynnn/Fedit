import { create } from "zustand";
import { persist } from "zustand/middleware";

// Basic 플랜의 엑셀 다운로드는 한 달에 3회로 제한한다. 백엔드에 다운로드
// 횟수를 집계하는 API가 아직 없어 프론트에서 로컬로 임시 카운트한다.
// 서버 쪽 집계 API가 생기면 이 스토어는 지우고 서버 응답 기준으로 바꿔야 한다.
export const EXCEL_MONTHLY_LIMIT = 3;

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

type ExcelDownloadStore = {
  yearMonth: string;
  count: number;
  commitDownload: () => void;
};

export const useExcelDownloadStore = create<ExcelDownloadStore>()(
  persist(
    (set) => ({
      yearMonth: currentYearMonth(),
      count: 0,
      commitDownload: () =>
        set((state) => {
          const ym = currentYearMonth();
          const count = state.yearMonth === ym ? state.count : 0;
          return { yearMonth: ym, count: count + 1 };
        }),
    }),
    { name: "excel-download-storage" },
  ),
);

// 이번 달 남은 다운로드 가능 횟수. 월이 바뀌었으면 저장된 count와 무관하게
// 그대로 한도로 리셋된다.
export const getExcelDownloadRemaining = (state: {
  yearMonth: string;
  count: number;
}) => {
  const count = state.yearMonth === currentYearMonth() ? state.count : 0;
  return Math.max(0, EXCEL_MONTHLY_LIMIT - count);
};
