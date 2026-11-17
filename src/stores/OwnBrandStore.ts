import { create } from "zustand";
import { GetOwnBrand, PutOwnBrand } from "@/apis/OwnBrandAPI";

// 자사 브랜드(관심 브랜드 중 1개, Enterprise 는 전체 브랜드 중) — 서버(/brand/own)에 저장된 값을 들고 있는다.
type OwnBrandStore = {
  ownBrand: string | null;
  loaded: boolean;
  /** 서버에서 다시 읽는다(설정 화면·유형 분석 진입 시) */
  load: () => Promise<void>;
  /** 서버에 저장하고 저장된 값으로 바꾼다. 실패하면 예외 */
  save: (brand: string | null) => Promise<void>;
};

export const useOwnBrandStore = create<OwnBrandStore>()((set) => ({
  ownBrand: null,
  loaded: false,
  load: async () => {
    try {
      const brand = await GetOwnBrand();
      set({ ownBrand: brand, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  save: async (brand) => {
    const saved = await PutOwnBrand(brand);
    set({ ownBrand: saved, loaded: true });
  },
}));
