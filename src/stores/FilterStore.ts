import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterStore } from "../types/Filter";

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      selectedTab: "상품 분석",
      selectedColors: [],
      selectedGenders: [],
      selectedTypes: [],
      selectedDetails: [],
      selectedPatterns: [],
      setSelectedTab: (tab) => set({ selectedTab: tab }),
      filterList: [],
      addFilter: (filter) =>
        set((state) =>
          state.filterList.includes(filter)
            ? state
            : { filterList: [...state.filterList, filter] }
        ),
      removeFilter: (filter) =>
        set((state) => ({
          filterList: state.filterList.filter((f) => f !== filter),
        })),
      resetFilter: () => set({ filterList: [] }),
    }),

    {
      name: "filter-storage",
    }
  )
);
