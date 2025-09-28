import { axiosInstance } from "./AxiosInstance";

const GetTrendKeyword = async () => {
  try {
    const res = await axiosInstance.get("/api/v1/home/keyword");
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

const GetItemTrend = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/home/itemtrend`);
    return response.data;
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
