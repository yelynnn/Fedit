import { Icon } from "@iconify/react/dist/iconify.js";
import TypeBarChart from "./TypeBarChart";
import type { BrandTypeBlock, TypeRow } from "@/types/Filter";
import React from "react";
import KeyWordBox from "./KeyWordBox";

type Props = {
  block: BrandTypeBlock;
};

const COLORS = ["#60A5FA", "#F87171", "#34D399", "#22D3EE", "#FBBF24"];

function formatRatio(r?: string | number) {
  if (r === undefined || r === null) return "0%";
  if (typeof r === "number") return `${Math.round(r * 100)}%`;
  return r.includes("%") ? r : `${r}%`;
}

function NewTypeBox({ block }: Props) {
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  const toggleRow = (key: string) =>
    setOpenMap((m) => ({ ...m, [key]: !m[key] }));

  const rows = block.rows ?? [];

  return (
    <div className=" w-109 h-fit">
      <span className="mb-3 text-lg font-semibold text-[#56585A] flex items-center gap-2">
        <p>{block.brand}</p> | <p className="text-[#3D3F41]">{block.total}</p>
        <p className="text-xs"> 전체 합계</p>
      </span>
      <TypeBarChart data={block.rows} />
      <section className="w-full mt-5 overflow-hidden border border-gray-200 rounded-xl">
        <div className="flex text-xs font-semibold items-center justify-center gap-5 p-4 bg-[#242628] text-white h-9 rounded-t-xl">
          <span className="flex-1 text-center">카테고리</span>
          <span className="flex-1 text-center">합계(SKU)</span>
          <span className="flex-1 text-center">비중</span>
        </div>
        <div className="divide-y divide-gray-200">
          {rows.map((row: TypeRow, idx) => {
            const color = COLORS[idx % COLORS.length];
            const opened = !!openMap[row.category];

            return (
              <div key={row.category} className="bg-white">
                <div className="flex items-center gap-5 px-4 py-3">
                  <div className="flex items-center justify-start flex-1">
                    <span
                      className="inline-block w-3 h-3 mr-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[#56585A]">{row.category}</span>
                  </div>
                  <div className="flex-1 text-center text-[#56585A]">
                    {row.count?.toLocaleString?.() ?? row.count}
                  </div>
                  <div className="flex items-center justify-end flex-1 gap-2">
                    <div className=" text-[#56585A]">
                      {formatRatio(row.ratio)}
                    </div>
                    {row.category !== "전체" && (
                      <button
                        type="button"
                        onClick={() => toggleRow(row.category)}
                        className="ml-4 text-[#6B7A99] duration-200"
                        aria-label="toggle"
                        aria-expanded={opened}
                      >
                        <Icon
                          icon="ep:arrow-down"
                          className={opened ? "rotate-180" : ""}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {opened && (
                  <div className="bg-[#EAF2FE]/50 px-6 pt-4">
                    <KeyWordBox
                      fit={row.fit}
                      material={row.material}
                      etc={row.etc}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default NewTypeBox;
