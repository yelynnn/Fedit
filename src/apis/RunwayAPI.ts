import { axiosInstance } from "./AxiosInstance";

export type Magazine = {
  name: string;
  magazine_url: string;
};

export type PointColor = {
  name: string;
  hex: string;
};

export type Texture = {
  image_url: string;
  name: string;
  detail: string;
};

export type RunwayItem = {
  image_url: string;
  name: string;
  detail: string;
};

export type RunwayResult = {
  brand: string;
  insight: string;
  points: string[];
  magazine: Magazine[];
  point_color: PointColor[];
  color_insight: string;
  texture: Texture[];
  apply_point: string[];
  items: RunwayItem[];
};

export type FashionShowResponse = {
  results: RunwayResult[];
};

const GetFashionShow = async (season: string): Promise<FashionShowResponse> => {
  try {
    const response = await axiosInstance.get<FashionShowResponse>("/fashionshow", {
      params: { season },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { GetFashionShow };
