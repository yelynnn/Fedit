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
import { useSubscriptionStore, isBasicPlan } from "@/stores/SubscriptionStore";
import ProUpgradeOverlay from "@/components/common/ProUpgradeOverlay";
import { GetBrandPicks } from "@/apis/AnalysisAPI";
import { useUIStore } from "@/stores/UIStore";

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
  const setBrandList = useFilterStore((s) => s.setBrandList);
  const setPlatformList = useFilterStore((s) => s.setPlatformList);
  const setInterestBrandPicks = useFilterStore((s) => s.setInterestBrandPicks);
  const isBrandPicksEditing = useUIStore((s) => s.isBrandPicksEditing);

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basic 플랜이 될 때마다 서버에 저장된 관심 브랜드 픽을 받아온다.
  // (예: Basic→Pro→Basic처럼 플랜을 왔다갔다 해도, 다시 Basic이 될 때마다
  // 로컬에 남아있던 값이 아니라 항상 서버 기준 최신 픽으로 맞춘다.)
  // interestBrandPicks(허용된 고정 10개)는 항상 갱신한다. brandList/
  // platformList(지금 화면에서 필터링 중인 값)는 새로고침 때마다 무조건
  // 픽 10개로 덮어쓰지 않는다 — brandList나 platformList에 이미 뭔가
  // 담겨 있으면(10개 중 일부만 남겨뒀든, 무신사 탭에서 추가로 더 골라
  // 11개가 됐든) 사용자가 의도적으로 고른 것으로 보고 그대로 둔다. 완전히
  // 비어있을 때만 픽 10개로 채운다. 안 그러면 새로고침할 때마다 사용자가
  // 좁혀두거나 더해둔 선택이 계속 10개로 초기화돼버린다.
  // 아직 백엔드 엔드포인트가 없으면 실패하고, 기존 로컬 값을 그대로 둔다.
  // 관심 브랜드 선택 모달(온보딩/설정 어느 쪽이든)이 열려있는 동안에는
  // 사용자가 칩을 고르는 중이라 brandList를 건드리면 안 되므로 건너뛴다.
  //
  // Basic이 아니게 되면(Free/Pro) interestBrandPicks를 비워서 예전 Basic
  // 관심 브랜드 10개가 다른 플랜에서까지 "선택 가능"한 상태로 남지 않게
  // 한다. Free이거나 Basic인데 아직 관심 브랜드를 다 고르지 않았다면
  // platformList를 무신사(musinsa)로 채운다 — 개별 브랜드명을 다 나열하면
  // (120개 안팎) 요청 헤더가 너무 커지니, 플랫폼 코드 하나로 대신 보낸다.
  // 상품 분석 화면이 처음부터 빈 목록이 아니라 실제 카드로 채워져야 온보딩
  // 투어의 "첫 상품 카드" 스텝도 정상적으로 뜬다 (Pro는 브랜드 제한이 없는
  // 플랜이라 건드리지 않는다).
  useEffect(() => {
    if (!loaded || isBrandPicksEditing) return;

    if (!isBasicPlan(subscription?.plan)) {
      setInterestBrandPicks([]);
      if (subscription?.plan !== "pro") {
        const state = useFilterStore.getState();
        if (state.brandList.length === 0 && state.platformList.length === 0) {
          setPlatformList(["musinsa"]);
        }
      }
      return;
    }

    let ignore = false;
    GetBrandPicks()
      .then((picks) => {
        if (ignore) return;
        setInterestBrandPicks(picks);
        if (picks.length > 0) {
          const state = useFilterStore.getState();
          const hasExistingSelection =
            state.brandList.length > 0 || state.platformList.length > 0;
          if (!hasExistingSelection) {
            setBrandList(picks);
            setPlatformList([]);
          }
        } else {
          setBrandList([]);
          setPlatformList(["musinsa"]);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [
    subscription?.plan,
    loaded,
    isBrandPicksEditing,
    setBrandList,
    setPlatformList,
    setInterestBrandPicks,
  ]);

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

      {isLocked && <ProUpgradeOverlay key={selectedTab} featureName={selectedTab} />}
    </div>
  );
}
