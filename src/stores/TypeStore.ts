import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

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

// localStorage 복원(zustand persist)이 끝났는지 — audienceType 기본값
// "female"로 첫 렌더가 먼저 뜨고 한 틱 뒤에 실제 저장된 값(예: "male")으로
// 바뀐다. audienceType으로 갈리는 조회를 이 값이 true가 될 때까지 미루면
// "여성 데이터가 잠깐 나왔다가 남성 데이터로 바뀌는" 깜빡임과 그 사이의
// 낭비되는 API 호출을 없앨 수 있다.
export function useTypeStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useTypeStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;
    if (useTypeStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useTypeStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
