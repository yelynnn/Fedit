import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { GetCategoryList, type CategoryGroup } from "@/apis/AnalysisAPI";

// 유형 카테고리 하나에 품목이 100개 넘게 들어있는 경우가 있어(예: 아우터),
// 평평한 체크리스트 하나로는 찾기 힘들다. 카테고리를 서브탭으로 나누고,
// 탭 안에서 검색 + 칩 선택으로 좁혀 찾을 수 있게 한다.
export default function TypeFilterPanel() {
  const { filterList, addFilter, removeFilter } = useFilterStore((s) => s);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetCategoryList()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setActiveTab(cats[0].label);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeItems = useMemo(
    () => categories.find((c) => c.label === activeTab)?.items ?? [],
    [categories, activeTab],
  );

  const visibleItems = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return k
      ? activeItems.filter((item) => item.toLowerCase().includes(k))
      : activeItems;
  }, [keyword, activeItems]);

  // 카테고리를 통째로 선택했을 때는 왼쪽 필터 칩에 세부 품목이 다 나열되지
  // 않도록, 개별 품목 대신 카테고리 라벨 하나만 filterList에 넣는다(예:
  // "원피스"). 그래서 개별 품목의 체크 상태도 filterList에 그 품목이 직접
  // 있는지뿐 아니라 카테고리 라벨이 통으로 선택돼 있는지까지 함께 봐야 한다.
  const isCategoryFullySelected = filterList.includes(activeTab);

  const toggle = (value: string) => {
    if (isCategoryFullySelected) {
      // 통 선택된 상태에서 품목 하나를 해제하는 경우 — 라벨을 풀고
      // 나머지 품목들만 개별로 다시 채워 넣는다.
      removeFilter(activeTab);
      activeItems.forEach((item) => {
        if (item !== value) addFilter(item);
      });
      return;
    }
    if (filterList.includes(value)) removeFilter(value);
    else addFilter(value);
  };

  const allChecked =
    isCategoryFullySelected ||
    (activeItems.length > 0 && activeItems.every((item) => filterList.includes(item)));

  // "전체 선택하기"는 검색으로 좁혀진 목록이 아니라 카테고리 전체를 대상으로
  // 한다 — 일부만 검색해서 켜면 "카테고리 하나 = 칩 하나"라는 전제가 깨진다.
  const toggleAllInCategory = () => {
    if (allChecked) {
      removeFilter(activeTab);
      activeItems.forEach((item) => filterList.includes(item) && removeFilter(item));
    } else {
      activeItems.forEach((item) => filterList.includes(item) && removeFilter(item));
      addFilter(activeTab);
    }
  };

  if (loading) {
    return <p className="ml-2 text-sm text-tx-alt">불러오는 중…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c) => {
          const active = c.label === activeTab;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                setActiveTab(c.label);
                setKeyword("");
              }}
              className={[
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "bg-tx-neutral text-white"
                  : "bg-fill-bg-strong text-tx-alt hover:text-tx-neutral",
              ].join(" ")}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-line-alt px-3 py-2">
        <Icon
          icon="mingcute:search-line"
          className="h-4 w-4 flex-shrink-0 text-icon-alt"
        />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={`${activeTab} 안에서 검색`}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-icon-alt"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-tx-alt">
        <span>{visibleItems.length}개</span>
        <label className="inline-flex cursor-pointer select-none items-center gap-1.5">
          <input
            type="checkbox"
            className="h-3 w-3 accent-data-violet"
            checked={allChecked}
            onChange={toggleAllInCategory}
            disabled={activeItems.length === 0}
          />
          <span>{activeTab} 전체 선택하기</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleItems.length === 0 ? (
          <p className="w-full py-6 text-center text-sm text-tx-alt">
            검색 결과가 없어요.
          </p>
        ) : (
          visibleItems.map((item) => {
            const checked = isCategoryFullySelected || filterList.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className={[
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  checked
                    ? "bg-tx-neutral text-white"
                    : "border border-line-alt bg-fill-bg-strong text-tx-neutral hover:border-tx-neutral",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
