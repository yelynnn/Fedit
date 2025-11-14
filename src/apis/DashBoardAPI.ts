import type {
  GetTrendKeywordParams,
  MainItemTrendBoxProps,
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
      `/api/v1/home/keyword?${queryParams.toString()}`
    );

    return res.data;
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "요청 실패"
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw error;
  }
};

const GetTrendGraph = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/home/trendgraph`);
    // console.log("급상승 유형 그래프 가져오기 성공");
    return response.data;
  } catch (error) {
    console.error("급상승 유형 그래프 가져오기 실패", error);
    throw error;
  }
};

const GetItemTrend = async ({ audienceType }: MainItemTrendBoxProps) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("audience-type", audienceType);

    const response = await axiosInstance.get(
      `/api/v1/home/itemtrend?${queryParams.toString()}`
    );

    return response.data.item_trends;
  } catch (error) {
    console.error("아이템 트렌드 가져오기 실패", error);
    throw error;
  }
};

const GetTrendColor = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/home/colortrend`);
    return response.data;
  } catch (error) {
    console.error("급상승 컬러 가져오기 실패", error);
    throw error;
  }
};

export { GetTrendKeyword, GetTrendGraph, GetItemTrend, GetTrendColor };
