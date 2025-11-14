import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import DashBoardPage from "@/pages/DashBoardPage";
import NewProductAnalysis from "@/pages/filter/NewProductAnalysis";
import BrandTab from "./BrandTab";
import NewColorAnalysis from "@/pages/filter/NewColorAnalysis";
import NewTypeAnalysis from "@/pages/filter/NewTypeAnalysis";
import { useProductStore } from "@/stores/ProductStore";
import { useEffect } from "react";

type TabOption = { label: string; icon: string };

const TAB_OPTIONS: TabOption[] = [
  { label: "대시보드", icon: "material-symbols:dashboard-rounded" },
  { label: "상품 분석", icon: "streamline-plump:tag-alt-solid" },
  { label: "색상 분석", icon: "material-symbols:palette" },
  { label: "유형 분석", icon: "garden:shapes-fill-16" },
];

export function NewFilterTabBar() {
  const { selectedTab, setSelectedTab } = useFilterStore((s) => s);
  const { setSelectedProductId } = useProductStore((state) => state);

  useEffect(() => {
    setSelectedProductId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  return (
    <div>
      <nav className="flex items-end h-16 gap-8 px-12">
        {TAB_OPTIONS.map(({ label, icon }) => {
          const active = selectedTab === label;
          return (
            <button
              key={label}
              onClick={() => setSelectedTab(label)}
              aria-selected={active}
              className={[
                "h-11 w-22 mx-0.5 rounded-t flex items-center justify-center gap-1",
                "text-base font-semibold px-1",
                active
                  ? "text-[#0B0E0F] border-b-[3px] border-[var(--Line-Primary-Normal,#56585A)]"
                  : "text-[#6F7173] border-b-[3px] border-transparent",
              ].join(" ")}
            >
              <Icon
                icon={icon}
                className={[
                  "w-4 h-4 pointer-events-none",
                  active ? "opacity-100" : "opacity-40",
                ].join(" ")}
              />
              {label}
            </button>
          );
        })}
      </nav>
      {selectedTab !== "대시보드" && (
        <BrandTab isProductTab={selectedTab === "상품 분석"} />
      )}
    </div>
  );
}

export function NewFilterTabPanels() {
  const { selectedTab } = useFilterStore((s) => s);
  return (
    <div className="flex-1 overflow-auto">
      {selectedTab === "대시보드" && <DashBoardPage />}
      {selectedTab === "상품 분석" && <NewProductAnalysis />}
      {selectedTab === "색상 분석" && <NewColorAnalysis />}
      {selectedTab === "유형 분석" && <NewTypeAnalysis />}
    </div>
  );
}
