import { Icon } from "@iconify/react";
import { useState } from "react";
import { brandData } from "../../../data/BrandCategories";
import { useBrandStore } from "../../../stores/BrandStore";

type BrandCategory = keyof typeof brandData;
const BrandCategories = Object.keys(brandData) as BrandCategory[];

function BrandOptions() {
  const { brandList, addBrand, removeBrand } = useBrandStore((state) => state);
  const [openCategories, setOpenCategories] = useState<BrandCategory[]>([]);

  const toggleCategory = (category: BrandCategory) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {BrandCategories.map((category) => (
        <div key={category}>
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => toggleCategory(category)}
          >
            <Icon
              icon="weui:arrow-outlined"
              className={`w-4 h-4 text-[#1C1C1C66] transition-transform duration-200 ${
                openCategories.includes(category) ? "rotate-90" : ""
              }`}
            />
            <span className="text-sm text-[#1C1C1C]">{category} 브랜드</span>
          </div>

          {openCategories.includes(category) && (
            <ul className="ml-6 mt-2 flex flex-col gap-2 text-sm text-[#4B4B4B]">
              {brandData[category].map((brand) => {
                const isChecked = brandList.includes(brand);
                return (
                  <li key={brand} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={brand}
                        checked={isChecked}
                        onChange={() =>
                          isChecked ? removeBrand(brand) : addBrand(brand)
                        }
                        className="w-3 h-3 accent-[#95A4FC]"
                      />
                      <label htmlFor={brand} className="cursor-pointer">
                        {brand}
                      </label>
                    </div>
                    <span className="text-[7px] text-[#00000066]">764,548</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default BrandOptions;
