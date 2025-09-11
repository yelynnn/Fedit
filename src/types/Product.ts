export type DetailSectionType = {
  title: string;
  content: string | string[];
};

export type ProductStore = {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
};

interface ProductList {
  brand?: string;
  itemcode: string;
  product_name: string;
  category: string;
  front_image_url?: string;
  regular_price?: string | null;
  current_price: string;
  rating: number | null;
  reviews: number | null;
}

export interface ProductBoxProps {
  product: ProductList;
}

interface ProductDetail extends ProductList {
  material?: string;
  gender?: string;
  color_classification_url?: string | null;
  product_detail_url?: string | null;
  details?: string;
  discount_rate?: string | null;
  color_text?: string;
  release_date: number;
  stop_selling_date?: number | null;
}

export interface ProductDetailProps {
  product: ProductDetail;
}

type ApiCategory = { main_category: string | null; category: string | null };

export type ApiDetail = {
  itemcode: string;
  product_name: string;
  gender: string | null;
  brand: string | null;
  categories: ApiCategory[];
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
