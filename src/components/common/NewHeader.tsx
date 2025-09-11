import { NewFilterTabBar } from "../filter/NewFilterTabBar";
import { Icon } from "@iconify/react/dist/iconify.js";

function NewHeader() {
  return (
    <header className="items-center w-full pt-5 h-31 border-b border-[#E4E4E4] border-solid shadow-[0_1px_5px_0_rgba(168,168,168,0.05)]">
      <div className="flex items-center justify-between px-12 leading-9 ">
        <span className="text-2xl font-semibold ">FEDIT</span>
        <div className="flex items-center gap-3">
          <Icon icon="uiw:bell" color="#888A8C" className="w-6 h-6" />
          <Icon
            icon="ion:settings-outline"
            color="#888A8C"
            className="w-6 h-6"
          />
          <Icon
            icon="vaadin:line-v"
            color="#E4E4E4"
            className="h-6 scale-y-150"
          />
          <button className="flex items-center justify-center gap-2 h-10 rounded-lg w-25 bg-[#242628] text-base font-semibold text-white">
            사용자 1
            <Icon icon="mingcute:down-fill" className="w-4 h-4" />
          </button>
        </div>
      </div>
      <NewFilterTabBar />
    </header>
  );
}

export default NewHeader;
