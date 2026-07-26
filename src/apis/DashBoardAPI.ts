import type {
  GetTrendKeywordParams,
  MainItemTrendBoxProps,
  GetDashboardRankingParams,
  DashboardRankingResponse,
  RankingItemDetailResponse,
  TrendIndexResponse,
} from "@/types/Main";
import { axiosInstance } from "./AxiosInstance";

const GetTrendKeyword = async ({
  audienceType,
  date,
  brand,
}: GetTrendKeywordParams) => {
  try {
    const queryParams = new URLSearchParams();

    queryParams.append("audience-type", audienceType);

    if (date && date.trim() !== "") {
      queryParams.append("date", date);
    }

    if (brand && brand.trim() !== "") {
      queryParams.append("brand", brand);
    }

    const res = await axiosInstance.get(
      `/api/v1/home/keyword?${queryParams.toString()}`,
    );

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

export {
  GetTrendKeyword,
  GetTrendGraph,
  GetItemTrend,
  GetTrendColor,
  GetDashboardRanking,
  GetRankingItemDetail,
  GetTrendIndex,
};
