export type DetailSectionType = {
  title: string;
  content: string | undefined;
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
  image_url: string;
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
