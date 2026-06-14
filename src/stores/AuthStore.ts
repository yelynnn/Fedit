import { create } from "zustand";

interface AuthStore {
  isSessionExpired: boolean;
  setSessionExpired: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isSessionExpired: false,
  setSessionExpired: (value) => set({ isSessionExpired: value }),
}));
