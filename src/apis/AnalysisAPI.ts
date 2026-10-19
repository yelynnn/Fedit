import { useFilterStore } from "@/stores/FilterStore";
import { axiosInstance } from "./AxiosInstance";
import { SIMULATED_SUBSCRIPTION } from "@/stores/SubscriptionStore";

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
  // 무드·계절감 — 같은 항목 안은 OR, 다른 필터와는 AND(백엔드)
  selectedMoods?: string[];
  selectedSeasonFeels?: string[];
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
    selectedMoods = [],
    selectedSeasonFeels = [],
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
    selectedMoods,
    selectedSeasonFeels,
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

// ── 상품 비교 ─────────────────────────────────────────────────────────
// GET /products/compare?itemCodes=A&itemCodes=B (최대 4개). 비교표는 행 단위
// (rows)로 오고, "최고" 칸(best: 상품 인덱스)도 백엔드가 정해 준다.

export type CompareApiItem = {
  itemcode: string;
  brand: string | null;
  product_name: string;
  thumbnail: string | null;
  current_price: number | string | null;
  regular_price: number | string | null;
};

export type CompareRow = {
  key: string;
  label: string;
  // summary(통합 지수) · performance(성과) · price(가격) · design(디자인) · more(트렌드지수 상세)
  group?: string;
  values: (string | null)[];
  best: number[];
  // 디자인 행: 값이 있는 상품끼리 모두 같으면 true, 다르면 false, 값 2개 미만이면 null
  same?: boolean | null;
};

export type CompareResponse = {
  items: CompareApiItem[];
  rows: CompareRow[];
};

const GetCompare = async (itemCodes: string[]): Promise<CompareResponse> => {
  const res = await axiosInstance.get("/products/compare", {
    params: { itemCodes },
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();
      (params.itemCodes as string[]).forEach((code) => searchParams.append("itemCodes", code));
      return searchParams.toString();
    },
  });
  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    rows: Array.isArray(res.data?.rows) ? res.data.rows : [],
  };
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

// 무드 필터 칩 목록(받은 순서 그대로 표시)
const GetMoodList = async (): Promise<string[]> => {
  try {
    const res = await axiosInstance.get("/menu/mood");
    return Array.isArray(res.data?.moods) ? res.data.moods : [];
  } catch {
    return [];
  }
};

// 계절감 필터 칩 목록(봄·여름·가을·겨울·사계절). 연도+시즌 코드(26SS 등)인
// "시즌"과는 다른 항목이다.
const GetSeasonFeelList = async (): Promise<string[]> => {
  try {
    const res = await axiosInstance.get("/menu/season-feel");
    return Array.isArray(res.data?.seasonFeels) ? res.data.seasonFeels : [];
  } catch {
    return [];
  }
};

// "23FW", "25SS" 처럼 "YY" + "SS"/"FW"가 붙은 시즌 코드 목록을 그대로 준다.
const GetSeasonList = async (): Promise<string[]> => {
  try {
    const res = await axiosInstance.get("/menu/season");
    return Array.isArray(res.data?.seasons) ? res.data.seasons : [];
  } catch {
    return [];
  }
};

export type CategoryGroup = { label: string; items: string[] };

const GetCategoryList = async (): Promise<CategoryGroup[]> => {
  try {
    const res = await axiosInstance.get("/menu/category");
    const groups: CategoryGroup[] = Array.isArray(res.data?.categories) ? res.data.categories : [];
    // 세부 항목 중 대분류명과 완전히 같은 값(예: "원피스" 안의 "원피스")은 목록에서
    // 안 보이게 한다 — "전체 선택하기"로 이미 커버되고, 상품-카테고리 연결은
    // DB에 그대로 남아있어서 필터링에는 영향 없음.
    return groups.map((g) => ({
      ...g,
      items: g.items.filter((item) => item !== g.label),
    }));
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

// 로컬 개발에서 ?simulatePlan=trial|basic|pro 로 볼 때는 관심 브랜드 저장·조회를
// 서버 대신 브라우저에 한다 — 서버는 실제 계정 요금제로 판단해서(예: Enterprise
// 계정이면 "Basic·Pro만 가능") 체험 계정 흐름을 끝까지 볼 수 없기 때문이다.
// 고른 브랜드로 상품을 불러오는 건 실제 서버 그대로다. 배포 빌드에선 동작하지 않는다.
const DEV_PICKS_KEY = "dev-simulated-brand-picks";
const usesSimulatedPicks = () => {
  const sim = SIMULATED_SUBSCRIPTION;
  return !!sim && sim.status !== "not_started" && sim.status !== "expired" && sim.plan !== "enterprise";
};

const GetBrandPicks = async (): Promise<string[]> => {
  if (usesSimulatedPicks()) {
    try {
      return JSON.parse(localStorage.getItem(DEV_PICKS_KEY) ?? "[]");
    } catch {
      return [];
    }
  }
  const res = await axiosInstance.get("/brand/picks");
  return Array.isArray(res.data) ? res.data : [];
};

const PutBrandPicks = async (brandNames: string[]): Promise<void> => {
  if (usesSimulatedPicks()) {
    localStorage.setItem(DEV_PICKS_KEY, JSON.stringify(brandNames));
    return;
  }
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

// FREE는 두 API 모두 403(FREE_PLAN_NOT_ALLOWED). BASIC/BASIC_SECRET/PRO는
// 모두 월 limit 안에서 used/remaining을 관리한다(Basic 월 3회, Pro 월
// 30회). 한도를 넘으면 POST가 403(EXCEL_DOWNLOAD_LIMIT_EXCEEDED)을 낸다.
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
  GetCompare,
  GetMoodList,
  GetSeasonFeelList,
  GetDetailList,
  GetCategoryList,
  GetSeasonList,
  GetBrandPicks,
  PutBrandPicks,
  PostBrandApply,
  GetExcelDownloadUsage,
  PostExcelDownload,
};
