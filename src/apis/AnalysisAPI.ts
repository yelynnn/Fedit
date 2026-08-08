import { useFilterStore } from "@/stores/FilterStore";
import { axiosInstance } from "./AxiosInstance";

const GetProductByItemCode = async (itemcode: string) => {
  const response = await axiosInstance.get("/products", {
    params: { itemCode: itemcode },
  });
  return response.data as import("@/types/Product").ApiDetail;
};

const GetDetailInfo = async ({ itemcode }: { itemcode: string }) => {
  const response = await axiosInstance.get(`/detail/${itemcode}`);
  return response.data;
};

const GetRelatedItemInfo = async ({ itemcode }: { itemcode: string }) => {
  const response = await axiosInstance.get(`/products/detail/${itemcode}`);
  return response.data;
};

const GetBrandList = async () => {
  const response = await axiosInstance.get(`/menu/brand`);
  return response.data;
};

const GetColorGraph = async () => {
  const { brandList } = useFilterStore.getState();
  const query = brandList.join(",");
  const response = await axiosInstance.get(
    `/api/v1/color-analysis/graph?brand=${encodeURIComponent(query)}`,
  );
  return response.data;
};

const GetCategoryGraph = async () => {
  const { brandList } = useFilterStore.getState();
  const query = brandList.join(",");
  const response = await axiosInstance.get(
    `/category/graph?brand=${encodeURIComponent(query)}`,
  );
  return response.data;
};

type GetColorProductParams = {
  brand: string;
  parent_color_hex: string;
};

const GetColorProduct = async ({
  brand,
  parent_color_hex,
}: GetColorProductParams) => {
  const response = await axiosInstance.get("/color/product", {
    params: {
      brand,
      parent_color_hex,
    },
  });
  return response.data;
};

type ProductFilterPayload = {
  brandList: string[];
  // 무신사/29cm처럼 입점 브랜드가 100개 넘는 플랫폼을 통째로 선택했을 때,
  // 개별 브랜드명(selectedBrands) 대신 플랫폼 코드(selectedPlatforms, 예:
  // "musinsa")로 보낸다 — 헤더가 브랜드 100개 넘게 나열되는 걸 피하기 위함.
  platformList?: string[];
  selectedColors: string[];
  selectedGenders: string[];
  selectedCategories: string[];
  selectedDetails: string[];
  selectedPatterns: string[];
  selectedSeasons: string[];
};

const GetProductList = async (
  payload: ProductFilterPayload & {
    cursor?: string | null;
    // 엑셀 다운로드 중단 등, 진행 중인 요청을 취소할 수 있어야 하는 곳에서 넘긴다.
    signal?: AbortSignal;
  },
) => {
  const {
    brandList,
    platformList,
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
    cursor,
    signal,
  } = payload;

  const params = {
    selectedBrands: brandList,
    selectedPlatforms: platformList ?? [],
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
    size: 50,
    cursor: cursor || undefined,
  };

  const res = await axiosInstance.get("/products", {
    params,
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
      return searchParams.toString();
    },
    signal,
  });
  return res.data;
};

const GetPatternList = async (): Promise<string[]> => {
  try {
    const res = await axiosInstance.get("/menu/pattern");
    return Array.isArray(res.data?.patterns) ? res.data.patterns : [];
  } catch {
    return [];
  }
};

const GetDetailList = async (): Promise<string[]> => {
  try {
    const res = await axiosInstance.get("/menu/detail");
    return Array.isArray(res.data?.details) ? res.data.details : [];
  } catch {
    return [];
  }
};

export type CategoryGroup = { label: string; items: string[] };

const GetCategoryList = async (): Promise<CategoryGroup[]> => {
  try {
    const res = await axiosInstance.get("/menu/category");
    return Array.isArray(res.data?.categories) ? res.data.categories : [];
  } catch {
    return [];
  }
};

type JudgePayload = {
  itemcode: string;
  column: string;
  judge: 1 | -1;
  feedback: string[] | null;
};

const PostJudge = async (payload: JudgePayload): Promise<void> => {
  try {
    await axiosInstance.post("/judge", payload);
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

const GetBrandPicks = async (): Promise<string[]> => {
  const res = await axiosInstance.get("/brand/picks");
  return Array.isArray(res.data) ? res.data : [];
};

const PutBrandPicks = async (brandNames: string[]): Promise<void> => {
  try {
    await axiosInstance.put("/brand/picks", { brandNames });
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "브랜드 저장에 실패했습니다.",
      ) as Error & { code?: string; status?: number };
      e.status = error.response.status;
      e.code = error.response?.data?.code;
      throw e;
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

const PostBrandApply = async (brand: string): Promise<void> => {
  try {
    await axiosInstance.post("/menu/apply", { brand });
  } catch (error: any) {
    if (error?.response) {
      const e = new Error(
        error.response?.data?.message || "입점 신청에 실패했습니다.",
      ) as Error & { status?: number };
      e.status = error.response.status;
      throw e;
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

// FREE는 두 API 모두 403(FREE_PLAN_NOT_ALLOWED), BASIC/BASIC_SECRET는 월
// limit 안에서 used/remaining을 관리, PRO는 limited:false로 무제한이지만
// used는 계속 집계된다.
export type ExcelDownloadUsage = {
  plan: string;
  limited: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  canDownload: boolean;
};

const handleExcelDownloadError = (error: any, fallbackMessage: string): never => {
  if (error?.response) {
    const e = new Error(
      error.response?.data?.message || fallbackMessage,
    ) as Error & { code?: string; status?: number };
    e.status = error.response.status;
    e.code = error.response?.data?.code;
    throw e;
  }
  throw new Error("서버에 연결할 수 없습니다.");
};

const GetExcelDownloadUsage = async (): Promise<ExcelDownloadUsage> => {
  try {
    const res = await axiosInstance.get("/excel-downloads/usage");
    return res.data;
  } catch (error: any) {
    return handleExcelDownloadError(error, "다운로드 현황을 불러오지 못했습니다.");
  }
};

const PostExcelDownload = async (): Promise<ExcelDownloadUsage> => {
  try {
    const res = await axiosInstance.post("/excel-downloads");
    return res.data;
  } catch (error: any) {
    return handleExcelDownloadError(error, "다운로드 기록에 실패했습니다.");
  }
};

export {
  GetProductByItemCode,
  GetDetailInfo,
  GetColorGraph,
  GetColorProduct,
  GetCategoryGraph,
  GetProductList,
  GetBrandList,
  GetRelatedItemInfo,
  PostJudge,
  GetPatternList,
  GetDetailList,
  GetCategoryList,
  GetBrandPicks,
  PutBrandPicks,
  PostBrandApply,
  GetExcelDownloadUsage,
  PostExcelDownload,
};
