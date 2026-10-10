import { create } from "zustand";
import { GetMe } from "@/apis/AuthAPI";
import { useSubscriptionStore } from "@/stores/SubscriptionStore";

interface UserStore {
  name: string;
  email: string;
  // 관리자 계정 — 요금제 제한 안내·결제 버튼을 띄우지 않는다
  admin: boolean;
  // 미공개 기능의 API 경로 접두사 — 관리자가 아니면 해당 메뉴·화면을 숨긴다
  betaPaths: string[];
  fetchMe: () => Promise<void>;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  name: "",
  email: "",
  admin: false,
  betaPaths: [],
  fetchMe: async () => {
    try {
      const { name, email, admin, betaPaths } = await GetMe();
      const isAdmin = admin === true;
      set({ name, email, admin: isAdmin, betaPaths: Array.isArray(betaPaths) ? betaPaths : [] });
      // 관리자는 요금제와 관계없이 모든 기능을 쓰므로 구독 판정에도 반영한다
      useSubscriptionStore.getState().setAdmin(isAdmin);
    } catch {
      // 실패 시 이전 값을 유지한다.
    }
  },
  reset: () => {
    set({ name: "", email: "", admin: false, betaPaths: [] });
    useSubscriptionStore.getState().setAdmin(false);
  },
}));
