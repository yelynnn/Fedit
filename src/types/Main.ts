type Keyword = {
  idx: number;
  keyword: string;
  status: number;
};

export interface MonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  dateList: string[];
}

export interface MainItemTrendBoxProps {
  audienceType: string;
}

export interface GetTrendKeywordParams {
  audienceType: string;
  date?: string;
  brand?: string;
}

export type KeywordBox = {
  title: string;
  keywords: Keyword[];
  crawledDate?: string | null;
};

export type TitleBox = {
  title: string;
  label: string;
  infoText: string;
};

type ColorItem = {
  color_name: string;
  color_code: string;
};

type ProductItem = {
  product_img_url: string;
  magazine_url: string;
  magazine: string;
};

export type ProductColorData = {
  colors: ColorItem[];
  products: ProductItem[];
};

export type TrendItem = {
  keyword: string;
  keyword_image_url: string;
  search_volume: number;
  search_trend: number[];
  category?: string;
  magazines?: { title: string; magazine_url: string }[];
  magazine?: { title: string; magazine_url: string }[];
  related_item?: { item_image_url: string; item_url: string }[];
};

export type chartProps = { charList: number[] };

export type RankingProduct = {
  product_name: string;
  thumbnail: string;
  brand: string;
  rank: number;
  itemcode: string;
};

export type DashboardRankingResponse = {
  platform: string;
  category: string;
  date: string;
  rankData: {
    date: string;
    category: string;
    platform: string;
    rankData: {
      result: RankingProduct[];
    };
  };
};

export type GetDashboardRankingParams = {
  platform: string;
  category: string;
  date: string;
};

export type TrendIndexResponse = {
  isPlatform: boolean;
  brand: {
    brandScore: number;
    brandPctl: number;
    likes: number | null;
    search: number | null;
    marketScore: number | null;
  };
  purchase: {
    purchaseScore: number;
    purchasePctl: number;
    sales: number;
  };
  category: {
    categoryScore: number;
    categoryPctl: number;
    likes: number | null;
    reorder: number | null;
  };
};

export type RelatedItem = {
  itemCode: string;
  brand: string;
  product_name: string;
  thumbnail?: string;
  details: string[];
};

export type RankingItemDetailResponse = {
  product_detail_url: string;
  ai_description: string;
  related_items: RelatedItem[];
};
