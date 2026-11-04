// Basic 플랜의 관심 브랜드 최대 개수.
export const REQUIRED_COUNT = 5;
// Pro 플랜의 관심 브랜드 최대 개수.
export const PRO_REQUIRED_COUNT = 30;

// 무료체험(Trial, 2026-11 개편 뒤 시작)의 관심 브랜드 최대 개수.
export const TRIAL_REQUIRED_COUNT = 3;

/** newTrial: 개편 뒤에 시작한 무료체험이면 3개(SubscriptionStore isNewTrial) */
export const getBrandCap = (
  plan: "free" | "basic" | "pro" | "basic_secret" | "enterprise",
  newTrial = false,
): number => (plan === "pro" ? PRO_REQUIRED_COUNT : newTrial ? TRIAL_REQUIRED_COUNT : REQUIRED_COUNT);
