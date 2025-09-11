import { useState } from "react";
import { Icon } from "@iconify/react";
import FilterTabs from "./FilterModalTab";
import FilterCheckList from "./FilterCheckList";
import { useFilterStore } from "@/stores/FilterStore";

const TAB_LABELS = ["성별", "유형", "색상", "디테일", "패턴"];

type Props = { onClose: () => void };

export default function SideFilterModal({ onClose }: Props) {
  const [active, setActive] = useState<string>("성별");
  const { resetFilter } = useFilterStore((state) => state);

  return (
    <section className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-xl font-semibold text-[#3D3F41]">필터</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
          <Icon icon="fontisto:close-a" width={18} className="text-[#888A8C]" />
        </button>
      </div>

      <FilterTabs tabs={TAB_LABELS} active={active} onChange={setActive} />

      <div className="flex-1 p-4 overflow-y-auto">
        {active === "성별" && <FilterCheckList title="성별" />}
        {active === "유형" && <FilterCheckList title="유형" />}
        {active === "색상" && <FilterCheckList title="색상" />}
        {active === "디테일" && <FilterCheckList title="디테일" />}
        {active === "패턴" && <FilterCheckList title="패턴" />}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <button
          onClick={onClose}
          className="h-10 rounded-lg bg-[#242628] text-white font-semibold"
        >
          상품보기
        </button>
        <button
          className="flex items-center gap-2 mx-auto text-sm text-gray-500"
          onClick={() => resetFilter()}
        >
          <Icon icon="ri:reset-left-line" width={16} />
          선택 초기화하기
        </button>
      </div>
    </section>
  );
}
