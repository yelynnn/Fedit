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
import { GetBrandPicks, GetBrandList } from "@/apis/AnalysisAPI";
import { useUIStore } from "@/stores/UIStore";

type ApiCategory = { label: string; brands: string[] };

// Pro를 제외한 모든 플랜(Free/Basic 관심 브랜드 미선택 상태 포함)은 무신사
// 입점 브랜드가 기본 데이터이므로, brandList를 비워두는 대신 무신사 브랜드로
// 채워서 상품 분석 화면이 처음부터 실제 카드로 채워지도록 한다. (온보딩
// 투어의 "첫 상품 카드" 스텝이 빈 목록 때문에 못 뜨는 문제도 함께 해결됨)
const fetchMusinsaBrands = async (): Promise<string[]> => {
  const data = await GetBrandList();
  const cats: ApiCategory[] = Array.isArray(data?.categories)
    ? data.categories
    : [];
  return cats.find((c) => c.label.includes("무신사"))?.brands ?? [];
};

// 무신사 카테고리는 브랜드 수가 100개가 넘어(/menu/brand 응답 기준 120개
// 안팎) 매번 새로 요청하면 낭비가 크다. 모듈 스코프에 캐시해서 세션 동안
// 한 번만 요청하고, 구독 정보 로딩과 동시에(순서를 기다리지 않고) 미리
// 요청을 시작해서 구독 조회가 끝났을 때 이미 응답이 와 있거나 곧 오도록 한다.
let musinsaBrandsPromise: Promise<string[]> | null = null;
const getMusinsaBrands = (): Promise<string[]> => {
  if (!musinsaBrandsPromise) musinsaBrandsPromise = fetchMusinsaBrands();
  return musinsaBrandsPromise;
};

// brandList는 새로고침 시 로컬스토리지 값으로 먼저 복원되어 상품 목록을
// 한 번 불러온 뒤, 이 컴포넌트의 효과가 서버 기준 값(관심 브랜드 픽 또는
// 무신사 기본값)으로 다시 채운다. 두 값이 실제로 같다면 setBrandList를
// 또 호출하지 않아야 상품 목록 API가 중복 호출되지 않는다.
const isSameBrandSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((brand) => setA.has(brand));
};

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
  const setInterestBrandPicks = useFilterStore((s) => s.setInterestBrandPicks);
  const isBrandPicksEditing = useUIStore((s) => s.isBrandPicksEditing);

  useEffect(() => {
    fetchSubscription();
    // 구독 조회 결과를 기다리지 않고 무신사 브랜드 목록도 동시에 미리
    // 받아둔다 — 순차로 기다리면 "구독 조회 → 무신사 목록 조회 → 상품
    // 목록 조회"로 왕복이 이어져 Pro 대비 체감 속도가 크게 느려진다.
    getMusinsaBrands().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basic 플랜이 될 때마다 서버에 저장된 관심 브랜드 픽을 받아온다.
  // (예: Basic→Pro→Basic처럼 플랜을 왔다갔다 해도, 다시 Basic이 될 때마다
  // 로컬에 남아있던 값이 아니라 항상 서버 기준 최신 픽으로 맞춘다.)
  // interestBrandPicks(허용된 고정 10개)는 항상 갱신하고, brandList(지금
  // 화면에서 필터링 중인 값)는 이 시점에만 기본값으로 맞춰준다 — 이후
  // 사용자가 10개 중 일부만 보려고 체크를 풀어도 이 값이 다시 덮어쓰지 않는다.
  // 아직 백엔드 엔드포인트가 없으면 실패하고, 기존 로컬 값을 그대로 둔다.
  // 관심 브랜드 선택 모달(온보딩/설정 어느 쪽이든)이 열려있는 동안에는
  // 사용자가 칩을 고르는 중이라 brandList를 건드리면 안 되므로 건너뛴다.
  //
  // Basic이 아니게 되면(Free/Pro) interestBrandPicks를 비워서 예전 Basic
  // 관심 브랜드 10개가 다른 플랜에서까지 "선택 가능"한 상태로 남지 않게
  // 한다. Free이거나 Basic인데 아직 관심 브랜드를 다 고르지 않았다면
  // brandList를 무신사 입점 브랜드로 채운다 — 상품 분석 화면이 처음부터
  // 빈 목록이 아니라 실제 카드로 채워져야 온보딩 투어의 "첫 상품 카드"
  // 스텝도 정상적으로 뜬다 (Pro는 브랜드 제한이 없는 플랜이라 건드리지 않는다).
  useEffect(() => {
    if (!loaded || isBrandPicksEditing) return;
    let ignore = false;

    const applyMusinsaDefault = () => {
      getMusinsaBrands()
        .then((brands) => {
          if (ignore) return;
          if (!isSameBrandSet(useFilterStore.getState().brandList, brands)) {
            setBrandList(brands);
          }
        })
        .catch(() => {});
    };

    if (!isBasicPlan(subscription?.plan)) {
      setInterestBrandPicks([]);
      if (subscription?.plan !== "pro") applyMusinsaDefault();
      return () => {
        ignore = true;
      };
    }

    GetBrandPicks()
      .then((picks) => {
        if (ignore) return;
        setInterestBrandPicks(picks);
        if (picks.length > 0) {
          if (!isSameBrandSet(useFilterStore.getState().brandList, picks)) {
            setBrandList(picks);
          }
        } else applyMusinsaDefault();
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
