import { create } from "zustand";
import {
  GetSubscription,
  type PlanType,
  type Subscription,
} from "@/apis/BillingAPI";

// status: "not_started"는 회원가입 직후 무료체험조차 시작하지 않은 상태,
// "expired"는 무료체험/유료 플랜 기간이 끝나고 갱신하지 않은 상태다. 이
// 둘은 subscription.plan 값과 무관하게 상태 자체로 구분해야 한다.
export type EffectivePlan = "none" | "expired" | "free" | PlanType;

export const getEffectivePlan = (
  subscription: Subscription | null,
): EffectivePlan => {
  if (!subscription || subscription.status === "not_started") return "none";
  if (subscription.status === "expired") return "expired";
  return subscription.plan;
};

// "미선택"/"만료"/"무료"를 구분할 필요 없이 그냥 무료 등급으로 취급해도 되는
// 곳(브랜드 제한, 결제 랭크 비교 등)에서 쓰는 정규화 헬퍼. basic_secret은
// Basic과 기능이 완전히 동일하므로 항상 "basic"으로 합친다.
export const toBillingPlan = (
  effective: EffectivePlan,
): "free" | "basic" | "pro" => {
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

type SubscriptionStore = {
  subscription: Subscription | null;
  loaded: boolean;
  fetchSubscription: () => Promise<void>;
  setSubscription: (subscription: Subscription | null) => void;
};

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscription: null,
  loaded: false,
  fetchSubscription: async () => {
    try {
      const subscription = await GetSubscription();
      set({ subscription, loaded: true });
    } catch {
      set({ subscription: null, loaded: true });
    }
  },
  setSubscription: (subscription) => set({ subscription, loaded: true }),
}));
