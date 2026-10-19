// 배포 환경 설정. 로컬 백엔드로 테스트할 때는 API_BASE 만 바꾼다(host_permissions 도 함께).
export const API_BASE = "https://mify.kro.kr";
export const WEB_BASE = "https://fedit.mify.im";
export const LOGIN_URL = `${WEB_BASE}/login`;
export const BOARD_URL = `${WEB_BASE}/?tab=board`;
export const PRICING_URL = `${WEB_BASE}/?open=pricing`;
// 웹 첫 화면이 ?product= 를 읽어 상품 상세(EXT 상품 포함)를 모달로 연다
export const productDetailUrl = (itemcode) => `${WEB_BASE}/?product=${encodeURIComponent(itemcode)}`;

// 분석 상태 폴링
export const POLL_INTERVAL_MS = 3000;
export const POLL_TIMEOUT_MS = 5 * 60 * 1000;
