import { useUserStore } from "@/stores/UserStore";

// 미공개 기능(betaPaths) 숨김 — 백엔드는 미공개 기능을 API 경로 접두사로
// 알려준다(GET /auth/me의 betaPaths, 예: ["/fashionshow"]). 메뉴·화면이 쓰는
// API 접두사를 여기 모아 두고, 그중 하나라도 미공개면 그 메뉴를 숨긴다.
// 새 메뉴를 추가하면 그 화면이 부르는 API 접두사를 여기에도 적어 주세요.
export const FEATURE_API_PREFIXES: Record<string, string[]> = {
  "실시간 랭킹": ["/dashboard", "/trend"],
  "상품 분석": ["/products", "/detail", "/trendIndex"],
  "색상 분석": ["/color"],
  "유형 분석": ["/category"],
  "패션쇼 분석": ["/fashionshow"],
  "고객 분석": ["/customer-analysis"],
  "FEDI Agent": ["/chat"],
  "내 보드": ["/board"],
};

// "/fashionshow"는 "/fashionshow"·"/fashionshow/..."를 모두 가리킨다
const matchesPrefix = (apiPrefix: string, betaPath: string) => {
  const beta = betaPath.replace(/\/+$/, "");
  if (!beta) return false;
  return apiPrefix === beta || apiPrefix.startsWith(`${beta}/`) || beta.startsWith(`${apiPrefix}/`);
};

// 출시 전이라 배포 화면에서는 관리자에게만 보이는 메뉴(로컬 개발 화면은 모두) — 공개할 때 여기서 뺀다
// (고객 분석은 2026-11-04 공개)
export const ADMIN_ONLY_FEATURES = new Set<string>();

export const isFeatureReleased = (feature: string, betaPaths: string[], admin: boolean) => {
  if (admin) return true;
  if (ADMIN_ONLY_FEATURES.has(feature) && !import.meta.env.DEV) return false;
  if (betaPaths.length === 0) return true;
  const prefixes = FEATURE_API_PREFIXES[feature] ?? [];
  return !prefixes.some((p) => betaPaths.some((b) => matchesPrefix(p, b)));
};

// 컴포넌트용 — 관리자는 미공개 기능도 모두 본다
export function useFeatureReleased() {
  const admin = useUserStore((s) => s.admin);
  const betaPaths = useUserStore((s) => s.betaPaths);
  return (feature: string) => isFeatureReleased(feature, betaPaths, admin);
}
