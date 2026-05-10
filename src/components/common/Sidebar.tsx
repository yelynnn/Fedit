import { useState } from "react";
import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import feditLogo from "@/assets/logo/feditLogo.svg";

const TABS_CONFIG = [
  {
    label: "대시보드",
    activeIcon: "material-symbols:dashboard-rounded",
    inactiveIcon: "material-symbols:dashboard-outline-rounded",
  },
  {
    label: "패션쇼 분석",
    activeIcon: "ph:dress-fill",
    inactiveIcon: "ph:dress",
  },
  {
    label: "상품 분석",
    activeIcon: "fluent:tag-32-filled",
    inactiveIcon: "fluent:tag-28-regular",
  },
  {
    label: "색상 분석",
    activeIcon: "zondicons:color-palette",
    inactiveIcon: "qlementine-icons:color-swatch-16",
  },
  {
    label: "유형 분석",
    activeIcon: "ph:chart-pie-slice-fill",
    inactiveIcon: "ph:chart-pie-slice",
  },
];

export default function Sidebar() {
  const { selectedTab, setSelectedTab } = useFilterStore((s) => s);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true",
  );

  const toggleCollapsed = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("sidebar-collapsed", String(value));
  };

  return (
    <aside
      className={`h-screen bg-white border-r border-[#ECEEF0] flex flex-col transition-all duration-300 
        flex-shrink-0 z-40 ${isCollapsed ? "w-[72px]" : "w-[220px]"}`}
    >
      <div
        className={`flex items-center px-5 py-6 ${isCollapsed ? "flex-col gap-2" : "justify-between"}`}
      >
        {!isCollapsed ? (
          <>
            <img src={feditLogo} alt="fedit logo" className="h-7" />
            <button
              onClick={() => toggleCollapsed(true)}
              className="p-1 transition-colors rounded hover:bg-gray-100"
            >
              <Icon
                icon="meteor-icons:angles-left"
                className="w-5 h-5 text-[#888A8C]"
              />
            </button>
          </>
        ) : (
          <div
            className="relative flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden bg-black rounded-md cursor-pointer group transition-all duration-200 hover:bg-[#F6F8FA]"
            onClick={() => toggleCollapsed(false)}
          >
            <img
              src="/feditIcon.png"
              alt="Fedit Icon"
              className="object-contain w-full h-full transition-opacity duration-200 rounded-md group-hover:opacity-0"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[2px]">
              <Icon
                icon="lucide:chevrons-right"
                className="w-6 h-6 text-white"
              />
            </div>
          </div>
        )}
      </div>

      <nav className={`flex-1 px-2 space-y-2 ${isCollapsed ? "mt-2" : "mt-4"}`}>
        {/* 2. TABS_CONFIG를 기반으로 맵핑 */}
        {TABS_CONFIG.map((tab) => {
          const active = selectedTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setSelectedTab(tab.label)}
              className={`w-full flex transition-all duration-200 
          ${
            isCollapsed
              ? "flex-col items-center justify-center"
              : "flex-row items-center p-3 gap-4 rounded-lg"
          } 
          ${!isCollapsed && active ? "bg-[#F2F9E9] text-[#0B0E0F]" : "text-[#6F7173]"}
        `}
            >
              <div
                className={`flex items-center justify-center transition-colors
    ${
      isCollapsed
        ? `w-12 h-12 rounded-xl ${active ? "bg-[#F2F9E9] text-[#0B0E0F] border border-[#F6F8FA]" : "text-[#BABCBE]"}`
        : `${active ? "text-[#0B0E0F]" : "text-[#BABCBE]"}`
    }
  `}
              >
                {/* 3. 현재 탭의 상태(active)에 따라 아이콘 변경 */}
                <Icon
                  icon={active ? tab.activeIcon : tab.inactiveIcon}
                  className={`${isCollapsed ? "w-7 h-7" : "w-6 h-6"}`}
                />
              </div>

              <span
                className={`font-semibold tracking-tighter whitespace-nowrap
          ${isCollapsed ? "text-[11px] leading-tight mt-1" : "text-base"}
          ${active && isCollapsed ? "text-[#0B0E0F]" : ""}
        `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-[#ECEEF0]">
        <button
          className={`w-full flex items-center rounded-xl text-[#6F7173]
            ${isCollapsed ? "flex-col justify-center py-4 gap-1" : "px-4 py-3 gap-3"}`}
        >
          <Icon icon="material-symbols:settings-outline" className="w-6 h-6" />
          <span
            className={`font-semibold ${isCollapsed ? "text-[10px]" : "text-base"}`}
          >
            설정
          </span>
        </button>
      </div>
    </aside>
  );
}
