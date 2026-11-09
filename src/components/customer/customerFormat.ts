import type {
  CustomerBrand,
  CustomerGenderFilter,
  CustomerPlatform,
  CustomerPlatformFilter,
} from "@/types/CustomerAnalysis";

const LABELS: Record<string, string> = {
  all: "전체 플랫폼",
  musinsa: "무신사",
  "29cm": "29CM",
  wconcept: "W컨셉",
  ssfshop: "SSF샵",
};

/** 플랫폼 이름 — own:* 는 자사몰 */
export const platformLabel = (p: CustomerPlatformFilter) =>
  LABELS[p] ?? (p.startsWith("own:") ? "자사몰" : p);

export const PLATFORMS: CustomerPlatform[] = ["musinsa", "29cm", "wconcept"];

/** 다른 브랜드 리뷰도 모으는 플랫폼인지 — 아니면(SSF샵·자사몰) 교차 구매를 볼 수 없다 */
export const isCrossPlatform = (p: string) => (PLATFORMS as string[]).includes(p);

export const CATEGORIES = ["상의", "바지", "아우터"] as const;


// collecting: 어느 플랫폼에서도 아직 수집 전(방금 추가한 브랜드 등) — 전체 플랫폼일 때만 쓴다
export type PlatformAvailability = "ok" | "unlisted" | "preparing" | "collecting";

/** 브랜드가 그 플랫폼에서 볼 수 있는 상태인지 — 목록에 없으면 미입점 */
export const platformAvailability = (
  brand: CustomerBrand | undefined,
  platform: CustomerPlatformFilter,
): PlatformAvailability => {
  if (!brand) return "ok";
  if (platform === "all") {
    return brand.platforms.some((p) => p.listed && p.collected) ? "ok" : "collecting";
  }
  const p = brand.platforms.find((x) => x.platform === platform);
  if (!p || !p.listed) return "unlisted";
  if (!p.collected) return "preparing";
  return "ok";
};

export const fmtNum = (n: number) => n.toLocaleString("ko-KR");

export const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

/** 소수 한 자리까지, .0은 뗀다 */
export const fmtPct = (v: number) => {
  const r = Math.round(v * 10) / 10;
  return `${Number.isInteger(r) ? r : r.toFixed(1)}%`;
};

/** "여성 " / "남성 " / "" — 문장 안에서 "{성별 }고객"으로 쓴다 */
export const genderPrefix = (g: CustomerGenderFilter) => (g === "all" ? "" : `${g} `);

/** 받침 유무에 따라 "를"/"을" */
export const objectParticle = (word: string) => {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return "를";
  return (last - 0xac00) % 28 === 0 ? "를" : "을";
};

/** 받침 유무에 따라 "는"/"은" */
export const topicParticle = (word: string) => {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return "는";
  return (last - 0xac00) % 28 === 0 ? "는" : "은";
};
