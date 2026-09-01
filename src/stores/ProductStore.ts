import type { ApiDetail } from "@/types/Product";
import type { TrendSnapshotDetailDto } from "@/types/Main";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductStore {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;

  modalProductId: string | null;
  setModalProductId: (id: string | null) => void;

  // 랭킹처럼 itemcode 없이 temp_item_id로만 조회한 상품 — /trend에서 이미
  // 받아온 스냅샷을 그대로 모달에 넣어 보여준다(itemcode 기반 재조회 없음).
  modalTrendSnapshot: TrendSnapshotDetailDto | null;
  setModalTrendSnapshot: (snapshot: TrendSnapshotDetailDto | null) => void;

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

      modalTrendSnapshot: null,
      setModalTrendSnapshot: (snapshot) =>
        set({ modalTrendSnapshot: snapshot }),

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
