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

// 이벤트 파라미터에 이메일·이름·전화번호 등 개인정보를 절대 넣지 않는다
// (개인정보보호법·GA4 정책 위반 소지). 사용자 구분이 필요하면 내부 ID를 쓴다.
export function track(event: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
  amplitude.track(event, params);
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

export function trackFeatureViewed(tabLabel: string) {
  const featureName = FEATURE_NAME_BY_TAB[tabLabel];
  // 매핑에 없는 새 탭은 아직 정의되지 않은 화면이라 보내지 않는다.
  if (!featureName) return;
  track("feature_viewed", { feature_name: featureName });
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
