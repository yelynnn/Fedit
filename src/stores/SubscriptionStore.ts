import { create } from "zustand";
import { GetSubscription, type Subscription } from "@/apis/BillingAPI";

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
