import { axiosInstance } from "./AxiosInstance";
import type {
  AnalysisRequest,
  AnalysisRequestsResponse,
  CustomerAvailableBrandsResponse,
  CustomerBrandsResponse,
  CustomerCategory,
  CustomerCross,
  CustomerGenderFilter,
  CustomerPeriod,
  CustomerPlatformFilter,
  CustomerReviewsParams,
  CustomerReviewsResponse,
  CustomerSummary,
} from "@/types/CustomerAnalysis";

/*
 * 고객 분석(리뷰 기반) API — 백엔드 계약
 * ─────────────────────────────────────────────────────────────────────────────
 * 모두 GET, 다른 API와 같은 인증(Authorization: Bearer accessToken).
 * 미공개 기간에는 /auth/me 의 betaPaths 에 "/customer-analysis" 를 넣어 두면
 * 관리자가 아닌 계정에선 메뉴가 숨는다(src/lib/features.ts).
 * 리뷰 고객의 닉네임 등 개인 식별 정보는 응답에 넣지 않는다.
 *
 * 분석 브랜드 묶음(화면의 브랜드 칩) — 처음엔 1)의 기본 묶음(이번 달 관심 브랜드 픽)이고,
 * 고객이 "+ 브랜드"로 더하거나 ×로 뺄 수 있다(브라우저에 고객별로 저장).
 * 칩을 누르면 그 브랜드가 기준 브랜드가 된다. 교차 구매·교차구매 포착 고객은 묶음과 무관하게
 * 같은 플랫폼의 다른 모든 브랜드를 기준으로 서버가 센다(예전 compare 파라미터는 보내지 않는다).
 *
 * 1) GET /customer-analysis/brands
 *    기본 묶음 — 이번 달 고객이 고른 브랜드(관심 브랜드 픽)와 플랫폼별 입점·수집 여부.
 *    → { brands: [{ brandId, name, isOwn, platforms: [{ platform: 'musinsa'|'29cm'|'wconcept', listed, collected }] }] }
 *      isOwn: 고객의 자사 브랜드(최대 1개, 없을 수 있음)
 *      listed=false → 미입점, listed=true·collected=false → 준비 중
 *      어느 플랫폼에서도 collected=true가 아니면 화면은 "리뷰를 수집하는 중" 안내만 보여준다.
 *
 * 1-1) GET /customer-analysis/brands?names=<브랜드명,브랜드명,…>
 *    같은 응답 모양으로, 이름을 준 브랜드들만(준 순서대로) 돌려준다 — 고객이 추가한 브랜드와
 *    저장해 둔 묶음을 다시 불러올 때 쓴다. 브랜드 선택 화면(관심 브랜드·브랜드 필터)이 이름으로
 *    다루기 때문에 이름으로 받는다. 없는 브랜드는 빼고 돌려준다.
 *    요금제 범위 밖 브랜드(Basic·Pro의 관심 브랜드가 아닌 것)는 서버에서 빼거나 403으로 막는다.
 *    입점은 했지만 아직 수집하지 않은 브랜드는 collected=false로 주고, 수집을 예약해 다음 날
 *    오전까지 반영한다(화면 문구: "내일 오전까지 반영돼요").
 *
 * 1-2) GET /customer-analysis/brands/available
 *    → { names: string[] }  리뷰 분석이 가능한 브랜드 이름, 최근 12개월 리뷰 많은 순.
 *      무신사·29CM·W컨셉 중 수집 대상(collected=true와 같은 기준)이고 최근 12개월 리뷰가 있는 브랜드.
 *      Basic·Pro는 관심 브랜드 중 분석 가능한 것만, Enterprise·관리자는 전체.
 *      "+ 브랜드" 창은 이 목록 안의 브랜드만 보여준다(리뷰 없는 브랜드는 골라도 볼 게 없다).
 *
 * 2) GET /customer-analysis/{brandId}/summary?period=3|6|12&platform=all|musinsa|29cm|wconcept
 *    → { asOf, reviews, rawReviews, recent14, avg, negRate, dist: {5,4,3,2,1}, neg,
 *        sexPublic, male, heightMedian, weightMedian, repBrand, repSame, repColor,
 *        reviewers, crossAny, crossPct, platformCounts: { musinsa?, '29cm'?, wconcept? },
 *        keywords: [{ name, count }], complaints: [{ name, count }],
 *        survey: { 상의|바지|아우터: [{ attr, top, pct, n }] } }
 *      reviews: 중복 제거한 리뷰 수, rawReviews: 제거 전, recent14: 최근 14일 리뷰 수
 *      negRate·sexPublic·male·crossPct·pct: 0~100(%), male은 성별 공개 리뷰어 중 남성 비율
 *      neg: 3점 이하 리뷰 수, dist: 점수별 리뷰 수
 *      repBrand: 서로 다른 주문 2건 이상 리뷰어 수, repSame: 같은 상품 재구매, repColor: 다른 색상 추가 구매
 *      crossAny: 같은 플랫폼의 다른 브랜드 어디서든 리뷰가 확인된 리뷰어 수(플랫폼마다 따로 맞춰 더한다)
 *      keywords: 6개 주제(사이즈·핏·디자인·소재·색감·착용감), complaints: 자주 나온 불만 상위 3개
 *
 * 3) GET /customer-analysis/{brandId}/reviews?period&platform&filter=all|neg&sort=new|like&product=&page=&size=
 *    → { total, products: string[], items: [{ product, productImage, grade, option, height, weight, likes, body, date }] }
 *      page는 0부터, products: 상품 필터 드롭다운용 상품명 목록, date: YYYY-MM-DD
 *
 * 4) GET /customer-analysis/{brandId}/cross?period&platform&gender=all|여성|남성&category=상의|바지|아우터&include=<brandId,…>
 *    → { platform, majorGender, genders: { all, 여성, 남성 }, reviewers, cross, self,
 *        brands: [{ brand, n, pinned }], kinds: [{ kind, n, keywords: string[] }],
 *        top: [{ brand, name, n, productImage, kind, price, url }] }
 *      교차 구매는 같은 플랫폼 안에서만 계산한다. platform=all이면 서버가 기준 플랫폼(현재 무신사)을 골라 platform에 담는다.
 *      기준 브랜드 리뷰어가 그 플랫폼의 다른 모든 브랜드(묶음과 무관)에서 산 기록을 센다.
 *      genders: 성별별 리뷰어 수, reviewers: 선택 성별 리뷰어 수, cross: 그중 다른 브랜드 구매가 잡힌 사람 수
 *      self: 그중 기준 브랜드의 해당 카테고리를 산 사람 수(화면 막대 맨 아래 보라색)
 *      brands: 해당 카테고리를 산 사람이 많은 다른 브랜드 상위 5개(n 큰 순) + 6~10위 중 기준 고객의 1% 이상·10명 이상인 것,
 *              그 뒤에 include(화면 묶음에서 기준 브랜드를
 *              뺀 brandId, 쉼표로 구분) 중 상위 5개에 없는 브랜드를 보낸 순서대로(0명이면 "0% · 미포착").
 *              pinned=true: include로 보낸 브랜드(상위 5개 안에 있어도 표시). 화면은 이 순서 뒤에 기준 브랜드(보라)
 *      kinds: 카테고리 세부 종류별 구매자 수 + 상품명에 많이 나온 특징(최대 5개)
 *      top: 많이 산 상품 최대 6개. kind: 세부 종류, price: 원(모르면 null), url: 플랫폼 상품 페이지(새 탭)
 *      다른 브랜드는 요금제 범위 밖일 수 있다(이름·인원·상품만 보여 준다)
 *
 * 5) 리뷰 분석 신청 — 아직 리뷰를 분석할 수 없는 브랜드의 수집·분석을 신청한다(입점 신청 /menu/apply와 별개)
 *    POST /customer-analysis/requests  body { brand }  → { brand, status, createdAt }
 *      같은 브랜드(대소문자 무시)를 다시 신청하면 기존 신청을 그대로 돌려준다. 무료 요금제는 403.
 *    GET  /customer-analysis/requests  → { requests: [{ brand, status, createdAt }] }  최근 순, "신청함" 표시용
 * ─────────────────────────────────────────────────────────────────────────────
 */

