import { create } from "zustand";
import {
  GetSubscription,
  type PlanType,
  type Subscription,
} from "@/apis/BillingAPI";

// 백엔드에 구독 레코드 자체가 없으면(신규 가입 직후 등) GetSubscription이
// null을 준다 — 이건 "무료 플랜을 쓰는 중"이 아니라 "아직 아무 플랜도
// 선택한 적 없음"이라 구분해야 한다. 반대로 subscription.plan === "free"는
// 백엔드가 실제로 free로 명시한 상태(예: 유료 플랜 해지 후)다.
export type EffectivePlan = "none" | "free" | PlanType;

export const getEffectivePlan = (
  subscription: Subscription | null,
): EffectivePlan => (subscription ? subscription.plan : "none");

// "미선택"과 "무료"를 구분할 필요 없이 그냥 무료 등급으로 취급해도 되는
// 곳(브랜드 제한, 결제 랭크 비교 등)에서 쓰는 정규화 헬퍼.
export const toBillingPlan = (
  effective: EffectivePlan,
): "free" | PlanType => (effective === "none" ? "free" : effective);

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
