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
      audienceType: "female",
      selectedMonth: "",

      setAudienceType: (type) => {
        const currentType = get().audienceType;

        if (currentType !== type) {
          set({ audienceType: type, selectedMonth: "" });
        }
      },

      setSelectedMonth: (month) => set({ selectedMonth: month }),
    }),
    {
      name: "type-store",
      // 예전 "adult"/"kids" 값이 남아있는 브라우저를 위한 1회성 마이그레이션.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.audienceType === "adult") state.audienceType = "female";
        else if (state.audienceType === "kids") state.audienceType = "male";
      },
    }
  )
);
