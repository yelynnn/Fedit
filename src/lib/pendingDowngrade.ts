// pro → basic 다운그레이드는 신청 즉시가 아니라 다음 결제일부터 적용된다.
// 신청 시점엔 아직 브랜드 재선택(basic 온보딩)을 보여줄 수 없으므로, 여기에
// "적용 대기 중" 플래그만 남겨두고 실제 전환이 확인되는 첫 진입(RootNewLayout)에서
// 온보딩 모달을 딱 한 번 띄운 뒤 곧바로 지운다.
const PENDING_BASIC_DOWNGRADE_KEY = "feditPendingBasicDowngrade";

export const setPendingBasicDowngrade = (): void =>
  localStorage.setItem(PENDING_BASIC_DOWNGRADE_KEY, "true");

export const isPendingBasicDowngrade = (): boolean =>
  localStorage.getItem(PENDING_BASIC_DOWNGRADE_KEY) === "true";

export const clearPendingBasicDowngrade = (): void => {
  localStorage.removeItem(PENDING_BASIC_DOWNGRADE_KEY);
};
