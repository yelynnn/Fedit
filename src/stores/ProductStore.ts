import type { ProductStore } from "@/types/Product";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      selectedProductId: null,
      setSelectedProductId: (id) => set({ selectedProductId: id }),
    }),
    {
      name: "product-store",
    }
  )
);
