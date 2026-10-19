// FEDIT 백엔드 호출. access token 이 만료(401)되면 /auth/refresh 로 한 번 갱신하고 다시 시도한다.
import { API_BASE } from "./config.js";
import { getTokens, setTokens, clearTokens } from "./tokens.js";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || "요청을 처리하지 못했습니다.");
    this.status = status;
    this.code = code || null;
  }
}
export class AuthError extends ApiError {
  constructor() {
    super(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }
}

let refreshing = null; // 동시에 여러 요청이 401 을 받아도 갱신은 한 번만

async function refreshTokens() {
  if (!refreshing) {
    refreshing = (async () => {
      const t = await getTokens();
      if (!t || !t.refreshToken) throw new AuthError();
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: t.refreshToken }),
      });
      if (!res.ok) {
        await clearTokens();
        throw new AuthError();
      }
      const data = await res.json();
      if (!data.accessToken) {
        await clearTokens();
        throw new AuthError();
      }
      await setTokens(data.accessToken, data.refreshToken || t.refreshToken);
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function send(path, { method = "GET", body } = {}) {
  const t = await getTokens();
  if (!t) throw new AuthError();
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${t.accessToken}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function request(path, opts) {
  let res = await send(path, opts);
  if (res.status === 401) {
    await refreshTokens();
    res = await send(path, opts);
    if (res.status === 401) {
      await clearTokens();
      throw new AuthError();
    }
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data && data.code, data && data.message);
  return data;
}

export const api = {
  me: () => request("/auth/me"),
  boards: () => request("/board/list"),
  createBoard: (name) => request("/board/new", { method: "POST", body: { name } }),
  usage: () => request("/board/external-item/usage"),
  /** 분석 요청(한도에 셈). source=product 면 이미 수집된 상품, extension 이면 VLM 분석 대기 */
  analyze: (payload) => request("/board/external-item/analyze", { method: "POST", body: payload }),
  /** 확장 상품 분석 상태: queued → ai_done → indexed | failed */
  itemStatus: (itemcode) => request(`/board/external-item/${encodeURIComponent(itemcode)}`),
  /** DB(FEDIT 수집 상품) 속 비슷한 상품 — 확장 상품은 VLM 결과로 임베딩 검색, 수집 상품은 웹 상세와 같은 유사상품 */
  similar: (itemcode, limit = 6) => request(`/board/external-item/${encodeURIComponent(itemcode)}/similar?limit=${limit}`),
  /** 트렌드지수(수집 상품=실측/예측, 확장 상품=유사상품 기준 추정) — 웹 상세와 같은 데이터 */
  trend: (itemcode) => request(`/trendIndex/${encodeURIComponent(itemcode)}`),
  /** 이미 수집된 상품의 VLM 결과(웹 상세와 같은 데이터) */
  product: (itemcode) => request(`/products?itemCode=${encodeURIComponent(itemcode)}`),
  /** 보드에 담기(정식 상품·확장 상품 공통) */
  addToBoard: (boardId, itemcode) => request("/board/newitem", { method: "POST", body: { boardId, itemcode } }),
};
