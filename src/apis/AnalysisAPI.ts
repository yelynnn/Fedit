import { useFilterStore } from "@/stores/FilterStore";
import { axiosInstance } from "./AxiosInstance";

const GetDetailInfo = async ({ itemcode }: { itemcode: string }) => {
  try {
    const response = await axiosInstance.get(
      `/api/v1/color-analysis/detailInfo/${itemcode}`
    );
    console.log("상품 상세 정보 조회 성공");
    return response.data;
  } catch (error) {
    console.error("상품 상세 정보 조회 실패", error);
    throw error;
  }
};

const GetRelatedItemInfo = async ({ itemcode }: { itemcode: string }) => {
  try {
    const response = await axiosInstance.get(
      `/api/v1/product-analysis/detailInfo/${itemcode}`
    );
    console.log("유사 아이템 정보 조회 성공");
    return response.data;
  } catch (error) {
    console.error("유사 아이템 정보 조회 실패", error);
    throw error;
  }
};

const GetBrandList = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/menu/brand`);
    return response.data;
  } catch (error) {
    console.error("브랜드 목록 가져오기 실패", error);
    throw error;
  }
};

const GetColorGraph = async () => {
  const { brandList } = useFilterStore.getState();

  try {
    const query = brandList.join(",");
    const response = await axiosInstance.get(
      `/api/v1/color-analysis/graph?brand=${encodeURIComponent(query)}`
    );
    return response.data;
  } catch (error) {
    console.error("색상 그래프 조회 실패", error);
    throw error;
  }
};

const GetCategoryGraph = async () => {
  const { brandList } = useFilterStore.getState();
  try {
    const query = brandList.join(",");
    const response = await axiosInstance.get(
      `/api/v1/category-analysis/graph?brand=${encodeURIComponent(query)}`
    );
    console.log("유형 그래프 조회 성공");
    return response.data;
  } catch (error) {
    console.error("유형 그래프 조회 실패", error);
    throw error;
  }
};

type GetColorProductParams = {
  brand: string;
  parent_color_hex: string;
};

const GetColorProduct = async ({
  brand,
  parent_color_hex,
}: GetColorProductParams) => {
  try {
    const response = await axiosInstance.get("/api/v1/color-analysis/product", {
      params: {
        brand,
        parent_color_hex,
      },
    });
    console.log("색상 그래프 상품 조회 성공");
    return response.data;
  } catch (error) {
    console.error("색상 그래프 상품 조회 실패", error);
    throw error;
  }
};

type ProductFilterPayload = {
  brandList: string[];
  selectedColors: string[];
  selectedGenders: string[];
  selectedCategories: string[];
};

const PostProductList = async (payload: ProductFilterPayload) => {
  const { brandList, selectedColors, selectedGenders, selectedCategories } =
    payload;

  const body = {
    brands: brandList,
    colors: selectedColors,
    genders: selectedGenders,
    categories: selectedCategories,
  };

  const res = await axiosInstance.post("/api/v1/product-analysis", body);
  return res.data;
};

export {
  GetDetailInfo,
  GetColorGraph,
  GetColorProduct,
  GetCategoryGraph,
  PostProductList,
  GetBrandList,
  GetRelatedItemInfo,
};
