import { create } from "zustand";
import {
  GetSubscription,
  type Subscription,
  type SubscriptionPlan,
} from "@/apis/BillingAPI";

// status: "not_started"는 회원가입 직후 무료체험조차 시작하지 않은 상태,
// "expired"는 무료체험/유료 플랜 기간이 끝나고 갱신하지 않은 상태다. 이
// 둘은 subscription.plan 값과 무관하게 상태 자체로 구분해야 한다.
export type EffectivePlan = "none" | "expired" | SubscriptionPlan;

export const getEffectivePlan = (
  subscription: Subscription | null,
): EffectivePlan => {
  if (!subscription || subscription.status === "not_started") return "none";
  if (subscription.status === "expired") return "expired";
  // 무료 체험(trial) 중에는 plan이 "basic"으로 오므로 그대로 반환한다 —
  // 체험 사용자는 Basic 기능/게이팅을 그대로 받는다.
  return subscription.plan;
};

// 5일 무료 체험(Basic) 이용 중인지. 현재 요금제 표시·결제 유도 버튼 분기에서
// "이미 결제한 Basic"과 구분하려고 쓴다.
export const isTrial = (subscription: Subscription | null): boolean =>
  subscription?.status === "trial";

// 무료 체험이 끝나는 날(ISO). 백엔드가 trialEndsAt를 아직 안 내려주면
// nextBillingDate로 폴백한다.
export const getTrialEndsAt = (
  subscription: Subscription | null,
): string | null =>
  subscription?.trialEndsAt ?? subscription?.nextBillingDate ?? null;

// "미선택"/"만료"/"무료"를 구분할 필요 없이 그냥 무료 등급으로 취급해도 되는
// 곳(브랜드 제한, 결제 랭크 비교 등)에서 쓰는 정규화 헬퍼. basic_secret은
// Basic과 기능이 완전히 동일하므로 항상 "basic"으로 합친다. enterprise는
// 자체 결제 대상이 아닌 별도 최상위 플랜이라 그대로 통과시킨다.
export const toBillingPlan = (
  effective: EffectivePlan,
): "free" | "basic" | "pro" | "enterprise" => {
  if (effective === "none" || effective === "expired") return "free";
  if (effective === "basic_secret") return "basic";
  return effective;
};

// subscription.plan을 직접 비교하는 곳(예: 원본 plan 값이 필요한 필터/게이팅
// 로직)에서 basic_secret을 basic과 동일하게 취급하기 위한 헬퍼.
export const isBasicPlan = (plan: Subscription["plan"] | undefined): boolean =>
  plan === "basic" || plan === "basic_secret";

// 무료체험 미시작/만료 상태 — 실시간 랭킹·상품 분석 등 잠금이 필요한
// 화면에서 공통으로 쓰는 판정 헬퍼.
export const isLockedPlan = (effective: EffectivePlan): boolean =>
  effective === "none" || effective === "expired";

// 관리자 계정은 요금제와 관계없이 모든 기능을 쓴다. 화면 곳곳의 요금제
// 판정(getEffectivePlan·toBillingPlan·isLockedPlan 등)이 모두 subscription을
// 보고 있어서, 관리자면 subscription 자체를 "모든 기능이 열린 Enterprise
// 이용 중"으로 바꿔서 내보낸다 — 잠금·업그레이드 유도가 한 번에 꺼진다.
// 실제 서버 구독 정보는 rawSubscription에 그대로 둔다.
// 로컬 개발 전용 — 요금제 상태별 화면을 지금 로그인한 계정으로 확인한다.
//   /?simulatePlan=none     체험 미시작(not_started)
//   /?simulatePlan=expired  체험·구독 만료
//   /?simulatePlan=trial | basic | pro | enterprise
// 화면 판정만 바뀌고 서버가 주는 데이터(상품 범위 등)는 실제 계정 그대로다.
// 배포(프로덕션) 빌드에서는 동작하지 않는다.
export const SIMULATED_SUBSCRIPTION: Subscription | null = (() => {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  const plan = new URLSearchParams(window.location.search).get("simulatePlan");
  const base = { amount: 0, hasBillingKey: false, nextBillingDate: null, cancelAtPeriodEnd: false, downgradePending: false };
  switch (plan) {
    case "none":
      return { ...base, plan: "basic", status: "not_started" };
    case "expired":
      return { ...base, plan: "basic", status: "expired" };
    case "trial":
      return { ...base, plan: "basic", status: "trial" };
    case "basic":
    case "pro":
    case "enterprise":
      return { ...base, plan, status: "active" };
    default:
      return null;
  }
})();
if (SIMULATED_SUBSCRIPTION) {
  console.info(`[dev] simulatePlan 적용 중: ${SIMULATED_SUBSCRIPTION.plan}/${SIMULATED_SUBSCRIPTION.status}`);
}

// 화면에 쓸 구독: 개발용 시뮬레이션 > 관리자 > 실제 구독
const effectiveSubscription = (raw: Subscription | null, isAdmin: boolean) =>
  SIMULATED_SUBSCRIPTION ?? (isAdmin ? ADMIN_SUBSCRIPTION : raw);

const ADMIN_SUBSCRIPTION: Subscription = {
  plan: "enterprise",
  status: "active",
  amount: 0,
  hasBillingKey: false,
  nextBillingDate: null,
  cancelAtPeriodEnd: false,
  downgradePending: false,
};

type SubscriptionStore = {
  subscription: Subscription | null;
  rawSubscription: Subscription | null;
  isAdmin: boolean;
  loaded: boolean;
  fetchSubscription: () => Promise<void>;
  setSubscription: (subscription: Subscription | null) => void;
  setAdmin: (isAdmin: boolean) => void;
};

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  rawSubscription: null,
  isAdmin: false,
  loaded: false,
  fetchSubscription: async () => {
    try {
      get().setSubscription(await GetSubscription());
    } catch {
      get().setSubscription(null);
    }
  },
  setSubscription: (subscription) =>
    set({
      rawSubscription: subscription,
      subscription: effectiveSubscription(subscription, get().isAdmin),
      loaded: true,
    }),
  setAdmin: (isAdmin) =>
    set((state) => ({
      isAdmin,
      subscription: effectiveSubscription(state.rawSubscription, isAdmin),
      // 관리자면 구독 응답을 기다릴 필요 없이 바로 판정할 수 있다
      loaded: isAdmin ? true : state.loaded,
    })),
}));
