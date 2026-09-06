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

// 트렌드 지수 고도화 — 랭킹은 /trend/{tempItemId}, 상품 상세페이지는
// /trendIndex/{itemCode}를 쓰는데 둘 다 이 형식으로 통일되어 있다.
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

// 상품 단위 데이터가 얼마나 쌓였는지에 따른 3단계 성숙도.
// measured(자체 실측) → similar(유사상품 추정) → market(카테고리 시장 흐름만).
export type DataStage = "measured" | "similar" | "market";

export type TrendSnapshotDetailDto = {
  id: number;
  temp_item_id: number;
  // 정식 상품 카탈로그에 연결돼 있으면 그 itemcode, 아니면 null(랭킹 전용
  // 임시 상품). null이면 GetDetailInfo/GetProductByItemCode 같은 itemcode
  // 기반 조회를 쓸 수 없다.
  itemcode: string | null;
  product_name: string;
  // true면 오늘 스냅샷이 없어 과거 스냅샷을 대신 보여주는 것 — UI에서 분기 처리.
  referenced_snapshot: boolean;
  brand: string;
  platform: string;
  category: string;
  date_asof: string;
  thumbnail: string;
  product_detail_url: string;
  data_stage: DataStage;
  integrated_index: {
    basis: DataStage;
    score: number | null;
    score_change_pct: number | null;
    band: string;
    score_basis: string;
    confidence: number | null;
    reorder_count: number | null;
    insight: string | null;
  };
  brand_index: {
    // 스토어찜·네이버 검색량이 브랜드 단위라 상품 이력과 무관하게 나온다 —
    // 둘 다 없을 때만 "none".
    basis: "measured" | "none";
    awareness_pct: number | null;
    awareness_label: string | null;
    store_likes: number | null;
    store_likes_prev: number | null;
    search_volume: number | null;
  };
  product_index: {
    basis: DataStage;
    interest_pct: number | null;
    interest_label: string | null;
    like_count: number | null;
    like_prev: number | null;
    like_change_pct: number | null;
  };
  purchase_power_index: {
    basis: DataStage;
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
  // VLM 미분석 상품이면 null — 이 경우 상세 속성뿐 아니라 가격·평점·판매
  // 지표(regular_price 이하)도 전부 같이 비어있다.
  vlm: {
    ai_description: string | null;
    material: string | null;
    length: string | null;
    sleeve: string | null;
    fit: string | null;
    neckline: string | null;
    pattern: string | null;
    detail_category: string | null;
    color: string | null;
    regular_price: number | null;
    current_price: number | null;
    discount_rate: number | null;
    rating: number | null;
    review_count: number | null;
    // 무신사만 값이 있고 29cm·W컨셉은 항상 null(크롤 원본에 없음).
    sales: number | null;
    views: number | null;
    gender: string | null;
  } | null;
  // basis="similar"인 카드(아이템 관심도/구매 화력도)가 공통으로 쓰는 유사상품
  // 추정치 — 카드별 필드가 아니라 스냅샷 최상위에 하나만 있다.
  similar_estimate: {
    // "유사상품 N개 평균 분포 기준" 문구에 쓰는 표본 수.
    similar_count: number | null;
    // 추정 신뢰도 계수 — 내부용, 현재 UI에 노출하지 않는다.
    confidence: number | null;
    like: {
      // now/baseline은 유사상품이 아니라 "이 상품" 값이다(product_index의
      // like_count/like_prev와 동일) — cohort_avg만 유사상품 쪽 참조값.
      now: number | null;
      baseline: number | null;
      baseline_lag_days: number | null;
      // 유사상품들의 평균 찜 수 — now/baseline 막대와 절대 섞지 않는다.
      cohort_avg: number | null;
    } | null;
    // "유사상품 판매량 {lo}~{hi}" — 구매 화력도 근거 칩.
    weekly_sales: { lo: number; hi: number } | null;
    weekly_review: { lo: number; hi: number } | null;
    reorder_avg: number | null;
  } | null;
  // 아이템 관심도 basis="market"일 때만.
  item_interest_market: {
    // 이 상품이 (플랫폼,카테고리) 안에서 찜 기준 상위 몇 %인지 — 0=최상위,
    // 100=최하위(PercentileSlider와 동일한 방향).
    interest_pct: number | null;
    interest_label: string | null;
    like_count: number | null;
    // 카테고리 이번주 평균 찜 수 — like_count보다 클 수 있다(정상, 인기
    // 상품이 섞여 있어서). 비교 막대 용도로만 쓴다.
    category_avg_like: number | null;
    category_momentum_pct: number | null;
    category_momentum: "up" | "flat" | "down" | null;
    // 하위 필드는 전부 nullable이지만 insight만은 항상 non-null.
    insight: string;
  } | null;
  // 구매 화력도 basis="market"일 때만.
  purchase_power_market: {
    category_interest_change_pct: number | null;
    avg_review_weekly: number | null;
    similar_weekly_sales: { lo: number; hi: number } | null;
    own_sales_status: "collecting" | null;
  } | null;
};

// 트렌드 지수 고도화 — 랭킹 상품 상세(/trend/{id})의 "유사 상품" 섹션.
// GET /trend/{id}/similar 로 별도 조회하며, 유사도(score) 내림차순으로 이미
// 정렬돼 있고 자기 자신은 빠져있다. 빈 배열이면 아직 VLM 분석 전이라 섹션
// 자체를 숨긴다.
export type TrendSimilarItemDto = {
  // "RANKING": 다른 랭킹 상품 → 클릭 시 /trend/{trend_id} 스냅샷
  // "PRODUCT": 정식 상품 카탈로그 → 클릭 시 /product/{item_code} 상세
  source: "RANKING" | "PRODUCT";
  // source="RANKING"일 때만 값이 있다.
  trend_id: number | null;
  // source="PRODUCT"일 때만 값이 있다.
  item_code: string | null;
  brand: string;
  product_name: string;
  // null 가능 → placeholder 처리.
  thumbnail: string | null;
  // 코사인 유사도 0~1(bge-m3). 현재 UI에는 노출하지 않는다.
  score: number;
};
