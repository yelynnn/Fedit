import { createRoot } from "react-dom/client";
import * as amplitude from "@amplitude/unified";
import "./index.css";
import App from "./App.tsx";

// Amplitude(분석 + 세션 리플레이) — 앱 전체에서 한 번만 초기화한다.
// initAll이어야 세션 리플레이가 같이 붙는다(init만 쓰면 분석만 켜짐).
// sampleRate 0.2 — 기본값 1(전수 녹화)에서 낮춘 것. 고객사 상품 기획 화면이
// 녹화되는 문제 때문이며, 개인정보처리방침 정비 후 올린다.
const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;
if (!AMPLITUDE_API_KEY) {
  console.warn("Amplitude API key missing — analytics disabled");
} else {
  amplitude.initAll(AMPLITUDE_API_KEY, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 0.2 },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
