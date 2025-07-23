import React, { useState } from "react";
import TypeChart from "./TypeChart";
import type { TypeBoxProps } from "@/types/Filter";
import { Icon } from "@iconify/react/dist/iconify.js";
import KeyWordBox from "./KeyWordBox";

function TypeBox({ title, chartData, rows }: TypeBoxProps) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const toggleRow = (category: string) => {
    setOpenMap((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="w-90 p-6 rounded-2xl bg-[#F7F9FB]">
      <header className="text-[#1C1C1C] text-base font-bold">{title}</header>
      <TypeChart chartData={chartData} />
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
                      {row.category !== "전체" && (
                        <Icon
                          icon="ep:arrow-down"
                          className={`text-[#6B7A99] ml-1 transition-transform duration-200 ${
                            openMap[row.category] ? "rotate-180" : ""
                          }`}
                          onClick={() => toggleRow(row.category)}
                        />
                      )}
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
                {openMap[row.category] === true && (
                  <tr>
                    <td colSpan={3}>
                      <div className="">
                        <KeyWordBox
                          fit={row.fit}
                          material={row.material}
                          etc={row.etc}
                        />
                      </div>
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
