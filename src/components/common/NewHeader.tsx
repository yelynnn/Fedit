import { NewFilterTabBar } from "../filter/NewFilterTabBar";
import { Icon } from "@iconify/react/dist/iconify.js";
import logo from "@/assets/logo/feditLogo.svg";

function NewHeader() {
  return (
    <header className="items-center w-full pt-5 h-29 border-b border-[#E4E4E4] border-solid shadow-[0_1px_5px_0_rgba(168,168,168,0.05)]">
      <div className="flex items-center justify-between px-12 leading-9 ">
        <img src={logo} alt="fedit icon" className="h-8" />
        <div className="flex items-center gap-3">
          <Icon icon="uiw:bell" color="#3D3F41" className="w-5 h-5" />
          <Icon
            icon="ion:settings-outline"
            color="#3D3F41"
            className="w-5 h-5"
          />
          <Icon
            icon="pepicons-pop:line-y"
            color="#BABCBE"
            className="h-6 scale-y-150"
          />
          <p className="text-base font-semibold text-[#3D3F41]">사용자 1</p>
        </div>
      </div>
      <NewFilterTabBar />
    </header>
  );
}

export default NewHeader;
