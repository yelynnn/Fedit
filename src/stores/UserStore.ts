import { create } from "zustand";
import { GetMe } from "@/apis/AuthAPI";

interface UserStore {
  name: string;
  email: string;
  fetchMe: () => Promise<void>;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  name: "",
  email: "",
  fetchMe: async () => {
    try {
      const { name, email } = await GetMe();
      set({ name, email });
    } catch {
      // 실패 시 이전 값을 유지한다.
    }
  },
  reset: () => set({ name: "", email: "" }),
}));
