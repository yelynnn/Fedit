export type DetailSectionType = {
  title: string;
  content: string | string[];
};

type ApiCategory = {
  main_category?: string | null;
  category?: string | null;
};

export type ApiDetail = {
  itemcode: string;
  product_name: string;
  gender: string | null;
  brand: string | null;
  categories?: ApiCategory[];
  front_image_url: string | null;
  material: string | null;
  current_price: string | number | null;
  regular_price: string | number | null;
  discount_rate: string | number | null;
  reviews: number | null;
  rating: number | null;
  colors?: string[];
  details: string | null;
  stop_selling_date: string | null;
  release_date: string | null;
  ai_description: string | null;
  product_detail_url?: string | null;
};
