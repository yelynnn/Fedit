import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import Sidebar from "@/components/common/Sidebar";
import { AGENT_TAB, useChatStore } from "@/stores/ChatStore";
import { useUIStore } from "@/stores/UIStore";
import NewHeader from "@/components/common/NewHeader";
import { NewFilterTabPanels } from "@/components/filter/NewFilterTabBar";
import SessionExpiredModal from "@/components/common/SessionExpiredModal";
import AgentChat from "@/components/agent/AgentChat";
import SettingsPage from "@/pages/SettingsPage";
import AgentPage from "@/pages/AgentPage";
import InterestBrandModal from "@/components/billing/InterestBrandModal";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { useFilterStore } from "@/stores/FilterStore";
import { CaptureGuard } from "@/capture-guard";
import { SHOW_PRICING_AFTER_SIGNUP_KEY, setSecretEntry } from "@/lib/secretEntry";
import {
  isPendingBasicDowngrade,
  clearPendingBasicDowngrade,
} from "@/lib/pendingDowngrade";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
  isTrial,
} from "@/stores/SubscriptionStore";
import {
  trackFeatureViewed,
  trackBrandFilterChanged,
  identifyUser,
  trackTrialStartedOnce,
} from "@/lib/analytics";
import { GetBrandPicks } from "@/apis/AnalysisAPI";
import { GetMe } from "@/apis/AuthAPI";

