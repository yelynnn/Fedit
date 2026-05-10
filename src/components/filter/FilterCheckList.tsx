import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import {
  GenderCategories,
  TypeCategories,
  ColorCategories,
  MoodCategories,
} from "@/data/FilterCategories";
import { GetPatternList, GetDetailList } from "@/apis/AnalysisAPI";

type Props = { title: "성별" | "유형" | "색상" | "디테일" | "패턴" | "무드" };

export default function FilterCheckList({ title }: Props) {
  const { filterList, addFilter, removeFilter } = useFilterStore((s) => s);
  const [patternList, setPatternList] = useState<string[]>([]);
  const [detailList, setDetailList] = useState<string[]>([]);

  useEffect(() => {
    if (title === "패턴") GetPatternList().then(setPatternList);
    if (title === "디테일") GetDetailList().then(setDetailList);
  }, [title]);

  const toggle = (value: string) => {
    if (filterList.includes(value)) removeFilter(value);
    else addFilter(value);
  };

  const gridCls =
    "grid grid-cols-2 gap-x-14 gap-y-4 text-sm text-[#4B4B4B] ml-2";

  if (title === "성별") {
    return (
      <ul className={gridCls}>
        {GenderCategories.map((g) => {
          const checked = filterList.includes(g);
          return (
            <li key={g} className="flex items-center gap-2">
              <input
                id={`gender-${g}`}
                type="checkbox"
                className="h-3 w-3 accent-[#95A4FC]"
                checked={checked}
                onChange={() => toggle(g)}
              />
              <label htmlFor={`gender-${g}`} className="cursor-pointer">
                {g}
              </label>
            </li>
          );
        })}
      </ul>
    );
  }

  if (title === "유형") {
    const gridCls = "ml-2 grid grid-cols-2 gap-y-3 text-sm text-[#4B4B4B]";

    const isAllSubChecked = (subs: string[]) =>
      subs.every((s) => filterList.includes(s));

    const toggle = (value: string) => {
      if (filterList.includes(value)) removeFilter(value);
      else addFilter(value);
    };

    return (
      <div className="flex flex-col gap-6">
        {TypeCategories.map(({ category, subcategories }) => {
          const isCategoryInList = filterList.includes(category);
          const isCategoryChecked =
            isCategoryInList || isAllSubChecked(subcategories);

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <div className="ml-2 text-sm font-semibold text-[#3D3F41]">
                  {category}
                </div>

                <label
                  htmlFor={`type-cat-${category}`}
                  className="flex items-center gap-2 cursor-pointer text-xs text-[#56585A]"
                >
                  <input
                    id={`type-cat-${category}`}
                    type="checkbox"
                    className="h-3 w-3 accent-[#95A4FC]"
                    checked={isCategoryChecked}
                    onChange={() => {
                      if (isCategoryChecked) {
                        removeFilter(category);
                        subcategories.forEach(removeFilter);
                      } else {
                        addFilter(category);
                        subcategories.forEach(removeFilter);
                      }
                    }}
                  />
                  <span>{category} 전체 선택하기</span>
                </label>
              </div>

              <ul className={gridCls}>
                {subcategories.map((s) => {
                  const checked = isCategoryInList || filterList.includes(s);
                  return (
                    <li key={s} className="flex items-center gap-2">
                      <input
                        id={`type-${s}`}
                        type="checkbox"
                        className="h-3 w-3 accent-[#95A4FC]"
                        checked={checked}
                        onChange={() => {
                          if (isCategoryInList) {
                            removeFilter(category);
                            subcategories.forEach((sub) => {
                              if (sub !== s) addFilter(sub);
                            });
                            return;
                          }
                          toggle(s);
                        }}
                      />
                      <label htmlFor={`type-${s}`} className="cursor-pointer">
                        {s}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  if (title === "색상") {
    return (
      <ul className={gridCls}>
        {ColorCategories.map((c) => {
          const checked = filterList.includes(c.label);
          return (
            <li key={c.label}>
              <label className="sr-only" htmlFor={`color-${c.label}`}>
                {c.label}
              </label>
              <input
                id={`color-${c.label}`}
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={() => toggle(c.label)}
              />

              <button
                type="button"
                onClick={() => toggle(c.label)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <span
                  className={[
                    "relative inline-flex w-6 h-6 rounded-full border border-gray-200",
                  ].join(" ")}
                  style={
                    c.value === "rainbow"
                      ? { background: "linear-gradient(180deg, #FF0000, #FF7F00, #FFFF00, #00CC44, #2563EB, #8B00FF)" }
                      : { backgroundColor: c.value }
                  }
                >
                  {checked && (
                    <Icon
                      icon="mdi:check"
                      className="absolute inset-0 w-4 h-4 m-auto"
                      style={{
                        color:
                          c.value === "#FFFFFF" || c.value === "#FFF017"
                            ? "#3D3F41"
                            : "#FFFFFF",
                      }}
                    />
                  )}
                </span>

                <span
                  className={
                    checked ? "font-semibold text-[#3D3F41]" : "text-[#888A8C]"
                  }
                >
                  {c.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  if (title === "무드") {
    return (
      <ul className={gridCls}>
        {MoodCategories.map((v) => (
          <li key={v} className="flex items-center gap-2 text-[#6B7A99]">
            <Icon icon="tabler:lock" />
            <span>{v}</span>
          </li>
        ))}
      </ul>
    );
  }

  const apiData = title === "디테일" ? detailList : patternList;
  return (
    <ul className={gridCls}>
      {apiData.map((v) => {
        const checked = filterList.includes(v);
        return (
          <li key={v}>
            <button
              type="button"
              onClick={() => toggle(v)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span
                className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${
                  checked
                    ? "bg-[#4A4C4E] border-[#4A4C4E]"
                    : "border-[#D1D3D9]"
                }`}
              >
                {checked && (
                  <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white" />
                )}
              </span>
              <span className="text-sm text-[#242628]">{v}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
