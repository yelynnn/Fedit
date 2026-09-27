// Basic 플랜의 관심 브랜드 최대 개수.
export const REQUIRED_COUNT = 5;
// Pro 플랜의 관심 브랜드 최대 개수.
export const PRO_REQUIRED_COUNT = 30;

export const getBrandCap = (
  plan: "free" | "basic" | "pro" | "basic_secret" | "enterprise",
): number => (plan === "pro" ? PRO_REQUIRED_COUNT : REQUIRED_COUNT);
