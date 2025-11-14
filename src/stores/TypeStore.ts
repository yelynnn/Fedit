import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TypeStore {
  audienceType: string;
  setAudienceType: (type: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const useTypeStore = create<TypeStore>()(
  persist(
    (set, get) => ({
      audienceType: "adult",
      selectedMonth: "",

      setAudienceType: (type) => {
        const currentType = get().audienceType;

        if (currentType !== type) {
          const defaultMonth = type === "kids" ? "2025-10" : "";
          set({ audienceType: type, selectedMonth: defaultMonth });
        }
      },

      setSelectedMonth: (month) => set({ selectedMonth: month }),
    }),
    {
      name: "type-store",
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.audienceType === "kids" && !state.selectedMonth) {
            state.selectedMonth = "2025-10";
          } else if (state.audienceType === "adult") {
            state.selectedMonth = "";
          }
        }
      },
    }
  )
);
