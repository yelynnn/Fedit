import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { useFilterStore } from "../../stores/FilterStore";
import type { FilterOptionProps } from "@/types/Filter";

function FilterOption({
  title,
  categoryList,
  typeList,
  colorList,
  onBrandClick,
}: FilterOptionProps & { onBrandClick?: (open: boolean) => void }) {
  const { filterList, addFilter, removeFilter } = useFilterStore(
    (state) => state
  );
  const isColorCategory = title === "색상";
  const isTypeCategory = title === "유형";
  const isBrandCategory = title === "브랜드";
  const [openCategory, setOpenCategory] = useState(false);

  const isAllSubChecked = (subs: string[]) =>
    subs.every((sub) => filterList.includes(sub));

  const handleToggle = (category: string) => {
    if (filterList.includes(category)) {
      removeFilter(category);
    } else {
      addFilter(category);
    }
  };

  return (
    <section className="flex flex-col w-full">
      <div
        className="flex w-full border-t border-[#00000040] h-12 items-center justify-between px-4 cursor-pointer"
        style={{ backgroundColor: openCategory ? "#D9D9D999" : "transparent" }}
        onClick={() => {
          const next = !openCategory;
          setOpenCategory(next);
          if (isBrandCategory && onBrandClick) {
            onBrandClick(next);
          }
        }}
      >
        {title}
        <Icon
          icon={
            openCategory ? "heroicons-outline:minus" : "heroicons-outline:plus"
          }
          color="#00000066"
          className="w-4 h-4"
        />
      </div>

      {openCategory && !isBrandCategory && (
        <>
          {isColorCategory ? (
            <ul className="flex flex-wrap gap-2 px-3 py-4">
              {colorList?.map((color) => {
                const isChecked = filterList.includes(color.label);
                return (
                  <li key={color.label}>
                    <label htmlFor={color.label} className="cursor-pointer">
                      <input
                        type="checkbox"
                        id={color.label}
                        checked={isChecked}
                        onChange={() => handleToggle(color.label)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 box-border transition-all duration-200 ${
                          isChecked
                            ? "border-[#95A4FC] scale-110"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : isTypeCategory ? (
            <ul className="px-4 py-2 flex flex-col gap-4 text-sm text-[#4B4B4B]">
              {typeList?.map(({ category, subcategories }) => {
                const isCategoryInList = filterList.includes(category);
                const allSubsChecked = isAllSubChecked(subcategories);
                const isCategoryChecked = isCategoryInList || allSubsChecked;

                return (
                  <li key={category}>
                    <div className="flex items-center gap-2 mb-2 font-semibold">
                      <input
                        type="checkbox"
                        id={category}
                        checked={isCategoryChecked}
                        onChange={() => {
                          if (isCategoryChecked) {
                            removeFilter(category);
                            subcategories.forEach(removeFilter);
                          } else {
                            addFilter(category);
                          }
                        }}
                        className="w-3 h-3 accent-[#95A4FC]"
                      />
                      <label htmlFor={category} className="cursor-pointer">
                        {category}
                      </label>
                    </div>

                    <ul className="flex flex-col flex-wrap gap-3 ml-2">
                      {subcategories.map((subcategory) => {
                        const isChecked =
                          isCategoryInList || filterList.includes(subcategory);

                        return (
                          <li
                            key={subcategory}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              id={`${category}-${subcategory}`}
                              checked={isChecked}
                              onChange={() => {
                                if (isCategoryInList) {
                                  removeFilter(category);
                                  subcategories.forEach((sub) => {
                                    if (sub !== subcategory) addFilter(sub);
                                  });
                                  return;
                                }
                                handleToggle(subcategory);
                              }}
                              className="w-3 h-3 accent-[#95A4FC]"
                            />
                            <label
                              htmlFor={`${category}-${subcategory}`}
                              className="cursor-pointer"
                            >
                              {subcategory}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="ml-6 mb-4 mt-2 flex flex-col gap-2 text-sm text-[#4B4B4B]">
              {categoryList?.map((category) => {
                const isChecked = filterList.includes(category);
                const isLocked = title === "패턴" || title === "디테일";

                return (
                  <li key={category} className="flex items-center gap-2">
                    {isLocked ? (
                      <>
                        <Icon icon="tabler:lock" className="text-[#6B7A99]" />
                        <span>{category}</span>
                      </>
                    ) : (
                      <>
                        <input
                          type="checkbox"
                          id={category}
                          checked={isChecked}
                          onChange={() => handleToggle(category)}
                          className="w-3 h-3 accent-[#95A4FC]"
                        />
                        <label htmlFor={category} className="cursor-pointer">
                          {category}
                        </label>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default FilterOption;
