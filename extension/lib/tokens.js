// 로그인 토큰 저장소(chrome.storage.local "feditAuth"). FEDIT 웹과 같은 토큰을 공유하며,
// 동기화는 content/fedit-auth-sync.js 가 한다.
const KEY = "feditAuth";

/** JWT payload 의 iat(발급 시각, 초). 읽을 수 없으면 0. */
export function issuedAt(jwt) {
  try {
    const part = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "=")));
    return Number(json.iat) || 0;
  } catch {
    return 0;
  }
}

export async function getTokens() {
  const { [KEY]: v } = await chrome.storage.local.get(KEY);
  return v && v.accessToken ? v : null;
}

export async function setTokens(accessToken, refreshToken) {
  await chrome.storage.local.set({ [KEY]: { accessToken, refreshToken } });
}

export async function clearTokens() {
  await chrome.storage.local.remove(KEY);
}

