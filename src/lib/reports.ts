import { useUserStore } from "@/stores/UserStore";
import { useSimulatedSubscription } from "@/stores/SubscriptionStore";
import { bellierSeason2627 } from "@/data/reports/bellierSeason2627";
import type { CustomerReport } from "@/types/Report";

// 리포트 — 계정마다 담당자가 월 1회 맞춤 리포트를 만들어 넣는다(Trial 은 체험 마지막 날 1회).
// 1차는 프론트 데이터로 보여 준다: 관리자는 벨리에 리포트를 "내 리포트"로, 나머지는 받은 리포트가 없으니
// 벨리에 리포트를 "예시"로 본다. 다음 단계에서 백엔드(고객별 리포트 테이블, GET /reports)로 바꾼다.
export const EXAMPLE_REPORT: CustomerReport = bellierSeason2627;

/** 내가 받은 맞춤 리포트(최근 순) — 개발 화면 ?simulatePlan= 중에는 받은 리포트가 없는 고객으로 본다 */
export const useMyReports = (): CustomerReport[] => {
  const admin = useUserStore((s) => s.admin);
  const simulated = useSimulatedSubscription();
  return admin && !simulated ? [bellierSeason2627] : [];
};

/**
 * 사이드바에 리포트 메뉴를 보여 줄지 — 예시 리포트가 실제 고객사(벨리에) 데이터라,
 * 고객사 동의·익명화 전까지 배포 화면에서는 관리자만 본다(로컬 개발 화면은 모두).
 */
export const useReportMenuVisible = () => {
  const admin = useUserStore((s) => s.admin);
  return admin || import.meta.env.DEV;
};
