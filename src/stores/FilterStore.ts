// stores/FilterStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterStore } from "../types/Filter";
import { brandData } from "@/data/BrandCategories";

const BRAND_SET = new Set<string>(Object.values(brandData).flat());

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      selectedTab: "대시보드",
      selectedColors: [],
      selectedGenders: [],
      selectedTypes: [],
      selectedDetails: [],
      selectedPatterns: [],
      setSelectedTab: (tab: string) => set({ selectedTab: tab }),

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
    }),
    {
      name: "filter-storage",
    }
  )
);
