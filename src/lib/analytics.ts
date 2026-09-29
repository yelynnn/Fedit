// GA4/GTM 전환 이벤트 — "FEDIT 측정 구현 요청서" 요청 1.
// GTM(GTM-P6C7B44R)이 이미 설치돼 있어 dataLayer.push만 하면 GTM 트리거가 받는다.
// 새 GTM 컨테이너·GA4 속성을 만들지 않는다 — 기존 fedit_main 속성 그대로 쓴다.
// Amplitude(초기화는 main.tsx에서 initAll로 한 번)도 같은 이벤트를 받는다 —
// 호출부는 그대로 두고 이 track() 안에서만 양쪽으로 나눠 보낸다.
import * as amplitude from "@amplitude/unified";

declare global {
  interface Window {
    dataLayer: any[];
  }
}

// localhost(로컬 개발)에서는 Amplitude를 아예 안 쓴다 — main.tsx가 initAll
// 자체를 스킵하므로, 여기서도 track/identify/reset을 호출하지 않아야
// "초기화 안 된 SDK를 불렀다"는 경고 없이 조용히 넘어간다. 실사용자 지표에
// 테스트 데이터가 섞이는 것도 막는다.
const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

// 이벤트 파라미터에 이메일·이름·전화번호 등 개인정보를 절대 넣지 않는다
// (개인정보보호법·GA4 정책 위반 소지). 사용자 구분이 필요하면 내부 ID를 쓴다.
export function track(event: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
  if (isLocalhost) return;
  amplitude.track(event, params);
}

// 로그인 성공/세션 복원 시 호출 — Amplitude에 사용자를 식별시킨다. email을
// 식별자로 쓰고(사용자 ID 체계가 따로 없어서), name·plan·monitored_brands를
// 프로필 속성으로 붙인다. monitored_brands(등록된 관심 브랜드 목록)는 이후
// 브랜드를 추가/삭제할 때마다 updateMonitoredBrands로 갱신한다.
export function identifyUser(
  email: string,
  // none: 가입만 함(요금제·체험 없음) / trial: 무료 체험 중 / 그 외: 결제한 요금제
  plan: "none" | "trial" | "basic" | "pro" | "enterprise",
  name?: string,
  monitoredBrands?: string[],
) {
  if (isLocalhost) return;
  amplitude.setUserId(email);
  const identify = new amplitude.Identify().set("plan", plan);
  if (name) identify.set("name", name);
  if (monitoredBrands) identify.set("monitored_brands", monitoredBrands);
  amplitude.identify(identify);
}

// 무료 체험이 실제로 열린 걸 처음 확인한 순간 한 번 보낸다. 체험은 가입과
// 별개로(세팅 후) 열리기 때문에 가입 시점이 아니라, 로그인한 사용자의 구독
// 상태가 trial인 걸 처음 본 시점에 보낸다. 같은 브라우저에서 중복되지 않게
// 이메일별로 기록해 둔다. (정확히는 체험을 여는 서버에서 보내는 게 맞다 —
// 백엔드가 보내게 되면 이 함수는 지운다.)
export function trackTrialStartedOnce(email: string, plan: string) {
  if (isLocalhost || !email) return;
  const key = "fedit-trial-tracked:" + email.toLowerCase();
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // 저장소를 못 쓰면 중복될 수 있지만 그대로 보낸다.
  }
  track("trial_started", { plan });
}

// 관심 브랜드(모니터링 브랜드)를 추가/삭제해서 저장할 때마다 호출 — 로그인
// 때 전체를 다시 보낼 필요 없이 이 속성만 갱신한다.
export function updateMonitoredBrands(email: string, brands: string[]) {
  if (isLocalhost || !email) return;
  amplitude.setUserId(email);
  const identify = new amplitude.Identify().set("monitored_brands", brands);
  amplitude.identify(identify);
}

// 로그아웃 시 호출 — 다음 사람이 같은 브라우저를 써도 이전 사용자로
// 기록되지 않도록 식별 정보를 지운다.
export function resetUser() {
  if (isLocalhost) return;
  amplitude.reset();
}

// feature_viewed — 2026-09-17 마케터 확정 사항으로 first_report_viewed를
// 대체한다. 제품은 화면을 옮겨도 URL이 안 바뀌는 구조(사이드바 탭 전환)라
// GA4 자동 페이지 조회로 못 잡는다 — 사이드바 탭이 바뀔 때(최초 진입 포함)
// 직접 호출한다.
//
// first_report_viewed 때와 달리 최초 1회 제한을 두지 않는다 — "써봤다/안
// 써봤다"가 아니라 "어떤 기능을 얼마나 자주 쓰나"가 목적이라, 탭을 볼 때마다
// 매번 보내야 한다.
//
// 화면이 늘어나면 이벤트를 더 만들지 말고 이 매핑에만 값을 추가한다.
// 값은 실제 탭 이름과 어긋나지 않게 짓는다 — "상품 분석" 탭을 brand_select로
// 부르면 나중에 리포트에서 어느 화면인지 못 알아본다.
const FEATURE_NAME_BY_TAB: Record<string, string> = {
  "실시간 랭킹": "realtime_ranking",
  "상품 분석": "product_analysis",
  "색상 분석": "color_analysis",
  "유형 분석": "type_analysis",
  "패션쇼 분석": "fashion_show",
  "내 보드": "my_board",
};

