import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import DashBoardPage from "@/pages/DashBoardPage";
import NewProductAnalysis from "@/pages/filter/NewProductAnalysis";
import BrandTab from "./BrandTab";
import NewColorAnalysis from "@/pages/filter/NewColorAnalysis";
import NewTypeAnalysis from "@/pages/filter/NewTypeAnalysis";
import { useProductStore } from "@/stores/ProductStore";
import { useEffect } from "react";
import RunwayPage from "@/pages/RunwayPage";
import BoardsPage from "@/pages/BoardsPage";
import { useSubscriptionStore } from "@/stores/SubscriptionStore";
import ProUpgradeOverlay from "@/components/common/ProUpgradeOverlay";

// PRO 요금제에서만 이용 가능한 탭
const PRO_ONLY_TABS = new Set(["색상 분석", "유형 분석", "패션쇼 분석"]);

type TabOption = { label: string; icon: string };

const TAB_OPTIONS: TabOption[] = [
  { label: "실시간 랭킹", icon: "material-symbols:dashboard-rounded" },
  { label: "패션쇼 분석", icon: "material-symbols:dashboard-rounded" },
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
                "h-11 w-fit mx-0.5 rounded-t flex items-center justify-center gap-1",
                "text-base font-semibold px-1",
                active
                  ? "text-tx-strong border-b-[3px] border-[var(--Line-Primary-Normal,#56585A)]"
                  : "text-tx-alt border-b-[3px] border-transparent",
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
      {selectedTab !== "실시간 랭킹" && selectedTab !== "내 보드" && (
        <BrandTab isProductTab={selectedTab === "상품 분석"} />
      )}
    </div>
  );
}

export function NewFilterTabPanels() {
  const { selectedTab } = useFilterStore((s) => s);
  const { subscription, loaded, fetchSubscription } = useSubscriptionStore(
    (s) => s,
  );

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLocked =
    loaded && subscription?.plan !== "pro" && PRO_ONLY_TABS.has(selectedTab);

  return (
    <div className="flex-1 h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {selectedTab === "실시간 랭킹" && <DashBoardPage />}
      {selectedTab === "패션쇼 분석" && <RunwayPage />}
      {selectedTab === "상품 분석" && <NewProductAnalysis />}
      {selectedTab === "색상 분석" && <NewColorAnalysis />}
      {selectedTab === "유형 분석" && <NewTypeAnalysis />}
      {selectedTab === "내 보드" && <BoardsPage />}

      {isLocked && <ProUpgradeOverlay featureName={selectedTab} />}
    </div>
  );
}
