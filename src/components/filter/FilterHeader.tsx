import { useFilterStore } from "@/stores/FilterStore";

function FilterHeader() {
  const { selectedTab } = useFilterStore((state) => state);

  return (
    <header className="shrink-0 w-full h-14 bg-[#40424B] pl-7 flex items-center gap-2">
      <div className="text-base font-bold text-white">메인 / {selectedTab}</div>
    </header>
  );
}

export default FilterHeader;
