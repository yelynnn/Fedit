// 광고 유입 경로(UTM) 저장.
//
// 랜딩(fedit.framer.website)의 커스텀 코드가 서비스로 넘어오는 링크에
// utm_* / fbclid / gclid 를 붙여준다. 그 값을 회원가입이 끝날 때까지 들고
// 있다가 가입 API로 함께 보내서, "이 회원이 어떤 광고로 들어왔는지"를
// 회원 DB에 남기기 위한 모듈.
//
// secretEntry.ts 의 ?ref= 플래그와 같은 이유로 localStorage를 쓴다 — 로그인
// 페이지 → 회원가입 → 인증까지 여러 화면을 거치는 동안 쿼리스트링이 사라지기
// 때문. 다만 여기서는 만료를 24시간이 아니라 30일로 둔다. 광고를 보고 며칠
// 뒤에 가입하는 경우가 흔해서다.
//
// first_touch: 처음 들어온 경로. 한 번 저장되면 덮어쓰지 않는다.
// last_touch : 가장 최근 경로. 광고를 여러 번 거쳐 와도 마지막 값으로 갱신된다.
// 둘 다 없으면 자연 유입/직접 방문으로 본다(가입은 그대로 진행된다).

const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;

type AttributionKey = (typeof KEYS)[number];

export type AttributionRecord = Partial<Record<AttributionKey, string>> & {
  landing_path: string;
  referrer: string;
  captured_at: string;
};

export interface AttributionPayload {
  first_touch: AttributionRecord | null;
  last_touch: AttributionRecord | null;
}

const FIRST_KEY = "feditAttrFirst";
const LAST_KEY = "feditAttrLast";
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30일

// 시크릿 모드나 저장소가 꽉 찬 브라우저에서 throw 되면 가입 자체가 막히므로
// 읽기/쓰기를 전부 감싼다. 유입 경로는 없어도 되는 값이다.
const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 저장 못 해도 그냥 넘어간다 */
  }
};

const safeRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
};

const read = (key: string): AttributionRecord | null => {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as AttributionRecord | null;
    if (!rec?.captured_at) return null;
    if (Date.now() - Date.parse(rec.captured_at) > EXPIRY_MS) {
      safeRemove(key);
      return null;
    }
    return rec;
  } catch {
    safeRemove(key);
    return null;
  }
};

// 앱이 처음 로드될 때 한 번 호출한다(main.tsx). 어느 페이지로 들어오든
// 주소에 광고 파라미터가 하나라도 있으면 잡고, 없으면 아무것도 하지 않는다.
export const captureAttribution = (): void => {
  if (typeof window === "undefined") return;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return;
  }

  const hit: Partial<Record<AttributionKey, string>> = {};
  KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) hit[key] = value;
  });
  if (Object.keys(hit).length === 0) return;

  const record: AttributionRecord = {
    ...hit,
    landing_path: window.location.pathname,
    referrer: document.referrer || "",
    captured_at: new Date().toISOString(),
  };

  const json = JSON.stringify(record);
  safeSet(LAST_KEY, json);
  if (!read(FIRST_KEY)) safeSet(FIRST_KEY, json);
};

// 가입 API body에 그대로 얹는다. 값이 없으면 둘 다 null이 나간다.
export const getAttribution = (): AttributionPayload => ({
  first_touch: read(FIRST_KEY),
  last_touch: read(LAST_KEY),
});

// 지금은 쓰지 않는다. 재가입/다중 계정 분석에 쓰일 수 있어 가입 후에도 남겨둔다.
export const clearAttribution = (): void => {
  safeRemove(FIRST_KEY);
  safeRemove(LAST_KEY);
};
