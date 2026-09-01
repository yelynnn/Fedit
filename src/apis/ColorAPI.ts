import { useFilterStore } from "@/stores/FilterStore";
import { axiosInstance } from "./AxiosInstance";

export interface RelatedItem {
  itemcode: string;
  thumbnail: string;
}

export interface ColorItem {
  color: string;
  name: string;
  value: number;
  related_item: RelatedItem[];
}

export interface BrandColorData {
  brand: string;
  colors: ColorItem[];
}

export interface ColorGraphResponse {
  brands: BrandColorData[];
}

// 트렌드 색상 API 응답 타입 (snake_case)
export interface TrendBrandItem {
  brand_name: string;
  percent: number;
  item_count: number;
  related_item?: RelatedItem[];
}

export interface TrendColorItem {
  rank: number;
  color_name: string;
  color_hex: string;
  score: number;
  growth_rate: number;
  competitor_count: number;
  average_percent: number;
  total_item_count: number;
  is_total: boolean;
  brands: TrendBrandItem[];
}

export interface TrendColorResponse {
  trend_color: TrendColorItem[];
}

export interface ColorProductItem {
  itemcode: string;
  thumbnail: string;
}

const GetColorRelatedProducts = async (params: {
  // 문자열 하나면 단일 브랜드, 배열이면 brand=A&brand=B 형태로 반복 전송한다
  // ("all" 그래프에서 선택한 모든 브랜드를 조회할 때).
  brand: string | string[];
  color_hex: string;
}): Promise<ColorProductItem[]> => {
  const response = await axiosInstance.get("/color/product", {
    params: {
      brand: params.brand,
      color_hex: params.color_hex,
    },
    // 배열을 brand[]=A 가 아니라 brand=A&brand=B 로 직렬화
    paramsSerializer: { indexes: null },
  });
  return Array.isArray(response.data) ? response.data : [];
};

const GetColorGraph = async (): Promise<ColorGraphResponse> => {
  const { brandList } = useFilterStore.getState();
  const query = brandList.join(",");
  const response = await axiosInstance.get("/color/graph", {
    params: { brand: query },
  });
  return response.data;
};

const GetTrendColor = async (): Promise<TrendColorResponse> => {
  const { brandList } = useFilterStore.getState();
  const query = brandList.join(",");
  const response = await axiosInstance.get("/color/trendColor", {
    params: { brand: query },
  });
  return response.data;
};

export { GetColorGraph, GetTrendColor, GetColorRelatedProducts };
