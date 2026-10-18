import type { ApiDetail } from "@/types/Product";
import type { TrendSnapshotDetailDto } from "@/types/Main";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// 상품 분석 화면 안에서 연 상세의 경로 정보 — 헤더 breadcrumb
// ("상품 분석 > 아우터 > 자켓 > 상품명")에 쓴다.
export interface SelectedProductMeta {
  itemcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  mainCategory: string | null;
  category: string | null;
  // 통합 지수(점수·단계, 예: 89 · "급상승") — 불러오기 전이거나 없으면 null
  trendScore: number | null;
  trendBand: string | null;
}

export interface ProductStore {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;

  selectedProductMeta: SelectedProductMeta | null;
  setSelectedProductMeta: (meta: SelectedProductMeta | null) => void;

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

      selectedProductMeta: null,
      setSelectedProductMeta: (meta) => set({ selectedProductMeta: meta }),

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
    {
      name: "product-store",
      // 헤더 경로 정보는 상세를 열 때마다 다시 채워지므로 저장하지 않는다
      partialize: ({ selectedProductMeta: _meta, setSelectedProductMeta: _set, ...rest }) => {
        void _meta;
        void _set;
        return rest;
      },
    },
  ),
);
