import type { FilterOptionProps } from "../../../types/Filter";
import { Icon } from "@iconify/react/dist/iconify.js";

function FilterOption({ title }: FilterOptionProps) {
  return (
    <section className="flex w-full border-t border-[#00000040] h-13 items-center justify-between px-4">
      {title}
      <Icon
        icon="heroicons-outline:plus"
        color="#00000066"
        className="w-4 h-4"
      />
    </section>
  );
}

export default FilterOption;
