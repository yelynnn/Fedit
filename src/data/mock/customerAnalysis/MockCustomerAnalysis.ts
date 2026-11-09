// 고객 분석 목업 — 개발 서버에서 ?mock·Pro 미만 ?simulatePlan= 일 때만 쓴다(CustomerAnalysisAPI.ts의 isMock).
// customerAnalysisPoc.json은 PoC(무신사 리뷰 수집, 2026-11-01 기준)에서 뽑은 데이터를
// 줄인 사본이다(닉네임 없음, 많이 산 상품 TOP 이미지는 무신사 125px 썸네일). 여기서 API 응답 모양으로 바꿔 돌려준다.
import poc from "./customerAnalysisPoc.json";
import { getSimulatedSubscription } from "@/stores/SubscriptionStore";
import type {
  AnalysisRequest,
  AnalysisRequestsResponse,
  CustomerBrand,
  CustomerBrandsResponse,
  CustomerCategory,
  CustomerCross,
  CustomerGenderFilter,
  CustomerPeriod,
  CustomerPlatformFilter,
  CustomerReviewsParams,
  CustomerReviewsResponse,
  CustomerSummary,
  SurveyRow,
} from "@/types/CustomerAnalysis";

type PocCat = {
  self: number;
  brands: { brand: string; n: number }[];
  kinds: { kind: string; n: number; kw: string[] }[];
  top: { brand: string; name: string; n: number; img?: string | null }[];
};
type PocBrand = {
  reviews: number;
  raw_reviews: number;
  reviewers: number;
  recent14: number;
  avg: number;
  neg_rate: number;
  dist: Record<string, number>;
  neg: number;
  sex_public: number;
  male: number;
  height_median: number | null;
  weight_median: number | null;
  rep_brand: number;
  rep_same: number;
  rep_color: number;
  cross_any: number;
  cross_pct: number;
  kw_pos: Record<string, number>;
  kw_neg: Record<string, number>;
  survey: Record<string, SurveyRow[]>;
  list: {
    prod: string;
    grade: number;
    opt: string;
    h: number | null;
    w: number | null;
    likes: number;
    body: string;
    date: string;
    img?: string | null;
  }[];
  by_g: Record<string, { reviewers: number; cross: number; cats: Record<string, PocCat> }>;
  major: string;
};
// "브랜드|상품명" → 무신사 상품 정보(review.review_product·crawled_product에서 찾은 것, 못 찾은 상품은 없음)
type PocProduct = { goods: string; kind: string | null; img: string | null; price: number | null };
type Poc = {
  asof: string;
  brands: string[];
  periods: Record<string, Record<string, PocBrand>>;
  products?: Record<string, PocProduct>;
  /** "브랜드|카테고리" → 12개월·전체 성별 기준 실제 상위 구매 브랜드(운영 DB에서 뽑음, 2026-11-02) */
  crossBrands?: Record<string, { brand: string; n: number }[]>;
};

const data = poc as unknown as Poc;

// 화면 순서(브라운야드 먼저) — 목업 고객은 자사 브랜드가 없다
const MOCK_BRAND_ORDER = ["브라운야드", "벨리에", "셔터", "해칭룸", "루에브르"];

const delay = <T,>(value: T, ms = 250) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const getBrand = (brandId: string, period: CustomerPeriod, platform: CustomerPlatformFilter) => {
  if (platform === "29cm" || platform === "wconcept") {
    throw new Error("이 플랫폼 리뷰는 아직 수집하지 않았어요.");
  }
  const b = data.periods[String(period || 12)]?.[brandId];
  if (!b) throw new Error("브랜드 데이터를 찾지 못했어요.");
  return b;
};

const hasData = (name: string) => data.brands.includes(name);

// 목업은 PoC 5개 브랜드만 수집돼 있다. 그 밖의 브랜드는 무신사 입점·수집 전으로 돌려준다
// (화면은 "리뷰를 수집하는 중" 안내를 보여준다). brandId는 브랜드명 그대로 쓴다.
const toMockBrand = (name: string): CustomerBrand => ({
  brandId: name,
  name,
  isOwn: false,
  platforms: [
    { platform: "musinsa", listed: true, collected: hasData(name) },
    { platform: "29cm", listed: false, collected: false },
    { platform: "wconcept", listed: false, collected: false },
  ],
});

