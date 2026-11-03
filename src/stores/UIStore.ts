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

  // 잠긴 분석 탭(색상·유형)에서 "예시 화면 보기"를 누른 탭 — 이번 접속 동안 예시 데이터로 연다
  analysisDemoTabs: string[];
  openAnalysisDemo: (tab: string) => void;

  // 무료체험 시작 창 — 체험 전 고객이 예시 화면 보기 등을 누르면 띄운다. onStarted 는 체험 시작 뒤 이어서 할 일
  trialModal: { onStarted?: () => void } | null;
  openTrialModal: (onStarted?: () => void) => void;
  closeTrialModal: () => void;
  // 체험 시작 직후 관심 브랜드 창을 닫으면 돌아갈 탭(없으면 기본 온보딩: 상품 분석 + 투어)
  afterOnboardingTab: string | null;
  setAfterOnboardingTab: (tab: string | null) => void;

  // 화면 아래에 잠깐 뜨는 안내 문구(예: 미공개 기능 호출 시 "준비 중인 기능입니다")
  notice: string | null;
  showNotice: (message: string) => void;
  hideNotice: () => void;
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

  trialModal: null,
  openTrialModal: (onStarted) => set({ trialModal: { onStarted } }),
  closeTrialModal: () => set({ trialModal: null }),
  afterOnboardingTab: null,
  setAfterOnboardingTab: (tab) => set({ afterOnboardingTab: tab }),

  analysisDemoTabs: [],
  openAnalysisDemo: (tab) =>
    set((s) => (s.analysisDemoTabs.includes(tab) ? s : { analysisDemoTabs: [...s.analysisDemoTabs, tab] })),

  sidebarCollapseOverride: null,
  setSidebarCollapseOverride: (value) => set({ sidebarCollapseOverride: value }),

  notice: null,
  showNotice: (message) => set({ notice: message }),
  hideNotice: () => set({ notice: null }),
}));
