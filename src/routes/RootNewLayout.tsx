import { useEffect } from "react";
import { Icon } from "@iconify/react";
import Sidebar from "@/components/common/Sidebar";
import { useChatStore } from "@/stores/ChatStore";
import { useUIStore } from "@/stores/UIStore";
import NewHeader from "@/components/common/NewHeader";
import { NewFilterTabPanels } from "@/components/filter/NewFilterTabBar";
import SessionExpiredModal from "@/components/common/SessionExpiredModal";
import AgentChat from "@/components/agent/AgentChat";
import SettingsPage from "@/pages/SettingsPage";
import InterestBrandModal from "@/components/billing/InterestBrandModal";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { useFilterStore } from "@/stores/FilterStore";
import { CaptureGuard } from "@/capture-guard";
import { SHOW_PRICING_AFTER_SIGNUP_KEY, setSecretEntry } from "@/lib/secretEntry";
import {
  isPendingBasicDowngrade,
  clearPendingBasicDowngrade,
} from "@/lib/pendingDowngrade";
import { useSubscriptionStore } from "@/stores/SubscriptionStore";

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
  const setSelectedTab = useFilterStore((s) => s.setSelectedTab);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const subscriptionLoaded = useSubscriptionStore((s) => s.loaded);

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
        <NewHeader />

        <main
          className="relative flex-1 overflow-auto bg-white [contain:layout]"
          data-capture-protect
        >
          <div className="h-full py-8">
            <NewFilterTabPanels />
          </div>
        </main>
      </div>

      {settingsModalTab !== null && <SettingsPage />}

      <InterestBrandModal
        isOpen={isInterestBrandModalOpen}
        onClose={handleCloseInterestBrandModal}
      />

      <OnboardingTour />

      {/* FEDI Agent 플로팅 버튼 & 채팅창 */}
      <div className="fixed z-50 flex flex-col items-end gap-3 bottom-6 right-6">
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
