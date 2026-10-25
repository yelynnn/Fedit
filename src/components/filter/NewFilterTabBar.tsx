import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import DashBoardPage from "@/pages/DashBoardPage";
import NewProductAnalysis from "@/pages/filter/NewProductAnalysis";
import NewColorAnalysis from "@/pages/filter/NewColorAnalysis";
import NewTypeAnalysis from "@/pages/filter/NewTypeAnalysis";
import { useProductStore } from "@/stores/ProductStore";
import { useEffect } from "react";
import RunwayPage from "@/pages/RunwayPage";
import BoardsPage from "@/pages/BoardsPage";
import {
  useSubscriptionStore,
  isBasicPlan,
  getEffectivePlan,
} from "@/stores/SubscriptionStore";
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
  // interestBrandPicks(허용된 고정 개수, REQUIRED_COUNT)는 항상 갱신한다.
  // brandList/platformList(지금 화면에서 필터링 중인 값)는 새로고침 때마다
  // 무조건 픽으로 덮어쓰지 않는다 — brandList나 platformList에 이미 뭔가
  // 담겨 있으면(일부만 남겨뒀든, 무신사 탭에서 추가로 더 골라 픽보다 많아
  // 졌든) 사용자가 의도적으로 고른 것으로 보고 그대로 둔다. 완전히
  // 비어있을 때만 픽으로 채운다. 안 그러면 새로고침할 때마다 사용자가
  // 좁혀두거나 더해둔 선택이 계속 초기화돼버린다.
  // 아직 백엔드 엔드포인트가 없으면 실패하고, 기존 로컬 값을 그대로 둔다.
  // 관심 브랜드 선택 모달(온보딩/설정 어느 쪽이든)이 열려있는 동안에는
  // 사용자가 칩을 고르는 중이라 brandList를 건드리면 안 되므로 건너뛴다.
  //
  // Basic·Pro 둘 다 이제 관심 브랜드(개수 상한만 다름)를 쓰므로 같은 방식으로
  // 처리한다. 둘 다 아니게 되면(Free 등) interestBrandPicks를 비워서 예전
  // 관심 브랜드가 다른 플랜에서까지 "선택 가능"한 상태로 남지 않게 한다.
  //
  // 관심 브랜드가 없는 계정(체험 미시작·만료·Free, 또는 Basic·Pro인데 0개)은
  // 브랜드·플랫폼 필터를 아무것도 보내지 않는다 — 백엔드가 맛보기 범위(현재
  // 샤넬)로 알아서 돌려준다. 예전엔 기본값으로 selectedPlatforms=musinsa를
  // 보냈는데, "샤넬이면서 무신사" 조건이 돼서 0개가 나왔다. 그때 저장된
  // 기본값(플랫폼이 무신사 하나뿐이고 고른 브랜드 없음)도 여기서 비운다.
  // 구독 상태까지 본 요금제로 판단 — 체험 미시작·만료는 plan이 "basic"이어도
  // 관심 브랜드가 없는 계정이다
  const effectivePlan = getEffectivePlan(subscription);

  useEffect(() => {
    if (!loaded || isBrandPicksEditing) return;

    // Enterprise는 브랜드 선택 자체가 없는 무제한 플랜이다(예전의 "무제한
    // Pro"와 동일) — 관심 브랜드 목록만 비워두고, 필터 선택은 건드리지
    // 않는다(Free처럼 무신사로 강제 축소하면 안 된다).
    if (subscription?.plan === "enterprise") {
      setInterestBrandPicks([]);
      return;
    }

    const hasBrandCap =
      effectivePlan !== "none" &&
      effectivePlan !== "expired" &&
      (isBasicPlan(effectivePlan) || effectivePlan === "pro");

    if (!hasBrandCap) {
      setInterestBrandPicks([]);
      const state = useFilterStore.getState();
      if (
        state.brandList.length === 0 &&
        state.platformList.length === 1 &&
        state.platformList[0] === "musinsa"
      ) {
        setPlatformList([]);
      }
      return;
    }

    let ignore = false;
    GetBrandPicks()
      .then((picks) => {
        if (ignore) return;
        // 관심 브랜드를 하나라도 골라뒀으면 그 구성 그대로 분석에 쓴다.
        // 예전엔 상한(REQUIRED_COUNT)을 정확히 채워야만 "완료"로 쳤지만,
        // 이제는 일부만 고르고 나중에 더 채우는 것도 허용하므로 부분
        // 선택도 유효한 값으로 취급한다.
        const hasPicks = picks.length > 0;
        setInterestBrandPicks(hasPicks ? picks : []);
        if (hasPicks) {
          const state = useFilterStore.getState();
          const hasExistingSelection =
            state.brandList.length > 0 || state.platformList.length > 0;
          if (!hasExistingSelection) {
            setBrandList(picks);
            setPlatformList([]);
          }
        } else {
          // 관심 브랜드 0개 — 필터 없이 보내서 백엔드 맛보기 범위(샤넬)로 본다
          setBrandList([]);
          setPlatformList([]);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [
    subscription?.plan,
    effectivePlan,
    loaded,
    isBrandPicksEditing,
    setBrandList,
    setPlatformList,
    setInterestBrandPicks,
  ]);

  const isLocked =
    loaded &&
    subscription?.plan !== "pro" &&
    subscription?.plan !== "enterprise" &&
    PRO_ONLY_TABS.has(selectedTab);

  return (
    <div className="flex-1 h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 상품 분석은 칸마다 따로 스크롤해서 여백을 화면 안에서 둔다. 나머지는 위아래 24px를
          내용과 함께 스크롤되게 둔다(모든 화면 공통) */}
      {selectedTab === "상품 분석" ? (
        <NewProductAnalysis />
      ) : (
        <div className="py-6">
          {selectedTab === "실시간 랭킹" && <DashBoardPage />}
          {selectedTab === "패션쇼 분석" && <RunwayPage />}
          {selectedTab === "색상 분석" && <NewColorAnalysis />}
          {selectedTab === "유형 분석" && <NewTypeAnalysis />}
          {selectedTab === "내 보드" && <BoardsPage />}
        </div>
      )}

      {isLocked && <ProUpgradeOverlay key={selectedTab} featureName={selectedTab} />}
    </div>
  );
}