// 개발 화면에서 주소에 ?mockEmpty 를 붙이면 기본 묶음을 비워 처음 화면(브랜드 선택 안내)을 볼 수 있다
const mockEmptyDefault = () => new URLSearchParams(window.location.search).has("mockEmpty");

// ?mockDemo 를 붙이거나 ?simulatePlan= 이 Pro 미만(none·expired·trial·basic)이면
// Pro 미만 고객의 예시 화면(서버가 정한 묶음, demo=true)을 본다
const mockDemo = () =>
  new URLSearchParams(window.location.search).has("mockDemo") ||
  ((sim) => !!sim && (sim.status !== "active" || !["pro", "enterprise"].includes(sim.plan)))(getSimulatedSubscription());

export const mockBrands = (names?: string[]): Promise<CustomerBrandsResponse> => {
  if (mockDemo()) return delay({ brands: MOCK_BRAND_ORDER.filter(hasData).map(toMockBrand), demo: true });
  const list = names ?? (mockEmptyDefault() ? [] : MOCK_BRAND_ORDER.filter(hasData));
  return delay({ brands: [...new Set(list)].map(toMockBrand) });
};

// 목업의 "분석 가능 브랜드" — PoC 5개 브랜드(리뷰 많은 순)에, 개발 화면에서 창이 비지 않게
// 실제로 리뷰를 수집 중인 무신사 브랜드 몇 개를 더한다(이 브랜드들은 목업에선 "수집 중"으로 보인다).
const MOCK_EXTRA_AVAILABLE = ["무신사 스탠다드 우먼", "드로우핏", "스파오", "에스피오나지", "마뗑킴"];

export const mockAvailableBrands = (): Promise<{ names: string[] }> => {
  const byReviews = [...data.brands].sort(
    (a, c) => (data.periods["12"]?.[c]?.reviews ?? 0) - (data.periods["12"]?.[a]?.reviews ?? 0),
  );
  return delay({ names: [...byReviews, ...MOCK_EXTRA_AVAILABLE] });
};

export const mockSummary = async (
  brandId: string,
  {
    period,
    platform,
  }: { period: CustomerPeriod; platform: CustomerPlatformFilter },
): Promise<CustomerSummary> => {
  const b = getBrand(brandId, period, platform);
  const toList = (o: Record<string, number>) =>
    Object.entries(o).map(([name, count]) => ({ name, count }));
  return delay({
    asOf: data.asof,
    reviews: b.reviews,
    rawReviews: b.raw_reviews,
    recent14: b.recent14,
    avg: b.avg,
    negRate: b.neg_rate,
    dist: {
      "5": b.dist["5"] ?? 0,
      "4": b.dist["4"] ?? 0,
      "3": b.dist["3"] ?? 0,
      "2": b.dist["2"] ?? 0,
      "1": b.dist["1"] ?? 0,
    },
    neg: b.neg,
    sexPublic: b.sex_public,
    male: b.male,
    heightMedian: b.height_median,
    weightMedian: b.weight_median,
    repBrand: b.rep_brand,
    repSame: b.rep_same,
    repColor: b.rep_color,
    reviewers: b.reviewers,
    // PoC는 5개 브랜드만 모아서, "다른 모든 브랜드"가 나머지 4개 브랜드다
    crossAny: b.cross_any,
    crossPct: b.cross_pct,
    platformCounts: { musinsa: b.reviews },
    keywords: toList(b.kw_pos),
    complaints: toList(b.kw_neg)
      .sort((a, c) => c.count - a.count)
      .slice(0, 3),
    survey: b.survey,
  });
};

