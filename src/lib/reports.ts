import { useState } from "react";
import { useUserStore } from "@/stores/UserStore";
import {
  getEffectivePlan,
  isLegacyBasicTrial,
  useSimulatedSubscription,
  useSubscriptionStore,
} from "@/stores/SubscriptionStore";
import { downloadReportPdf } from "@/lib/reportPdf";
import { exampleSeason2627 } from "@/data/reports/exampleSeason2627";
import type { CustomerReport } from "@/types/Report";

// 리포트 — 계정마다 담당자가 월 1회 맞춤 리포트를 만들어 넣는다(Trial 은 체험 마지막 날 1회).
// 1차는 프론트 데이터로 보여 준다: 관리자는 예시(A 브랜드) 리포트를 "내 리포트"로, 나머지는 받은 리포트가 없으니
// 같은 리포트를 "예시"로 본다. 다음 단계에서 백엔드(고객별 리포트 테이블, GET /reports)로 바꾼다.
export const EXAMPLE_REPORT: CustomerReport = exampleSeason2627;

/** 내가 받은 맞춤 리포트(최근 순) — 개발 화면 ?simulatePlan= 중에는 받은 리포트가 없는 고객으로 본다 */
export const useMyReports = (): CustomerReport[] => {
  const admin = useUserStore((s) => s.admin);
  const simulated = useSimulatedSubscription();
  return admin && !simulated ? [exampleSeason2627] : [];
};

export type Tier = "none" | "expired" | "trial" | "basic" | "pro" | "enterprise";

/** 리포트를 볼 때의 요금제 구분 — Pro·Enterprise 는 체험 중(혜택 코드 Pro 체험)이어도 그 요금제 그대로,
 *  개편 전에 시작한 Basic 체험은 Basic 으로 */
export function useReportTier(): Tier {
  const subscription = useSubscriptionStore((s) => s.subscription);
  const eff = getEffectivePlan(subscription);
  return eff === "none" || eff === "expired"
    ? eff
    : eff === "pro" || eff === "enterprise"
      ? eff
      : subscription?.status === "trial" && !isLegacyBasicTrial(subscription)
        ? "trial"
        : "basic";
}

/** "PDF로 저장" — 화면의 #report-doc 을 A4 PDF 로 바로 내려받는다(Trial·Basic 은 흐린 절반까지 그대로) */
export function useSaveReportPdf() {
  const [saving, setSaving] = useState(false);
  const save = async (report: CustomerReport, example: boolean) => {
    const el = document.getElementById("report-doc");
    if (!el || saving) return;
    setSaving(true);
    try {
      await downloadReportPdf(el, example ? `${report.title} (예시)` : report.title);
    } catch {
      alert("PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };
  return { saving, save };
}

/** 요금제별 리포트 안내 — FEDIT 이 계정마다 직접 만들어 올린다(고객 분석 리포트 박스·창) */
export const REPORT_TIER_LINES: Record<Tier, string> = {
  none: "무료체험을 시작하면 체험 마지막 날, FEDIT가 고르신 관심 브랜드로 맞춤 리포트를 직접 만들어 드려요.",
  expired: "멤버십을 시작하면 FEDIT가 고르신 관심 브랜드로 맞춤 리포트를 월 1회 직접 만들어 드려요.",
  trial: "FEDIT가 고르신 관심 브랜드로 맞춤 리포트를 직접 만들어 체험 마지막 날 올려 드려요. 맞춤 제작이라 시간이 조금 걸려요.",
  basic: "FEDIT가 고르신 관심 브랜드로 맞춤 리포트를 월 1회 직접 만들어 드려요. 관심 브랜드 선택을 마치시면 그에 맞춰 준비해요.",
  pro: "FEDIT가 고르신 관심 브랜드로 맞춤 리포트를 월 1회 직접 만들어 드려요. 준비되면 이 화면에 올라와요.",
  enterprise: "FEDIT가 고르신 브랜드로 맞춤 리포트를 월 1회 직접 만들어 드려요. 준비되면 이 화면에 올라와요.",
};
/** 고객 분석 화면 리포트 박스용 한 줄 */
export const REPORT_TIER_SHORT: Record<Tier, string> = {
  none: "무료체험을 시작하면 FEDIT가 관심 브랜드로 직접 만들어 드려요.",
  expired: "멤버십을 시작하면 FEDIT가 관심 브랜드로 월 1회 직접 만들어 드려요.",
  trial: "FEDIT가 관심 브랜드로 직접 만들어 체험 마지막 날 올려 드려요.",
  basic: "FEDIT가 관심 브랜드로 월 1회 직접 만들어 드려요.",
  pro: "FEDIT가 관심 브랜드로 월 1회 직접 만들어 드려요.",
  enterprise: "FEDIT가 고르신 브랜드로 월 1회 직접 만들어 드려요.",
};
export const REPORT_PLAN_NOTE = "Basic·Pro·Enterprise는 맞춤 리포트를 월 1회 제공해요. 전체 내용은 Pro부터 볼 수 있어요.";

/** 멤버십(체험 포함)인데 아직 받은 리포트가 없으면 "준비 중" — 체험 전·만료는 받을 리포트가 없으니 아니다 */
export const isReportPreparing = (tier: Tier, example: boolean) =>
  example && tier !== "none" && tier !== "expired";
