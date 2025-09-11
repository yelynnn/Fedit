import { useFilterStore } from "@/stores/FilterStore";
import { Icon } from "@iconify/react/dist/iconify.js";
import NewFilterOption from "./NewFilterOption";
import useFilteredData from "@/lib/filteredData";

type Props = {
  onOpenFilter?: () => void;
};

function FilterSideBar({ onOpenFilter }: Props) {
  const { resetFilter } = useFilterStore((state) => state);

  const {
    selectedColors,
    selectedGenders,
    selectedDetails,
    selectedPatterns,
    selectedCategories,
  } = useFilteredData();

  

  return (
    <aside className="relative flex flex-col px-4 pt-5 overflow-x-hidden overflow-y-auto bg-white hide-scrollbar w-52 border-[1px] border-[#ECEEF0] rounded-xl h-fit">
      <div className="flex items-center justify-between">
        <header className="flex items-center gap-2 text-base font-semibold leading-5 text-[#3D3F41]">
          <div className="flex items-center justify-center rounded-lg w-8 h-8 border-[1px] border-[#56585A]">
            <Icon icon="mage:filter" className="w-5 h-5 text-gray-500" />
          </div>
          <p>필터</p>
        </header>
        <div className="flex gap-1">
          <p className="text-xs font-normal text-[#56585A]">초기화</p>
          <Icon
            icon="ri:reset-left-line"
            className="w-3 text-gray-500 cursor-pointer"
            onClick={() => resetFilter()}
          />
        </div>
      </div>
      <NewFilterOption
        filterName="성별"
        filterList={selectedGenders}
        onOpen={onOpenFilter}
      />
      <NewFilterOption
        filterName="유형"
        filterList={selectedCategories}
        onOpen={onOpenFilter}
      />
      <NewFilterOption
        filterName="색상"
        filterList={selectedColors}
        onOpen={onOpenFilter}
      />
      <NewFilterOption
        filterName="디테일"
        filterList={selectedDetails}
        onOpen={onOpenFilter}
      />
      <NewFilterOption
        filterName="패턴"
        filterList={selectedPatterns}
        onOpen={onOpenFilter}
      />
    </aside>
  );
}

export default FilterSideBar;
