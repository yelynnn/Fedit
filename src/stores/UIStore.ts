import { create } from "zustand";

type UIStore = {
  settingsModalTab: string | null;
  openSettingsModal: (tab: string) => void;
  closeSettingsModal: () => void;

  isInterestBrandModalOpen: boolean;
  openInterestBrandModal: () => void;
  closeInterestBrandModal: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  settingsModalTab: null,
  openSettingsModal: (tab) => set({ settingsModalTab: tab }),
  closeSettingsModal: () => set({ settingsModalTab: null }),

  isInterestBrandModalOpen: false,
  openInterestBrandModal: () => set({ isInterestBrandModalOpen: true }),
  closeInterestBrandModal: () => set({ isInterestBrandModalOpen: false }),
}));
