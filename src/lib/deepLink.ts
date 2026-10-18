import { useEffect } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { useUIStore } from "@/stores/UIStore";

// 크롬 확장 등 바깥에서 특정 화면으로 바로 보내는 링크.
//   /?tab=board    → '내 보드' 탭
//   /?open=pricing → 설정 > 구독(요금제) 창
// 로그인 전이면 로그인 후 RootNewLayout 이 뜰 때 그대로 적용된다(상태는 스토어에 남음).
// 새로고침 때 다시 열리지 않게 주소에서 파라미터를 지운다.
const TAB_ALIASES: Record<string, string> = { board: "내 보드" };

export function useDeepLink() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = TAB_ALIASES[params.get("tab") ?? ""];
    const open = params.get("open");
    if (!tab && open !== "pricing") return;

    if (tab) {
      // persist 복원이 끝난 뒤에 바꿔야 복원값에 덮이지 않는다
      const apply = () => useFilterStore.getState().setSelectedTab(tab);
      if (useFilterStore.persist.hasHydrated()) apply();
      else useFilterStore.persist.onFinishHydration(apply);
    }
    if (open === "pricing") useUIStore.getState().openSettingsModal("구독");

    params.delete("tab");
    params.delete("open");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);
}