// 백엔드가 준비되기 전까지 로컬 목업(PoC 데이터)으로 응답한다.
// false로 바꾸면 실제 서버를 부르고, 목업 파일은 번들에 들어가지 않는다(동적 import).
// 개발 서버(pnpm dev)에서만 목업을 쓴다. 배포 빌드는 항상 실제 API를 부른다.
const USE_MOCK = import.meta.env.DEV;

const loadMock = () => import("@/data/mock/customerAnalysis/MockCustomerAnalysis");

const toError = (error: any, fallback: string) =>
  new Error(error?.response?.data?.message || (error?.response ? fallback : "서버에 연결할 수 없습니다."));

// names를 주면 그 브랜드들만(1-1), 안 주면 기본 묶음(1)
const GetCustomerBrands = async (names?: string[]): Promise<CustomerBrandsResponse> => {
  if (USE_MOCK) return (await loadMock()).mockBrands(names);
  try {
    const res = await axiosInstance.get<CustomerBrandsResponse>("/customer-analysis/brands", {
      params: names ? { names: names.join(",") } : undefined,
    });
    return res.data;
  } catch (error: any) {
    throw toError(error, "브랜드 목록을 불러오지 못했습니다.");
  }
};

// "+ 브랜드" 창에서 고를 수 있는(리뷰 분석이 가능한) 브랜드 이름
const GetCustomerAvailableBrands = async (): Promise<CustomerAvailableBrandsResponse> => {
  if (USE_MOCK) return (await loadMock()).mockAvailableBrands();
  try {
    const res = await axiosInstance.get<CustomerAvailableBrandsResponse>("/customer-analysis/brands/available");
    return res.data;
  } catch (error: any) {
    throw toError(error, "분석 가능한 브랜드를 불러오지 못했습니다.");
  }
};

