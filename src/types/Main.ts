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
  date: string;
  platform: string;
}

export interface TrendKeywordItem {
  rank: number;
  isNew: boolean;
  change: number;
  keyword: string;
}

export interface TrendKeywordResponse {
  items: TrendKeywordItem[];
  sourceName: string;
  sourceUpdatedAt: string | null;
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

// 트렌드 지수 고도화 — 랭킹은 /trend, 상품 스냅샷 상세는 /trend/{tempItemId}를
// 쓴다. 기존 GetTrendIndex와는 별개의 데이터 소스라 필드 구성이 다르다.
export type TrendRankingItem = {
  position: number;
  temp_item_id: number;
  product_name: string;
  brand: string;
  thumbnail: string;
  rank: number;
  rank_change: number | null;
  trend_score: number;
  band: string;
};

export type TrendRankingPageResponse = {
  content: TrendRankingItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type GetTrendRankingParams = {
  platform: string;
  category: string;
  // 없으면 백엔드가 가장 최신 점수값을 준다.
  date?: string;
  page?: number;
  size?: number;
  // 현재는 "남성"만 값이 있고 그 외(여성 등)는 전부 null이라, 남성 데이터가
  // 필요할 때만 "남성"을 넘긴다.
  gender?: string;
};

export type TrendSnapshotDetailDto = {
  temp_item_id: number;
  product_name: string;
  // true면 오늘 스냅샷이 없어 과거 스냅샷을 대신 보여주는 것 — UI에서 분기 처리.
  referenced_snapshot: boolean;
  brand: string;
  platform: string;
  category: string;
  date_asof: string;
  thumbnail: string;
  product_detail_url: string;
  integrated_index: {
    score: number | null;
    band: string;
    score_basis: string;
    confidence: number | null;
    insight: string | null;
  };
  brand_index: {
    awareness_pct: number | null;
    awareness_label: string | null;
    store_likes: number | null;
    search_volume: number | null;
  };
  product_index: {
    interest_pct: number | null;
    interest_label: string | null;
    like_count: number | null;
    like_prev: number | null;
    like_change_pct: number | null;
  };
  purchase_power_index: {
    purchase_pct: number | null;
    purchase_label: string | null;
    rank: number | null;
    rank_prev: number | null;
    rank_change: number | null;
    review_count: number | null;
    review_change_pct: number | null;
    reorder: number | null;
    reorder_change_pct: number | null;
  };
  signal_meta: {
    streak_days: number | null;
    days_observed: number | null;
    gap_days: number | null;
    is_new: boolean;
    signal_coverage: string | null;
    delta_mode: string | null;
    matched_variants: number | null;
    cohort_ratio: number | null;
    demand_pressure: number | null;
    soldout_variants: number | null;
  };
};
