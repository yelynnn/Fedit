import type { ApiDetail } from "@/types/Product";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductStore {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;

  resultLists: ApiDetail[];
  setResultLists: (rows: ApiDetail[]) => void;
  clearResults: () => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      selectedProductId: null,
      setSelectedProductId: (id) => set({ selectedProductId: id }),

      resultLists: [],
      setResultLists: (rows) => set({ resultLists: rows ?? [] }),
      clearResults: () => set({ resultLists: [] }),
    }),
    { name: "product-store" }
  )
);
