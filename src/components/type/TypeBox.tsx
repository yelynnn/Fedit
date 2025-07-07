import React from "react";
import TypeChart from "./TypeChart";

type RowData = {
  category: string;
  count: number;
  ratio: string;
  color: string;
};

const rows: RowData[] = [
  { category: "전체", count: 2044, ratio: "100%", color: "transparent" },
  { category: "상의", count: 671, ratio: "32.8%", color: "#A02072" },
  { category: "하의", count: 485, ratio: "23.7%", color: "#86A7BF" },
  { category: "잡화", count: 241, ratio: "11.8%", color: "#A57EE9" },
  { category: "속옷", count: 239, ratio: "10%", color: "#F2D993" },
  { category: "드레스", count: 440, ratio: "20%", color: "#91C7BD" },
  { category: "기타", count: 440, ratio: "20%", color: "#E26AC6" },
];

function TypeBox() {
  return (
    <div className="w-100 p-6 rounded-2xl bg-[#F7F9FB]">
      <header className="text-[#1C1C1C] text-base font-bold">아디다스</header>
      <TypeChart />
      <div className="w-full max-w-xs text-s1">
        <table className="w-full text-left">
          <tr className="border-b border-[#00000040] text-[#1C1C1C] text-[13px] font-semibold text-center">
            <th className="py-2 pr-6">카테고리</th>
            <th className="text-center">합계(SKU)</th>
            <th className="text-center">비중</th>
          </tr>
          <tbody>
            {rows.map((row, idx) => (
              <React.Fragment key={row.category}>
                <tr className="text-[#6A567E]">
                  <td className="px-1 py-2">
                    <div className="flex items-center gap-2 pl-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span>{row.category}</span>
                    </div>
                  </td>
                  <td className={`py-2 text-center ${idx === 0 ? "pr-2" : ""}`}>
                    {row.count}
                  </td>
                  <td className="py-2 text-center">{row.ratio}</td>
                </tr>
                {idx === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="border-t border-[#C3A9F0] mb-1" />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TypeBox;