// 브랜드가 1개면 문자열, 여러 개면 배열로 보낸다 — 리포트 쪽에서 "브랜드
// 하나로 본다"와 "여러 브랜드를 같이 본다"를 구분해야 하는 경우가 있어서다.
function toBrandNameParam(brandList: string[]): string | string[] | undefined {
  if (brandList.length === 0) return undefined;
  if (brandList.length === 1) return brandList[0];
  return brandList;
}

// productCount: 화면에 실제로 뜬 상품 수(생략 가능 — 상품 목록이 없는
// 화면은 안 보내면 된다).
export function trackFeatureViewed(
  tabLabel: string,
  brandList: string[] = [],
  productCount?: number,
) {
  const featureName = FEATURE_NAME_BY_TAB[tabLabel];
  // 매핑에 없는 새 탭은 아직 정의되지 않은 화면이라 보내지 않는다.
  if (!featureName) return;
  track("feature_viewed", {
    feature_name: featureName,
    brand_name: toBrandNameParam(brandList),
    ...(productCount !== undefined && { product_count: productCount }),
  });
}

// 실시간 랭킹은 플랫폼별로 랭킹 리스트가 따로 있어서 feature_viewed의
// product_count 한 값으로 못 담는다 — 플랫폼을 바꿔 볼 때마다(=랭킹 목록을
// 새로 불러올 때마다) 따로 한 건씩 보낸다.
//
// 상품 분석은 무한스크롤이라 처음 로드뿐 아니라 스크롤로 더 불러올 때마다,
// 그리고 필터를 바꿔 다시 불러올 때마다 "그 회차에 새로 불러온 개수"를 한 건씩
// 보낸다 — 합치면 그 사용자가 실제로 불러와 본 상품 수가 된다(리포트의
// "확인한 신상품 수"). feature_viewed(화면 조회 1회)와는 별개다.
export function trackProductsLoaded(
  featureName: string,
  count: number,
  opts: { platform?: string; brandList?: string[] } = {},
) {
  track("products_loaded", {
    feature_name: featureName,
    count,
    ...(opts.platform && { platform: opts.platform }),
    ...(opts.brandList && { brand_name: toBrandNameParam(opts.brandList) }),
  });
}

// 같은 탭 안에서 브랜드 필터만 바꿔 볼 때 — feature_viewed는 탭 전환 때만
// 나가서(화면 조회 지표 유지) 여기서 따로 잡는다. 리포트의 "많이 본 / 잘 안
// 본 브랜드"는 feature_viewed + brand_filter_changed의 brand_name을 합쳐 본다.
export function trackBrandFilterChanged(tabLabel: string, brandList: string[]) {
  const featureName = FEATURE_NAME_BY_TAB[tabLabel];
  if (!featureName || brandList.length === 0) return;
  track("brand_filter_changed", {
    feature_name: featureName,
    brand_name: toBrandNameParam(brandList),
  });
}

// 엑셀 다운로드 — 파일 하나가 실제로 완성됐을 때(row_count를 아는 시점)
// 호출한다. 파일이 여러 개 나뉘어 저장되면(Basic) 그때마다 한 번씩.
export function trackExcelDownload(
  featureName: string,
  brandList: string[] = [],
  rowCount: number,
) {
  track("excel_download", {
    feature_name: featureName,
    brand_name: toBrandNameParam(brandList),
    row_count: rowCount,
  });
}

// 상품을 보드(폴더)에 저장했을 때 호출한다.
export function trackFolderSave(
  productId: string,
  brandName: string | null | undefined,
  category: string | null | undefined,
) {
  track("folder_save", {
    product_id: productId,
    brand_name: brandName ?? undefined,
    category: category ?? undefined,
  });
}

// 상품 상세를 열람했을 때 호출한다(탭 전환으로 안 잡히는 화면 중 하나 —
// 랭킹/상품 분석/보드 어디서 열었든 이 한 지점에서만 부르면 된다).
export function trackProductDetailViewed(
  productId: string,
  brandName: string | null | undefined,
  category: string | null | undefined,
) {
  track("product_detail_viewed", {
    product_id: productId,
    brand_name: brandName ?? undefined,
    category: category ?? undefined,
  });
}

// FEDI(AI 에이전트) 채팅 전송 — feature_viewed에 섞지 않고 별도 이벤트로
// 뺀다. 탭 전환은 "화면을 봤다"(조회)이고 이건 "행동을 했다"라 성격이 달라,
// 같은 지표에 합치면 feature_viewed 총합의 의미가 흐려진다. 북극성 지표(WAP)
// 계산과 GA4 "주요 이벤트"·전환율 집계에도 조회와 분리된 자체 이벤트가
// 필요하다. "켜봤다"가 아니라 실제로 채팅 요청을 보낸 시점 기준이고, 보낼
// 때마다 매번 전송한다(빈도가 목적).
export function trackFediChatSent() {
  track("fedi_chat_sent");
}
