// 고객 분석(리뷰 기반) 화면 타입 — 백엔드 계약은 src/apis/CustomerAnalysisAPI.ts 맨 위 주석 참고

/** 교차 구매까지 보는 플랫폼 + SSF샵·자사몰(own:브랜드) — 뒤의 둘은 그 브랜드 리뷰만 모아 교차 구매가 없다 */
export type CustomerPlatform = "musinsa" | "29cm" | "wconcept" | "ssfshop" | `own:${string}`;
/** 플랫폼 선택값 — all = 전체 플랫폼 */
export type CustomerPlatformFilter = "all" | CustomerPlatform;
export type CustomerPeriod = 3 | 6 | 12;
export type CustomerGender = "여성" | "남성";
export type CustomerGenderFilter = "all" | CustomerGender;
export type CustomerCategory = "상의" | "바지" | "아우터";
export type ReviewFilter = "all" | "neg";
export type ReviewSort = "new" | "like";

export type CustomerBrandPlatform = {
  platform: CustomerPlatform;
  /** 그 플랫폼에 입점해 있는지 */
  listed: boolean;
  /** 입점해 있고 리뷰를 수집하고 있는지 */
  collected: boolean;
};

export type CustomerBrand = {
  brandId: string;
  name: string;
  /** 고객의 자사 브랜드 여부(없을 수 있음) */
  isOwn: boolean;
  platforms: CustomerBrandPlatform[];
};

export type CustomerBrandsResponse = {
  brands: CustomerBrand[];
  /** true → Pro 미만 고객용 예시 묶음(서버가 정한 브랜드, 고객이 바꿀 수 없음) */
  demo?: boolean;
};

/** 리뷰 분석 신청 — status: requested / collecting / done / rejected */
export type AnalysisRequest = { brand: string; status: string; createdAt: string | null };
export type AnalysisRequestsResponse = { requests: AnalysisRequest[] };

/** 리뷰 분석이 가능한 브랜드 이름(리뷰 많은 순) — 브랜드 선택 창에서 이 브랜드만 보여준다 */
export type CustomerAvailableBrandsResponse = {
  names: string[];
};

export type NamedCount = { name: string; count: number };

export type SurveyRow = {
  /** 속성(사이즈·색감·신축성 …) */
  attr: string;
  /** 가장 많이 고른 답(정사이즈 …) */
  top: string;
  /** top을 고른 비율(%) */
  pct: number;
  /** 응답 수 */
  n: number;
};

export type CustomerSummary = {
  asOf: string;
  reviews: number;
  rawReviews: number;
  recent14: number;
  avg: number;
  /** 불만 리뷰(3점 이하) 비율(%) */
  negRate: number;
  dist: Record<"5" | "4" | "3" | "2" | "1", number>;
  neg: number;
  /** 성별 공개 비율(%) */
  sexPublic: number;
  /** 성별 공개 리뷰어 중 남성 비율(%) */
  male: number;
  heightMedian: number | null;
  weightMedian: number | null;
  /** 서로 다른 주문 2건 이상 리뷰어 수 */
  repBrand: number;
  repSame: number;
  repColor: number;
  reviewers: number;
  crossAny: number;
  crossPct: number;
  platformCounts: Partial<Record<CustomerPlatform, number>>;
  keywords: NamedCount[];
  complaints: NamedCount[];
  survey: Partial<Record<CustomerCategory, SurveyRow[]>>;
};

export type CustomerReview = {
  product: string;
  productImage: string | null;
  grade: number;
  option: string | null;
  height: number | null;
  weight: number | null;
  likes: number;
  body: string;
  date: string;
};

export type CustomerReviewsResponse = {
  total: number;
  products: string[];
  items: CustomerReview[];
};

export type CustomerReviewsParams = {
  period: CustomerPeriod;
  platform: CustomerPlatformFilter;
  filter: ReviewFilter;
  sort: ReviewSort;
  product?: string;
  page: number;
  size: number;
};

/**
 * 기준 브랜드 리뷰어가 그 카테고리를 많이 산 다른 브랜드(플랫폼 전체 기준) 상위 5개(+ 1% 이상·10명 이상이면 10위까지), 그 뒤에 묶음 브랜드(include)
 * 중 상위 5개에 없는 것(0명도). pinned: 묶음 브랜드(include로 보낸 브랜드)인지
 */
export type CrossBrandRow = { brand: string; n: number; pinned: boolean };
export type CrossKindRow = { kind: string; n: number; keywords: string[] };
export type CrossTopRow = {
  brand: string;
  name: string;
  n: number;
  productImage?: string | null;
  /** 세부 종류(니트/스웨터 …) */
  kind: string;
  /** 판매가(원), 모르면 null */
  price: number | null;
  /** 플랫폼 상품 페이지, 없으면 null */
  url: string | null;
};

export type CustomerCross = {
  /** 교차 구매를 계산한 플랫폼(같은 플랫폼 안에서만 계산) */
  platform: CustomerPlatform;
  majorGender: CustomerGender;
  genders: Record<CustomerGenderFilter, number>;
  /** 선택한 성별의 리뷰어 수 */
  reviewers: number;
  /** 그중 같은 플랫폼 다른 브랜드에서도 리뷰가 확인된 사람 수 */
  cross: number;
  /** 그중 기준 브랜드의 이 카테고리를 산 사람 수 */
  self: number;
  brands: CrossBrandRow[];
  kinds: CrossKindRow[];
  top: CrossTopRow[];
};
