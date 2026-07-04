import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

interface WeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (year: number, month: number, week: number) => void;
  dateList: string[]; // ["2026-01", "2026-02"]
}

const WeekModal: React.FC<WeekModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  dateList,
}) => {
  const now = dayjs();

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const latest = dateList?.[dateList.length - 1];
    return latest ? parseInt(latest.split("-")[0]) : now.year();
  });

  const years = useMemo(() => {
    const set = new Set(dateList.map((d) => parseInt(d.split("-")[0])));
    return Array.from(set).sort((a, b) => b - a);
  }, [dateList]);

  const monthsInYear = useMemo(() => {
    return dateList
      .filter((d) => d.startsWith(selectedYear.toString()))
      .map((d) => parseInt(d.split("-")[1]))
      .sort((a, b) => b - a);
  }, [dateList, selectedYear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>

      {/* 모달 크기를 MonthModal과 유사하게 w-125(500px), h-110(440px) 수준으로 조정 */}
      <div className="relative p-6 bg-white shadow-xl rounded-2xl w-[500px] h-[460px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-tx-default">기간</h2>
          <button onClick={onClose} className="p-1 hover:opacity-60">
            <Icon icon="formkit:close" className="h-6 w-8 text-tx-neutral" />
          </button>
        </div>

        {/* 연도 탭 */}
        <div className="flex gap-6 mb-4 border-b border-surface-base">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`pb-2 text-base font-semibold transition-all ${
                selectedYear === year
                  ? "text-tx-default border-b-2 border-line-default"
                  : "text-tx-alt"
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* 리스트 영역 (스크롤 공간 확보) */}
        <div className="flex-1 pr-2 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-6 pt-2">
            {monthsInYear.map((month) => (
              <div key={month} className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-tx-default">
                  {month}월
                </h3>

                <div className="flex items-start gap-3 pl-1">
                  <Icon
                    icon="fluent:arrow-turn-down-right-48-filled"
                    className="w-5 h-5 text-tx-assistive"
                  />

                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {[1, 2, 3, 4].map((week) => {
                      const isFuture = dayjs(`${selectedYear}-${month}-01`)
                        .add(week - 1, "week")
                        .isAfter(now, "day");

                      return (
                        <button
                          key={week}
                          disabled={isFuture}
                          onClick={() => {
                            onSelect(selectedYear, month, week);
                            onClose();
                          }}
                          className={`text-sm font-semibold transition-colors ${
                            isFuture
                              ? "text-line-divider cursor-not-allowed"
                              : "text-tx-alt hover:text-tx-default"
                          }`}
                        >
                          {week}주차
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekModal;
