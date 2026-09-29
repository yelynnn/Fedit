import { createRoot } from "react-dom/client";
import * as amplitude from "@amplitude/unified";
import "./index.css";
import App from "./App.tsx";
import { captureAttribution } from "@/lib/attribution";

// Amplitude(분석 + 세션 리플레이) — 앱 전체에서 한 번만 초기화한다.
// initAll이어야 세션 리플레이가 같이 붙는다(init만 쓰면 분석만 켜짐).
// sampleRate 0.2 — 기본값 1(전수 녹화)에서 낮춘 것. 고객사 상품 기획 화면이
// 녹화되는 문제 때문이며, 개인정보처리방침 정비 후 올린다.
const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;
// localhost(로컬 개발)에서는 초기화 자체를 건너뛴다 — 실제 사용자 지표에
// 테스트 데이터가 섞이는 걸 막는다.
const isLocalhost = ["localhost", "127.0.0.1"].includes(
  window.location.hostname,
);
if (isLocalhost) {
  console.info("Amplitude disabled on localhost");
} else if (!AMPLITUDE_API_KEY) {
  console.warn("Amplitude API key missing — analytics disabled");
} else {
  amplitude.initAll(AMPLITUDE_API_KEY, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 0.2 },
  });
}

// 광고 유입 경로(UTM) 저장 — 어느 페이지로 들어오든 첫 로드 때 한 번 잡는다.
// SPA라 화면이 바뀌면 쿼리스트링이 사라지므로 렌더 전에 호출해야 한다.
captureAttribution();

createRoot(document.getElementById("root")!).render(<App />);
