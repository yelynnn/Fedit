import { create } from "zustand";
import type { BrandStore } from "../types/Filter";

export const useBrandStore = create<BrandStore>((set) => ({
  brandList: [],
  addBrand: (brand) =>
    set((state) =>
      state.brandList.includes(brand)
        ? state
        : { brandList: [...state.brandList, brand] }
    ),
  removeBrand: (brand) =>
    set((state) => ({
      brandList: state.brandList.filter((b) => b !== brand),
    })),
}));
