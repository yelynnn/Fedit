// 마케팅 랜딩페이지(fedit.framer.website, fedit.framer.website/fedit-vip-x7k2q9)에서
// 로그인 페이지로 넘어올 때 붙는 ?ref= 쿼리스트링을 읽어 로컬에 남겨두는
// 플래그들. 로그인 페이지 → (선택) 회원가입 → 첫 로그인까지 여러 화면을
// 거치는 동안에도 "어디서 들어왔는지"를 잃지 않기 위해 localStorage를 쓴다.

// 비밀 링크(?ref=vip)로 들어온 사용자에게 Basic 요금제를 첫 달 9,900원
// 특가로 보여주기 위한 플래그. 결제(카카오페이 요청)가 완료되면 지운다.
export const SECRET_ENTRY_STORAGE_KEY = "feditSecretEntry";

export const isSecretEntry = (): boolean =>
  localStorage.getItem(SECRET_ENTRY_STORAGE_KEY) === "true";

export const clearSecretEntry = (): void => {
  localStorage.removeItem(SECRET_ENTRY_STORAGE_KEY);
};

// ?ref=vip 또는 ?ref=landing으로 들어왔음을 나타내는 임시 플래그. 회원가입이
// 실제로 성공하는 시점에만 SHOW_PRICING_AFTER_SIGNUP_KEY로 "소비"되고 지워진다
// (그냥 로그인만 한 기존 회원에게는 적용하지 않기 위해).
export const LANDING_ENTRY_STORAGE_KEY = "feditLandingEntry";

export const isLandingEntry = (): boolean =>
  localStorage.getItem(LANDING_ENTRY_STORAGE_KEY) === "true";

export const clearLandingEntry = (): void => {
  localStorage.removeItem(LANDING_ENTRY_STORAGE_KEY);
};

// 랜딩페이지에서 들어와 방금 회원가입을 마쳤다는 플래그. 첫 로그인 후
// RootNewLayout이 이 값을 보고 설정 > 구독 화면을 바로 띄운 뒤 지운다.
export const SHOW_PRICING_AFTER_SIGNUP_KEY = "feditShowPricingAfterSignup";

// 랜딩페이지 CTA가 /login이 아니라 /signup 계열로 바로 연결될 수도 있고,
// 그 사이 화면 이동(navigate)에서 쿼리스트링이 안 이어질 수도 있어서, 로그인
// 페이지 하나에만 심어두면 놓칠 수 있다. 그래서 로그인/회원가입 진입점이 될
// 수 있는 페이지마다 마운트 시 이 함수를 호출해 최대한 일찍 잡아둔다.
export const captureLandingRef = (): void => {
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref === "vip") {
    localStorage.setItem(SECRET_ENTRY_STORAGE_KEY, "true");
    localStorage.setItem(LANDING_ENTRY_STORAGE_KEY, "true");
  } else if (ref === "landing") {
    localStorage.setItem(LANDING_ENTRY_STORAGE_KEY, "true");
  }
};
