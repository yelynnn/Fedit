import { create } from "zustand";
import { persist } from "zustand/middleware";

// 상품 비교함 — 상품 상세의 "비교 추가"로 최대 COMPARE_MAX개를 담고,
// 상품 분석 하단 바의 "비교하기"로 GET /products/compare를 불러 비교표를 연다.
// 담기만 할 때는 서버를 부르지 않고, 새로고침해도 유지되게 저장한다.

export const COMPARE_MAX = 4;

export interface CompareItem {
  itemcode: string;
  brand: string | null;
  product_name: string;
  thumbnail: string | null;
}

type AddResult = "added" | "exists" | "full";

interface CompareStore {
  items: CompareItem[];
  // 상품 분석 안에서 비교 화면(페이지)을 보고 있는지 — 저장하지 않는다
  pageOpen: boolean;
  openPage: () => void;
  closePage: () => void;
  add: (item: CompareItem) => AddResult;
  remove: (itemcode: string) => void;
  removeMany: (itemcodes: string[]) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      pageOpen: false,
      openPage: () => set({ pageOpen: true }),
      closePage: () => set({ pageOpen: false }),
      add: (item) => {
        const { items } = get();
        if (items.some((i) => i.itemcode === item.itemcode)) return "exists";
        if (items.length >= COMPARE_MAX) return "full";
        set({ items: [...items, item] });
        return "added";
      },
      remove: (itemcode) =>
        set((state) => ({ items: state.items.filter((i) => i.itemcode !== itemcode) })),
      removeMany: (itemcodes) =>
        set((state) => ({ items: state.items.filter((i) => !itemcodes.includes(i.itemcode)) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "fedit-compare",
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
