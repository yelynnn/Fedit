import { axiosInstance } from "./AxiosInstance";

// 자사 브랜드·자사 맞춤 분석 API (2026-11-17)
//   GET  /brand/own                → { brand: string | null }
//   PUT  /brand/own   { brand }    → { brand: string | null }   (빈 값이면 해제)
//   POST /brand/own/apply { brand }                             (자사 브랜드 분석 신청, 영업일 1~2일 내 반영)
//   GET  /category/own-insights?year&season → OwnBrandInsights   (자사 브랜드가 없으면 brand: null)

export type OwnBrandInsights = {
  brand: string | null;
  keyword: { total: number; covered: number; missingKeywords: string[] } | null;
  prices: { type: string; price: number; percentile: number; ownCount: number }[];
};

const toError = (error: any, fallback: string) => {
  const e = new Error(error?.response?.data?.message || fallback) as Error & { status?: number };
  e.status = error?.response?.status;
  return e;
};

export const GetOwnBrand = async (): Promise<string | null> => {
  try {
    const res = await axiosInstance.get("/brand/own");
    return res.data?.brand ?? null;
  } catch (error: any) {
    throw toError(error, "자사 브랜드를 불러오지 못했어요.");
  }
};

export const PutOwnBrand = async (brand: string | null): Promise<string | null> => {
  try {
    const res = await axiosInstance.put("/brand/own", { brand });
    return res.data?.brand ?? null;
  } catch (error: any) {
    throw toError(error, "자사 브랜드를 저장하지 못했어요.");
  }
};

export const PostOwnBrandApply = async (brand: string): Promise<void> => {
  try {
    await axiosInstance.post("/brand/own/apply", { brand });
  } catch (error: any) {
    throw toError(error, "신청에 실패했어요.");
  }
};

export const GetOwnBrandInsights = async (period: {
  year?: string;
  season?: string;
}): Promise<OwnBrandInsights> => {
  try {
    const res = await axiosInstance.get("/category/own-insights", { params: period });
    return res.data;
  } catch (error: any) {
    throw toError(error, "자사 맞춤 분석을 불러오지 못했어요.");
  }
};
