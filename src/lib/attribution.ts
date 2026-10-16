// 광고 유입 경로(UTM) 저장.
//
// 랜딩(mify.im/fedit)의 커스텀 코드가 서비스로 넘어오는 링크에
// utm_* / fbclid / gclid 를 붙여준다. 그 값을 회원가입이 끝날 때까지 들고
// 있다가 가입 API로 함께 보내서, "이 회원이 어떤 광고로 들어왔는지"를
// 회원 DB에 남기기 위한 모듈.
//
// secretEntry.ts 의 ?ref= 플래그와 같은 이유로 localStorage를 쓴다 — 로그인
// 페이지 → 회원가입 → 인증까지 여러 화면을 거치는 동안 쿼리스트링이 사라지기
// 때문. 다만 여기서는 만료를 24시간이 아니라 30일로 둔다. 광고를 보고 며칠
// 뒤에 가입하는 경우가 흔해서다.
//
// 광고 클릭 ID(fbclid/gclid)는 주소에서 빠지는 경우가 있어서(랜딩 → 앱으로
// 넘어오는 링크에 안 붙거나, 브라우저가 추적 파라미터를 지우는 경우), 주소에
// 없으면 광고 태그가 상위 도메인(.mify.im)에 남긴 쿠키에서 대신 읽는다.
//   - Meta 픽셀 _fbc  : "fb.1.<타임스탬프>.<fbclid>"
//     원본 값도 fbc로 같이 남긴다 — 전환 API(CAPI)로 fbc를 보낼 때 원래 클릭
//     시각이 필요해서다. 단, 쿠키의 fbclid가 이 기록의 fbclid와 같을 때만
//     저장한다(예전 다른 광고 클릭의 쿠키가 섞이지 않게).
//     쿠키가 없으면 Meta 안내대로 "fb.1.<시각>.<fbclid>"를 직접 만든다. 시각은
//     실제 클릭에 더 가까운 랜딩 도착 시각(UtmBridge가 앱 링크에 붙이는
//     landing_ts, 밀리초)을 쓰고, 없으면 앱 도착 시각을 쓴다. fbc_source로
//     쿠키 원본("cookie")인지 직접 만든 값("built")인지 구분한다.
//   - Google 전환 링커 _gcl_aw : "GCL.<타임스탬프>.<gclid>"
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
  // Meta 픽셀 _fbc 쿠키 원본("fb.1.<클릭 시각 ms>.<fbclid>"), 없으면 직접 만든 값
  fbc?: string;
  fbc_source?: "cookie" | "built";
  // 랜딩(UtmBridge)에 도착한 시각(밀리초) — 앱 주소의 landing_ts로 넘어온 경우만
  landing_ts?: number;
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

const readCookie = (name: string): string | null => {
  try {
    const hit = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
};

// 쿠키 값에서 클릭 ID 부분만 꺼낸다(클릭 ID 안에 "."이 들어 있어도 그대로 살린다)
const clickIdFromCookie = (name: string, prefixParts: number): string | undefined => {
  const raw = readCookie(name);
  if (!raw) return undefined;
  const id = raw.split(".").slice(prefixParts).join(".");
  return id || undefined;
};

const cookieClickIds = (): Partial<Record<"fbclid" | "gclid" | "fbc", string>> => {
  const ids: Partial<Record<"fbclid" | "gclid" | "fbc", string>> = {};
  const fbclid = clickIdFromCookie("_fbc", 3);
  const gclid = clickIdFromCookie("_gcl_aw", 2);
  if (fbclid) {
    ids.fbclid = fbclid;
    ids.fbc = readCookie("_fbc") ?? undefined;
  }
  if (gclid) ids.gclid = gclid;
  return ids;
};

// 주소에 없는 클릭 ID만 쿠키 값으로 채운다(주소 값이 항상 우선).
// fbc는 쿠키 원본이 우선이고(최종 fbclid와 쿠키의 fbclid가 같을 때만),
// 쿠키가 없으면 랜딩 도착 시각(없으면 앱 도착 시각)으로 직접 만든다.
// 이전에 직접 만든 값이 있어도 나중에 같은 클릭의 쿠키가 생기면 쿠키로 바꾼다.
const withCookieClickIds = (record: AttributionRecord): AttributionRecord => {
  const ids = cookieClickIds();
  const fbclid = record.fbclid || ids.fbclid;
  const gclid = record.gclid || ids.gclid;

  let fbc = record.fbc;
  let fbcSource = record.fbc ? (record.fbc_source ?? "cookie") : undefined;
  if (fbclid && ids.fbc && ids.fbclid === fbclid && fbcSource !== "cookie") {
    fbc = ids.fbc;
    fbcSource = "cookie";
  } else if (fbclid && !fbc) {
    const clickedAt = record.landing_ts ?? Date.parse(record.captured_at);
    fbc = `fb.1.${Number.isFinite(clickedAt) ? clickedAt : Date.now()}.${fbclid}`;
    fbcSource = "built";
  }

  return {
    ...record,
    ...(fbclid ? { fbclid } : {}),
    ...(gclid ? { gclid } : {}),
    ...(fbc ? { fbc, fbc_source: fbcSource } : {}),
  };
};

// UtmBridge가 넘기는 랜딩 도착 시각(landing_ts, 밀리초 숫자). 숫자가 아니거나
// 미래(시계 오차 5분 허용) 또는 보관 기간(30일)보다 오래된 값은 버린다.
const landingTs = (params: URLSearchParams): number | undefined => {
  const raw = params.get("landing_ts");
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const at = Number(raw);
  const now = Date.now();
  if (!Number.isSafeInteger(at) || at > now + 5 * 60 * 1000 || now - at > EXPIRY_MS) return undefined;
  return at;
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

  const landingAt = landingTs(params);
  const record: AttributionRecord = withCookieClickIds({
    ...hit,
    ...(landingAt ? { landing_ts: landingAt } : {}),
    landing_path: window.location.pathname,
    referrer: document.referrer || "",
    captured_at: new Date().toISOString(),
  });

  const json = JSON.stringify(record);
  safeSet(LAST_KEY, json);
  if (!read(FIRST_KEY)) safeSet(FIRST_KEY, json);
};

// 가입 API body에 그대로 얹는다. 값이 없으면 둘 다 null이 나간다.
// 가입 시점의 last_touch에 클릭 ID가 없으면 쿠키 값으로 한 번 더 채운다 —
// 광고 태그가 앱 첫 로드 뒤에 쿠키를 남기는 경우까지 잡기 위해서다.
// first_touch는 "처음 들어온 경로" 의미를 지키려고 저장된 값 그대로 보낸다.
export const getAttribution = (): AttributionPayload => {
  const last = read(LAST_KEY);
  return {
    first_touch: read(FIRST_KEY),
    last_touch: last ? withCookieClickIds(last) : null,
  };
};

// 지금은 쓰지 않는다. 재가입/다중 계정 분석에 쓰일 수 있어 가입 후에도 남겨둔다.
export const clearAttribution = (): void => {
  safeRemove(FIRST_KEY);
  safeRemove(LAST_KEY);
};