// 리뷰 분석 신청 — 같은 브랜드를 다시 보내도 한 건만 남는다
const PostAnalysisRequest = async (brand: string): Promise<AnalysisRequest> => {
  if (USE_MOCK) return (await loadMock()).mockPostAnalysisRequest(brand);
  try {
    const res = await axiosInstance.post<AnalysisRequest>("/customer-analysis/requests", { brand });
    return res.data;
  } catch (error: any) {
    throw toError(error, "리뷰 분석을 신청하지 못했습니다.");
  }
};

const GetAnalysisRequests = async (): Promise<AnalysisRequestsResponse> => {
  if (USE_MOCK) return (await loadMock()).mockAnalysisRequests();
  try {
    const res = await axiosInstance.get<AnalysisRequestsResponse>("/customer-analysis/requests");
    return res.data;
  } catch (error: any) {
    throw toError(error, "리뷰 분석 신청 내역을 불러오지 못했습니다.");
  }
};

const GetCustomerSummary = async (
  brandId: string,
  params: { period: CustomerPeriod; platform: CustomerPlatformFilter },
): Promise<CustomerSummary> => {
  if (USE_MOCK) return (await loadMock()).mockSummary(brandId, params);
  try {
    const res = await axiosInstance.get<CustomerSummary>(
      `/customer-analysis/${encodeURIComponent(brandId)}/summary`,
      { params },
    );
    return res.data;
  } catch (error: any) {
    throw toError(error, "고객 분석을 불러오지 못했습니다.");
  }
};

const GetCustomerReviews = async (
  brandId: string,
  params: CustomerReviewsParams,
): Promise<CustomerReviewsResponse> => {
  if (USE_MOCK) return (await loadMock()).mockReviews(brandId, params);
  try {
    const res = await axiosInstance.get<CustomerReviewsResponse>(
      `/customer-analysis/${encodeURIComponent(brandId)}/reviews`,
      { params: { ...params, product: params.product || undefined } },
    );
    return res.data;
  } catch (error: any) {
    throw toError(error, "리뷰를 불러오지 못했습니다.");
  }
};

const GetCustomerCross = async (
  brandId: string,
  params: {
    period: CustomerPeriod;
    platform: CustomerPlatformFilter;
    gender: CustomerGenderFilter;
    category: CustomerCategory;
    /** 화면 묶음에서 기준 브랜드를 뺀 brandId — 상위 5개에 없으면 그 뒤에 붙는다 */
    include: string[];
  },
): Promise<CustomerCross> => {
  if (USE_MOCK) return (await loadMock()).mockCross(brandId, params);
  try {
    const res = await axiosInstance.get<CustomerCross>(
      `/customer-analysis/${encodeURIComponent(brandId)}/cross`,
      { params: { ...params, include: params.include.length ? params.include.join(",") : undefined } },
    );
    return res.data;
  } catch (error: any) {
    throw toError(error, "교차 구매를 불러오지 못했습니다.");
  }
};

export { GetCustomerBrands, GetCustomerAvailableBrands, PostAnalysisRequest, GetAnalysisRequests, GetCustomerSummary, GetCustomerReviews, GetCustomerCross };