function RootNewLayout() {
  const { isAgentOpen, activeConversationId, openAgent, closeAgent } =
    useChatStore((s) => s);
  const {
    settingsModalTab,
    isInterestBrandModalOpen,
    openInterestBrandModal,
    closeInterestBrandModal,
    openOnboardingTour,
    openSettingsModal,
  } = useUIStore();
  const selectedTab = useFilterStore((s) => s.selectedTab);
  // 사이드바 "FEDI Agent" — 전체화면 챗봇. 이 화면에서는 플로팅 버튼을 숨긴다.
  const isAgentPage = selectedTab === AGENT_TAB;
  const setSelectedTab = useFilterStore((s) => s.setSelectedTab);
  const brandList = useFilterStore((s) => s.brandList);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const subscriptionLoaded = useSubscriptionStore((s) => s.loaded);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);

  // 요금제는 분석 화면(NewFilterTabPanels)에서만 불러오고 있어서, FEDI Agent
  // 전체화면에서 새로고침하면 한 번도 불러오지 않아 Enterprise도 입력이
  // 막혔다. 어느 화면으로 들어오든 여기서 한 번은 불러온다.
  useEffect(() => {
    if (!subscriptionLoaded) fetchSubscription();
  }, [subscriptionLoaded, fetchSubscription]);

  // feature_viewed — 사이드바 탭 전환 시(최초 진입 포함) 매번 전송한다. 제품은
  // URL이 안 바뀌는 구조라 GA4 자동 페이지 조회로는 못 잡는다. selectedTab은
  // 새로고침에도 유지되는(persist) 값이라, 특정 탭에 머문 채로 새로고침해도
  // 이 effect가 마운트 시 한 번 더 쏴줘서 "최초 진입"을 놓치지 않는다.
  // brandList는 탭 전환 시점의 값만 실어 보낸다 — 탭 안 바꾸고 브랜드만
  // 바꿀 때마다 다시 쏘면 "화면 조회" 지표가 아니라 "필터 변경" 지표가
  // 돼버리므로, 일부러 deps에서 뺐다.
  // "상품 분석"은 product_count(첫 로드된 상품 수)를 실어야 해서, 그 값을
  // 실제로 아는 NewProductAnalysis.tsx 안에서 자체적으로 보낸다 — 여기서
  // 또 보내면 같은 조회에 이벤트가 두 번 나간다. "내 보드"는 여기서도
  // 그대로 보내되(탭에 막 들어왔을 땐 보드 목록만 보여서 상품 수가 없다),
  // 특정 보드를 열면 BoardsPage.tsx가 product_count를 실어 한 번 더 보낸다.
  useEffect(() => {
    if (selectedTab === "상품 분석") return;
    trackFeatureViewed(selectedTab, brandList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  // 같은 탭 안에서 브랜드 필터만 바꿀 때 — 첫 렌더(복원된 값)는 건너뛰고,
  // 여러 브랜드를 연달아 체크하는 경우를 한 건으로 묶으려고 1초 뒤에 보낸다.
  const brandFilterMountedRef = useRef(false);
  useEffect(() => {
    if (!brandFilterMountedRef.current) {
      brandFilterMountedRef.current = true;
      return;
    }
    const t = setTimeout(() => trackBrandFilterChanged(selectedTab, brandList), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandList]);

  const handleCloseInterestBrandModal = () => {
    closeInterestBrandModal();
    setSelectedTab("상품 분석");
    openOnboardingTour();
  };

  // 마케팅 랜딩페이지(?ref=vip 또는 ?ref=landing)를 거쳐 방금 회원가입을
  // 마친 경우, 첫 로그인 직후 바로 요금제 화면으로 보내 결제로 이어지게 한다.
  useEffect(() => {
    if (localStorage.getItem(SHOW_PRICING_AFTER_SIGNUP_KEY) !== "true") return;
    localStorage.removeItem(SHOW_PRICING_AFTER_SIGNUP_KEY);
    openSettingsModal("구독");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 직후든 새로고침에 의한 세션 복원이든, 인증된 상태로 이 화면이
  // 뜨는 시점은 결국 여기 한 곳이라 Amplitude 사용자 식별을 여기서만
  // 처리한다. plan/status가 바뀔 때(결제·체험 전환 등)도 다시 불러서
  // 프로필을 최신으로 유지한다.
  useEffect(() => {
    // 구독이 없는(가입만 한) 사용자도 식별해야 해서 subscription이 null이어도 진행한다.
    if (!subscriptionLoaded) return;
    (async () => {
      try {
        // GET /brand/picks는 Basic/Pro 계정에만 있는 개념이라 Enterprise·
        // Free(가입만 한 상태 포함) 계정으로 부르면 서버가 403을 낸다 —
        // 콘솔에 불필요한 에러가 남지 않도록 애초에 안 부른다.
        const rawPlan = subscription?.plan;
        const hasBrandPicks =
          rawPlan === "basic" ||
          rawPlan === "basic_secret" ||
          rawPlan === "pro";
        const [me, monitoredBrands] = await Promise.all([
          GetMe(),
          hasBrandPicks ? GetBrandPicks().catch(() => []) : Promise.resolve([]),
        ]);
        // 가입만 한 사람은 none, 체험 중이면 trial, 결제해야 basic/pro/enterprise.
        const billing = toBillingPlan(getEffectivePlan(subscription));
        const plan = isTrial(subscription)
          ? "trial"
          : billing === "free"
            ? "none"
            : billing;
        identifyUser(me.email, plan, me.name, monitoredBrands);
        // 채팅 기록은 브라우저에 저장돼서, 다른 계정으로 로그인하면 비운다
        if (me.email) useChatStore.getState().syncOwner(me.email);
        if (plan === "trial") trackTrialStartedOnce(me.email, subscription?.plan ?? "basic");
      } catch {
        // 식별 실패는 무시한다 — 화면 동작에 영향을 주면 안 된다.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionLoaded, subscription?.plan, subscription?.status]);

  // pro→basic 다운그레이드 신청 시 SettingsPage가 남겨둔 "적용 대기" 플래그를
  // 여기서 소비한다. 다음 결제일이 지나 실제로 basic으로 전환된 뒤 첫 진입에서만
  // 브랜드 온보딩 모달을 딱 한 번 띄우고, 그 즉시 플래그를 지운다. 재업그레이드 등
  // basic으로 전환되지 않은 채 대기 상태가 풀린 경우엔 모달 없이 플래그만 정리한다.
  useEffect(() => {
    if (!subscriptionLoaded || !subscription) return;
    if (!isPendingBasicDowngrade()) return;
    if (subscription.downgradePending) return;
    clearPendingBasicDowngrade();
    if (subscription.plan === "basic") openInterestBrandModal();
  }, [subscriptionLoaded, subscription, openInterestBrandModal]);

  // 백엔드가 관심 브랜드 제한을 Pro까지 확장하면서, 이미 Pro였던 기존
  // 계정은 관심 브랜드를 하나도 안 고른 채로 남아있다. 이 상태로는 상품
  // 조회가 전부 기본값(샤넬) 하나로만 나가서 서비스가 거의 비어 보이므로,
  // 결제 직후에만 모달을 띄우는 기존 흐름과 별개로 basic/pro인데 관심
  // 브랜드가 하나도 없는 계정은 앱 진입 시 바로 모달을 띄워 선택을
  // 유도한다. 앱이 떠 있는 동안 한 번만 확인하고(새로고침하면 다시 확인),
  // "나중에 하기"로 닫아도 이후 구독 상태 갱신 때마다 다시 뜨지 않게
  // ref로 막는다.
  const hasCheckedInitialBrandPicksRef = useRef(false);
  useEffect(() => {
    if (!subscriptionLoaded || !subscription) return;
    if (hasCheckedInitialBrandPicksRef.current) return;
    if (subscription.downgradePending) return;
    const plan = subscription.plan;
    if (plan !== "basic" && plan !== "basic_secret" && plan !== "pro") return;
    hasCheckedInitialBrandPicksRef.current = true;
    GetBrandPicks()
      .then((picks) => {
        if (picks.length === 0) openInterestBrandModal();
      })
      .catch(() => {});
  }, [subscriptionLoaded, subscription, openInterestBrandModal]);

  // 개발 중 결제 없이 모달을 확인하기 위한 디버그 트리거: /?showBrandModal=1
  // 온보딩 투어만 바로 확인하려면: /?showOnboarding=signup (또는 pro, brand-modal)
  // 비밀 링크로 들어와서 방금 회원가입을 마친 상황을 실제 가입 없이
  // 흉내내려면: /?simulateSecretSignup=1 (로그인은 돼 있어야 함 — 기존
  // 계정으로 로그인한 상태에서 이 주소로 들어오면 됨)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("showBrandModal")) {
      openInterestBrandModal();
    }
    if (params.get("simulateSecretSignup")) {
      setSecretEntry();
      setSelectedTab("상품 분석");
      openSettingsModal("구독");
    }
    if (params.get("showOnboarding")) {
      setSelectedTab("상품 분석");
      openOnboardingTour(
        (params.get("showOnboarding") as "signup" | "pro" | "brand-modal") ||
          "signup",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const guard = new CaptureGuard({
      identity: () => "",
      focusMask: { mode: "blur", blurPx: 20, maskOnWindowBlur: false },
    });
    guard.setWatermark(false);
    guard.setSpeedBumps(false);
    guard.start();

    const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
    let reloadTimer: number | null = null;
    const scheduleReload = () => {
      if (reloadTimer !== null) return;
      reloadTimer = window.setTimeout(() => window.location.reload(), 2500);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        scheduleReload();
        return;
      }
      if (!isMac && e.metaKey && e.shiftKey && e.code === "KeyS") {
        scheduleReload();
        return;
      }
      if (isMac && e.metaKey && e.shiftKey) scheduleReload();
    };
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      guard.stop();
      window.removeEventListener("keydown", onKeyDown, true);
      if (reloadTimer !== null) clearTimeout(reloadTimer);
    };
  }, []);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      <Sidebar />

      <div className="flex flex-col flex-1 h-full min-w-0">
        {isAgentPage ? (
          <main className="relative flex-1 min-h-0 bg-white" data-capture-protect>
            <AgentPage />
          </main>
        ) : (
          <>
            <NewHeader />

            <main
              className="relative flex-1 overflow-auto bg-white [contain:layout]"
              data-capture-protect
            >
              <div className="h-full py-8">
                <NewFilterTabPanels />
              </div>
            </main>
          </>
        )}
      </div>

      {settingsModalTab !== null && <SettingsPage />}

      <InterestBrandModal
        isOpen={isInterestBrandModalOpen}
        onClose={handleCloseInterestBrandModal}
      />

      <OnboardingTour />

      {/* FEDI Agent 플로팅 버튼 & 채팅창 — 전체화면(FEDI Agent 탭)에서는 숨김 */}
      <div
        className={`fixed z-50 flex flex-col items-end gap-3 bottom-6 right-6 ${isAgentPage ? "hidden" : ""}`}
      >
        {isAgentOpen && activeConversationId && (
          <AgentChat
            key={activeConversationId}
            conversationId={activeConversationId}
            onClose={closeAgent}
          />
        )}
        <button
          onClick={() => (isAgentOpen ? closeAgent() : openAgent())}
          title="FEDI Agent (베타 테스트 중)"
          className="flex items-center justify-center w-12 h-12 transition-colors bg-gray-900 rounded-full shadow-lg hover:bg-gray-700"
        >
          <Icon
            icon={isAgentOpen ? "mdi:close" : "ph:star-four-fill"}
            width={20}
            className="text-white"
          />
        </button>
      </div>

      <div id="modal-root" />

      <SessionExpiredModal />
    </div>
  );
}

export default RootNewLayout;
