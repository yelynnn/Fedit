import type { ApiDetail } from "@/types/Product";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductStore {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;

  modalProductId: string | null;
  setModalProductId: (id: string | null) => void;

  resultLists: ApiDetail[];
  setResultLists: (
    rows: ApiDetail[] | ((prev: ApiDetail[]) => ApiDetail[]),
  ) => void;
  clearResults: () => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      selectedProductId: null,
      setSelectedProductId: (id) => set({ selectedProductId: id }),

      modalProductId: null,
      setModalProductId: (id) => set({ modalProductId: id }),

      resultLists: [],
      setResultLists: (input) =>
        set((state) => ({
          resultLists:
            typeof input === "function"
              ? input(state.resultLists)
              : (input ?? []),
        })),
      clearResults: () => set({ resultLists: [] }),
    }),
    { name: "product-store" },
  ),
);
