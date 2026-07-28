import { create } from "zustand";

type UIStore = {
  settingsModalTab: string | null;
  openSettingsModal: (tab: string) => void;
  closeSettingsModal: () => void;

  isInterestBrandModalOpen: boolean;
  openInterestBrandModal: () => void;
  closeInterestBrandModal: () => void;

  // InterestBrandModal은 온보딩(전역 인스턴스)과 설정 페이지의 "변경하기"
  // (로컬 인스턴스) 두 군데에서 쓰이는데, 둘 중 어느 쪽이든 열려서 brandList를
  // 편집 중이면 true. 다른 곳(예: 서버 픽 동기화)에서 편집 중 brandList를
  // 덮어쓰지 않도록 참조하는 공용 플래그.
  isBrandPicksEditing: boolean;
  setBrandPicksEditing: (value: boolean) => void;

  isBrandFilterModalOpen: boolean;
  openBrandFilterModal: () => void;
  closeBrandFilterModal: () => void;

  isOnboardingTourOpen: boolean;
  onboardingTourSource: "brand-modal" | "signup" | "pro";
  openOnboardingTour: (source?: "brand-modal" | "signup" | "pro") => void;
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

  isBrandPicksEditing: false,
  setBrandPicksEditing: (value) => set({ isBrandPicksEditing: value }),

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
