import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import type { MonthModalProps } from "@/types/Main";

const MonthModal: React.FC<MonthModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  dateList,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const latest = dateList?.[0];
    return latest ? parseInt(latest.split("-")[0]) : new Date().getFullYear();
  });

  const groupedByYear = useMemo(() => {
    const result: Record<string, string[]> = {};
    dateList.forEach((date) => {
      const [year, month] = date.split("-");
      if (!result[year]) result[year] = [];
      result[year].push(month);
    });
    return result;
  }, [dateList]);

  const years = Object.keys(groupedByYear).sort(
    (a, b) => parseInt(b) - parseInt(a)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>

      <div className="relative p-4 bg-white shadow-xl rounded-xl w-125 h-110">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#242628]">기간</h2>

          <button onClick={onClose}>
            <Icon icon="formkit:close" className="h-6 w-8 text-[#3D3F41]" />
          </button>
        </div>

        <div className="flex gap-6">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(parseInt(year))}
              className={`pb-2 text-base font-semibold ${
                selectedYear === parseInt(year)
                  ? "text-[#242628] border-b-2 border-[#56585A]"
                  : "text-[#6F7173]"
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        <div className="flex flex-col flex-wrap gap-3 pt-4 overflow-y-auto">
          {groupedByYear[selectedYear]?.map((month) => (
            <p
              key={`${selectedYear}-${month}`}
              onClick={() => {
                onSelect(`${selectedYear}-${month}`);
                onClose();
              }}
              className="text-sm text-[#3D3F41] font-semibold cursor-pointer "
            >
              {parseInt(month)}월
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthModal;