export const mockReviews = async (
  brandId: string,
  { period, platform, filter, sort, product, page, size }: CustomerReviewsParams,
): Promise<CustomerReviewsResponse> => {
  const b = getBrand(brandId, period, platform);
  const products = [...new Set(b.list.map((r) => r.prod))];
  const rows = b.list
    .filter((r) => (filter === "neg" ? r.grade <= 3 : true))
    .filter((r) => (product ? r.prod === product : true))
    .sort((a, c) =>
      sort === "like" ? c.likes - a.likes || c.date.localeCompare(a.date) : c.date.localeCompare(a.date),
    );
  return delay({
    total: rows.length,
    products,
    items: rows.slice(page * size, page * size + size).map((r) => ({
      product: r.prod,
      productImage: r.img ?? null,
      grade: r.grade,
      option: r.opt || null,
      height: r.h,
      weight: r.w,
      likes: r.likes,
      body: r.body,
      date: r.date,
    })),
  });
};

// 상위 5개 + 묶음 브랜드(include, 목업은 brandId가 브랜드명) 중 상위에 없는 것(0명도) — 서버와 같은 규칙
const mockBrandRows = (brands: { brand: string; n: number }[], include: string[]) => {
  const pin = new Set(include);
  const top = brands
    .filter((x) => x.n > 0)
    .sort((a, c) => c.n - a.n)
    .slice(0, 5)
    .map((x) => ({ ...x, pinned: pin.has(x.brand) }));
  const shown = new Set(top.map((x) => x.brand));
  const extra = [...pin]
    .filter((name) => !shown.has(name))
    .map((name) => ({ brand: name, n: brands.find((x) => x.brand === name)?.n ?? 0, pinned: true }));
  return [...top, ...extra];
};

// 개발 화면용 리뷰 분석 신청 — 새로고침하면 사라진다
const mockRequests: AnalysisRequest[] = [];

export const mockPostAnalysisRequest = (brand: string): Promise<AnalysisRequest> => {
  const name = brand.trim();
  const found = mockRequests.find((r) => r.brand.toLowerCase() === name.toLowerCase());
  if (found) return delay(found);
  const row = { brand: name, status: "requested", createdAt: new Date().toISOString() };
  mockRequests.unshift(row);
  return delay(row, 500);
};

export const mockAnalysisRequests = (): Promise<AnalysisRequestsResponse> =>
  delay({ requests: [...mockRequests] });

export const mockCross = async (
  brandId: string,
  {
    period,
    platform,
    gender,
    category,
    include,
  }: {
    period: CustomerPeriod;
    platform: CustomerPlatformFilter;
    gender: CustomerGenderFilter;
    category: CustomerCategory;
    include: string[];
  },
): Promise<CustomerCross> => {
  const b = getBrand(brandId, period, platform);
  const g = b.by_g[gender] ?? b.by_g.all;
  const cat: PocCat = g.cats[category] ?? { self: 0, brands: [], kinds: [], top: [] };
  // PoC 내보내기는 PoC 5개 브랜드끼리라 다른 브랜드가 4개뿐이다 — 구매 브랜드는 운영 DB에서 뽑은
  // 실제 상위 브랜드(12개월·전체 성별, 기간·성별과 무관하게 같은 값)를 쓰고, 없으면 PoC 값을 쓴다.
  const realBrands = data.crossBrands?.[`${brandId}|${category}`];
  return delay({
    platform: "musinsa",
    majorGender: b.major === "남성" ? "남성" : "여성",
    genders: {
      all: b.by_g.all?.reviewers ?? 0,
      여성: b.by_g["여성"]?.reviewers ?? 0,
      남성: b.by_g["남성"]?.reviewers ?? 0,
    },
    reviewers: g.reviewers,
    cross: g.cross,
    self: cat.self,
    brands: mockBrandRows(realBrands ?? cat.brands, include),
    kinds: cat.kinds.map((k) => ({ kind: k.kind, n: k.n, keywords: k.kw })),
    top: cat.top.slice(0, 6).map(({ img, ...t }) => {
      const p = data.products?.[`${t.brand}|${t.name}`];
      return {
        ...t,
        productImage: p?.img ?? img ?? null,
        kind: p?.kind ?? "",
        price: p?.price ?? null,
        url: p ? `https://www.musinsa.com/products/${p.goods}` : null,
      };
    }),
  });
};
