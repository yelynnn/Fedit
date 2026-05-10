export type DetailSectionType = {
  title: string;
  content: string | string[];
};

type ApiCategory = {
  main_category?: string | null;
  category?: string | null;
};

type Vlm = {
  length: string;
  material: string;
  neckline: string;
  sleeve: string;
  fit: string;
  pattern: string;
  detail: string[];
  color: string[];
};

export type ApiDetail = {
  itemcode: string;
  product_name: string;
  gender: string | null;
  brand: string | null;
  categories?: ApiCategory[];
  thumbnail?: string | null;
  front_image_url?: string | null;
  current_price: string | null;
  regular_price: string | null;
  discount_rate: string | number | null;
  reviews: number | null;
  rating: number | null;
  vlm?: Vlm | null;
  release_date: string | null;
  ai_description: string | null;
  product_detail_url?: string | null;
  views?: string | number | null;
  sales?: string | number | null;
  platform?: string | null;
};
