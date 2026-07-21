import { create } from "zustand";

type UIStore = {
  settingsModalTab: string | null;
  openSettingsModal: (tab: string) => void;
  closeSettingsModal: () => void;

  isInterestBrandModalOpen: boolean;
  openInterestBrandModal: () => void;
  closeInterestBrandModal: () => void;

  isBrandFilterModalOpen: boolean;
  openBrandFilterModal: () => void;
  closeBrandFilterModal: () => void;

  isOnboardingTourOpen: boolean;
  onboardingTourSource: "brand-modal" | "signup";
  openOnboardingTour: (source?: "brand-modal" | "signup") => void;
  closeOnboardingTour: () => void;

  // null이면 사이드바가 평소대로(로컬 저장된 값) 동작, true/false면 온보딩 투어 등에서 강제로 펼치거나 접음
  sidebarCollapseOverride: boolean | null;
  setSidebarCollapseOverride: (value: boolean | null) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  settingsModalTab: null,
  openSettingsModal: (tab) => set({ settingsModalTab: tab }),
  closeSettingsModal: () => set({ settingsModalTab: null }),

  isInterestBrandModalOpen: false,
  openInterestBrandModal: () => set({ isInterestBrandModalOpen: true }),
  closeInterestBrandModal: () => set({ isInterestBrandModalOpen: false }),

  isBrandFilterModalOpen: false,
  openBrandFilterModal: () => set({ isBrandFilterModalOpen: true }),
  closeBrandFilterModal: () => set({ isBrandFilterModalOpen: false }),

  isOnboardingTourOpen: false,
  onboardingTourSource: "brand-modal",
  openOnboardingTour: (source) =>
    set({ isOnboardingTourOpen: true, onboardingTourSource: source ?? "brand-modal" }),
  closeOnboardingTour: () => set({ isOnboardingTourOpen: false }),

  sidebarCollapseOverride: null,
  setSidebarCollapseOverride: (value) => set({ sidebarCollapseOverride: value }),
}));
