import { useState } from "react";
import type { FilterOptionProps } from "../../../types/Filter";
import { Icon } from "@iconify/react/dist/iconify.js";

function FilterOption({ title, categoryList, typeList }: FilterOptionProps) {
  const isColorCategory = title === "색상";
  const isTypeCategory = title === "유형";
  const [openCategory, setOpenCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);

  const handleToggle = (category: string) => {
    setSelectedCategory((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  return (
    <section className="flex flex-col w-full">
      <div
        className="flex w-full border-t border-[#00000040] h-12 items-center justify-between px-4"
        style={{
          backgroundColor: openCategory ? "#D9D9D999" : "transparent",
          height: openCategory ? "44px" : "56px",
        }}
      >
        {title}
        <Icon
          icon={
            openCategory ? "heroicons-outline:minus" : "heroicons-outline:plus"
          }
          color="#00000066"
          className="w-4 h-4"
          onClick={() => setOpenCategory((prev) => !prev)}
        />
      </div>
      {openCategory &&
        (isColorCategory ? (
          <ul className="flex flex-wrap gap-2 px-4 py-4">
            {categoryList?.map((colorHex) => {
              const isChecked = selectedCategory.includes(colorHex);
              return (
                <li key={colorHex}>
                  <label htmlFor={colorHex} className="cursor-pointer">
                    <input
                      type="checkbox"
                      id={colorHex}
                      checked={isChecked}
                      onChange={() => handleToggle(colorHex)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 box-border transition-all duration-200 ${
                        isChecked
                          ? "border-[#95A4FC] scale-110"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: colorHex }}
                      title={colorHex}
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        ) : isTypeCategory ? (
          <ul className="px-4 py-2 flex flex-col gap-4 text-sm text-[#4B4B4B]">
            {typeList?.map(({ category, subcategories }) => (
              <li key={category}>
                <div className="mb-2 font-semibold">{category}</div>
                <ul className="flex flex-col flex-wrap gap-3 ml-2">
                  {subcategories.map((subcategory) => {
                    const isChecked = selectedCategory.includes(subcategory);
                    return (
                      <li key={subcategory} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={subcategory}
                          checked={isChecked}
                          onChange={() => handleToggle(subcategory)}
                          className="w-3 h-3 accent-[#95A4FC]"
                        />
                        <label htmlFor={subcategory} className="cursor-pointer">
                          {subcategory}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="ml-6 mb-4 mt-2 flex flex-col gap-2 text-sm text-[#4B4B4B]">
            {categoryList?.map((category) => {
              const isChecked = selectedCategory.includes(category);
              return (
                <li
                  key={category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
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
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
    </section>
  );
}

export default FilterOption;
