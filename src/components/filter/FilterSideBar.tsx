import { useFilterStore } from "@/stores/FilterStore";
import { Icon } from "@iconify/react";
import NewFilterOption from "./NewFilterOption";
import useFilteredData from "@/lib/filteredData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FilterSideBar({ onOpenFilter }: { onOpenFilter?: (tab: string) => void }) {
  const {
    resetFilter,
    selectedYear,
    selectedSeason,
    setSelectedYear,
    setSelectedSeason,
    resetSeason,
  } = useFilterStore();
  const data = useFilteredData();

  return (
    <aside className="flex flex-col gap-3 w-53 h-fit p-2 bg-surface-base rounded-xl ">
      <div className="flex w-full gap-2">
        <Select
          value={selectedYear}
          onValueChange={(v) => setSelectedYear(v === "all" ? "" : v)}
        >
          <SelectTrigger className="flex-1 h-10 bg-white rounded-tl-lg border-none text-sm font-semibold text-tx-neutral shadow-none focus:ring-0 [&>span]:font-medium">
            <SelectValue placeholder="년도" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-line-divider">
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="2025">2025년</SelectItem>
            <SelectItem value="2026">2026년</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedSeason}
          onValueChange={(v) => setSelectedSeason(v === "all" ? "" : v)}
        >
          <SelectTrigger className="flex-1 h-10 bg-white rounded-tr-lg border-none text-sm font-medium text-tx-neutral shadow-none focus:ring-0 [&>span]:font-medium">
            <SelectValue placeholder="시즌" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-line-divider">
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="SS">SS</SelectItem>
            <SelectItem value="FW">FW</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <NewFilterOption
          filterName="성별"
          filterList={data.selectedGenders}
          onOpen={onOpenFilter}
        />
        <NewFilterOption
          filterName="유형"
          filterList={data.selectedCategories}
          onOpen={onOpenFilter}
        />
        <NewFilterOption
          filterName="색상"
          filterList={data.selectedColors}
          onOpen={onOpenFilter}
        />
        <NewFilterOption
          filterName="디테일"
          filterList={data.selectedDetails}
          onOpen={onOpenFilter}
        />
        <NewFilterOption
          filterName="패턴"
          filterList={data.selectedPatterns}
          onOpen={onOpenFilter}
        />
        <NewFilterOption
          filterName="무드"
          filterList={[]}
          onOpen={onOpenFilter}
        />
      </div>

      <button
        onClick={() => {
          resetFilter();
          resetSeason();
        }}
        className="flex items-center justify-center gap-2 w-full h-8 bg-white rounded-lg border border-line-divider text-tx-neutral text-sm font-medium shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
      >
        <Icon icon="nrk:rotate" className="w-4 h-4 text-tx-neutral" />
        <span>초기화</span>
      </button>
    </aside>
  );
}

export default FilterSideBar;
