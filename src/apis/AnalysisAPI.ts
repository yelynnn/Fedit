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
  selectedColors: string[];
  selectedGenders: string[];
  selectedCategories: string[];
  selectedDetails: string[];
  selectedPatterns: string[];
  selectedSeasons: string[];
};

const GetProductList = async (
  payload: ProductFilterPayload & { cursor?: string | null },
) => {
  const {
    brandList,
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
    cursor,
  } = payload;

  const params = {
    selectedBrands: brandList,
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
  GetBrandPicks,
  PutBrandPicks,
};
