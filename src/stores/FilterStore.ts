// stores/FilterStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
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
      // 관심 브랜드가 계속 선택 가능한 상태로 남는 문제가 있어 제외한다.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== "interestBrandPicks"),
        ) as typeof state,
    }
  )
);

// localStorage 복원(zustand persist)이 끝났는지 — 복원은 마이크로태스크
// 한 틱 뒤에 끝나서, 새로고침 직후 첫 렌더는 항상 빈 필터값을 본다. 필터
// 의존 조회(예: 상품 분석 목록)를 이 값이 true가 될 때까지 미루면, "필터
// 없는 결과가 잠깐 나왔다가 필터링된 결과로 바뀌는" 깜빡임과 그 사이의
// 낭비되는 API 호출을 아예 없앨 수 있다.
export function useFilterStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useFilterStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;
    // 구독을 걸기 전에 이미 끝났을 수 있어 한 번 더 확인한다.
    if (useFilterStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useFilterStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
