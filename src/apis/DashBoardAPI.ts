import type {
  GetTrendKeywordParams,
  MainItemTrendBoxProps,
  GetDashboardRankingParams,
  DashboardRankingResponse,
  RankingItemDetailResponse,
  TrendIndexResponse,
  TrendKeywordResponse,
  GetTestTrendRankingParams,
  TrendRankingPageResponse,
  TrendSnapshotDetailDto,
} from "@/types/Main";
import { axiosInstance } from "./AxiosInstance";

const GetTrendKeyword = async ({
  date,
  platform,
}: GetTrendKeywordParams): Promise<TrendKeywordResponse> => {
  try {
    const res = await axiosInstance.get(`/dashboard/keyword`, {
      params: { date, platform },
    });

    return res.data;
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "요청 실패",
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw error;
  }
};

const GetTrendGraph = async () => {
  const response = await axiosInstance.get(`/api/v1/home/trendgraph`);
  return response.data;
};

const GetItemTrend = async ({ audienceType }: MainItemTrendBoxProps) => {
  const queryParams = new URLSearchParams();
  queryParams.append("audience-type", audienceType);

  const response = await axiosInstance.get(
    `/api/v1/home/itemtrend?${queryParams.toString()}`,
  );

  return response.data.item_trends;
};

const GetTrendColor = async () => {
  const response = await axiosInstance.get(`/api/v1/home/colortrend`);
  return response.data;
};

const GetDashboardRanking = async ({
  platform,
  category,
}: GetDashboardRankingParams): Promise<DashboardRankingResponse> => {
  try {
    const testDate = "2026-03-w02";
    const apiPlatform = platform === "29CM" ? "29cm" : platform;
    const res = await axiosInstance.get(`/dashboard/ranking`, {
      params: { platform: apiPlatform, category, date: testDate },
      paramsSerializer: (params) =>
        Object.entries(params)
          .map(([k, v]) => `${k}=${v}`)
          .join("&"),
    });
    return res.data;
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "요청 실패",
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw error;
  }
};

const GetTrendIndex = async (itemCode: string): Promise<TrendIndexResponse> => {
  try {
    const res = await axiosInstance.get(`/trendIndex/${itemCode}`);
    return res.data;
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "요청 실패",
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw error;
  }
};

const GetRankingItemDetail = async (
  itemcode: string,
): Promise<RankingItemDetailResponse> => {
  try {
    const res = await axiosInstance.get(`/dashboard/ranking/${itemcode}`);
    return res.data;
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "요청 실패",
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw error;
  }
};

// 트렌드 지수 고도화 — 테스트용 랭킹 조회. platform/category는 백엔드 슬러그
// 그대로(예: "29cm", "skirt") 넘겨야 한다 — 기존 GetDashboardRanking처럼
// 한글 라벨을 변환해주지 않는다.
const GetTestTrendRanking = async ({
  platform,
  category,
  date,
  page = 0,
  size = 20,
}: GetTestTrendRankingParams): Promise<TrendRankingPageResponse> => {
  try {
    const res = await axiosInstance.get(`/test/trend`, {
      params: { platform, category, date, page, size },
    });
    return res.data;
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "요청 실패",
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw error;
  }
};

// 트렌드 지수 고도화 — 테스트용 상품 스냅샷 상세. date를 생략하면 백엔드가
// 해당 상품의 가장 최근 스냅샷을 반환한다. 데이터가 없는 상품(404
// TREND_SNAPSHOT_NOT_FOUND)은 에러 대신 null로 돌려줘서 화면에서 "데이터
// 없음" 상태로 자연스럽게 처리할 수 있게 한다.
const GetTestTrendSnapshot = async (
  tempItemId: number,
  date?: string,
): Promise<TrendSnapshotDetailDto | null> => {
  try {
    const res = await axiosInstance.get(`/test/trend/${tempItemId}`, {
      params: date ? { date } : undefined,
    });
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "요청 실패",
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw error;
  }
};

export {
  GetTrendKeyword,
  GetTrendGraph,
  GetItemTrend,
  GetTrendColor,
  GetDashboardRanking,
  GetRankingItemDetail,
  GetTrendIndex,
  GetTestTrendRanking,
  GetTestTrendSnapshot,
};
