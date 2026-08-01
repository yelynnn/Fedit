// stores/FilterStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterStore } from "../types/Filter";
import { brandData } from "@/data/BrandCategories";

const BRAND_SET = new Set<string>(Object.values(brandData).flat());

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      selectedTab: "실시간 랭킹",
      selectedColors: [],
      selectedGenders: [],
      selectedTypes: [],
      selectedDetails: [],
      selectedPatterns: [],
      setSelectedTab: (tab: string) => set({ selectedTab: tab }),

      selectedYear: "",
      selectedSeason: "",
      setSelectedYear: (year: string) => set({ selectedYear: year }),
      setSelectedSeason: (season: string) => set({ selectedSeason: season }),
      resetSeason: () => set({ selectedYear: "", selectedSeason: "" }),

      filterList: [],
      addFilter: (filter: string) =>
        set((state) => {
          if (BRAND_SET.has(filter)) return {};
          if (state.filterList.includes(filter)) return {};
          return { filterList: [...state.filterList, filter] };
        }),
      removeFilter: (filter: string) =>
        set((state) => ({
          filterList: state.filterList.filter((f) => f !== filter),
        })),
      resetFilter: () => set({ filterList: [] }),

      brandList: [],
      addBrand: (brand: string) =>
        set((s) =>
          s.brandList.includes(brand)
            ? {}
            : { brandList: [...s.brandList, brand] }
        ),
      removeBrand: (brand: string) =>
        set((s) => ({ brandList: s.brandList.filter((b) => b !== brand) })),
      resetBrand: () => set({ brandList: [] }),
      setBrandList: (brands: string[]) => set({ brandList: brands }),

      platformList: [],
      setPlatformList: (platforms: string[]) =>
        set({ platformList: platforms }),
      resetPlatform: () => set({ platformList: [] }),

      interestBrandPicks: [],
      setInterestBrandPicks: (brands: string[]) =>
        set({ interestBrandPicks: brands }),

      lastBrandPicksSavedAt: null,
      setLastBrandPicksSavedAt: (iso: string) =>
        set({ lastBrandPicksSavedAt: iso }),
    }),
    {
      name: "filter-storage",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as { selectedTab?: string } | undefined;
        if (state?.selectedTab === "대시보드") {
          state.selectedTab = "실시간 랭킹";
        }
        return state;
      },
      // interestBrandPicks는 항상 서버 값(GetBrandPicks)을 따라야 한다.
      // 로컬에 남아 있으면 Basic → Free 등으로 플랜이 바뀐 뒤에도 예전
      // 관심 브랜드 10개가 계속 선택 가능한 상태로 남는 문제가 있어 제외한다.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== "interestBrandPicks"),
        ) as typeof state,
    }
  )
);
