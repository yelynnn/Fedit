import { Icon } from "@iconify/react";
import DoubleChart from "../chart/DoubleChart";

function MainTypeBox() {
  return (
    <section className="box-border w-full max-h-114 max-w-222 rounded-xl border border-[#ECEEF0] bg-white px-6 py-5 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center min-w-0 min-h-0 gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#EAF2FE]">
          <Icon
            icon="iconamoon:trend-up-light"
            className="w-6 h-6 text-[#1A75FF]"
          />
        </div>
        <span className="text-base font-semibold text-[#3D3F41]">
          급상승 유형
        </span>
      </div>

      <p className="text-base font-semibold text-[#888A8C] min-w-0">
        최근 1년간 변동 추이를 보여주는 그래프입니다.
      </p>

      <DoubleChart />
    </section>
  );
}

export default MainTypeBox;
