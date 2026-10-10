import axios from "axios";
import { useAuthStore } from "@/stores/AuthStore";
import { useUIStore } from "@/stores/UIStore";

// 관리자가 아닌 사용자가 미공개 기능 API를 부르면 403 FEATURE_NOT_RELEASED가 온다
export const FEATURE_NOT_RELEASED_MESSAGE = "준비 중인 기능입니다.";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 토큰 재발급 엔드포인트. 요청 시 Authorization 헤더는 (만료된) 기존 accessToken을
// 그대로 사용하고, body로 refreshToken을 함께 보낸다. 응답은 로그인과 동일하게
// accessToken/refreshToken을 매번 함께 새로 내려준다(탈취 대비 로테이션).
const REFRESH_URL = "/auth/refresh";

let isRefreshing = false;
let waiters: ((token: string | null) => void)[] = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await axiosInstance.post(REFRESH_URL, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = res.data ?? {};
    if (!accessToken) return null;

    localStorage.setItem("accessToken", accessToken);
    if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error?.config;
    const status = error?.response?.status;

    const isRefreshCall = typeof config?.url === "string" && config.url.includes(REFRESH_URL);

    // 미공개 기능 — 화면에 안내를 띄우고, 각 API가 에러 메시지를 그대로
    // 보여주는 곳에서도 같은 문구가 나오도록 message를 채워서 넘긴다.
    if (status === 403 && error?.response?.data?.code === "FEATURE_NOT_RELEASED") {
      error.response.data = { ...error.response.data, message: FEATURE_NOT_RELEASED_MESSAGE };
      useUIStore.getState().showNotice(FEATURE_NOT_RELEASED_MESSAGE);
      return Promise.reject(error);
    }

    // 401이 아니거나, refresh 요청 자체가 실패했거나, 이미 재시도한 요청이면
    // 더 이상 시도하지 않고 바로 세션 만료 처리한다.
    if (status !== 401 || !config || isRefreshCall || config._retriedAfterRefresh) {
      if (status === 401) {
        useAuthStore.getState().setSessionExpired(true);
      }
      return Promise.reject(error);
    }

    config._retriedAfterRefresh = true;

    // 이미 다른 요청이 갱신 중이면, 그 결과를 기다렸다가 새 토큰으로 재요청한다.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          config.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(config));
        });
      });
    }

    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;

    const pending = waiters;
    waiters = [];
    pending.forEach((notify) => notify(newToken));

    if (!newToken) {
      useAuthStore.getState().setSessionExpired(true);
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${newToken}`;
    return axiosInstance(config);
  },
);

export { axiosInstance };
