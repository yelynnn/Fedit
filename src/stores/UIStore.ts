import { create } from "zustand";

type UIStore = {
  settingsModalTab: string | null;
  openSettingsModal: (tab: string) => void;
  closeSettingsModal: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  settingsModalTab: null,
  openSettingsModal: (tab) => set({ settingsModalTab: tab }),
  closeSettingsModal: () => set({ settingsModalTab: null }),
}));
