// 계정별 맞춤 리포트(시즌 기획 리포트 등) — 담당자가 만들어 계정에 넣고, 고객 분석 탭의 리포트 창에서 문서처럼 보여 준다.
// 1차는 프론트 데이터(src/data/reports)로 보여 주고, 이후 백엔드(고객별 리포트 테이블)에서 같은 모양으로 받는다.

/** 누적 막대 한 칸 — name 이 없으면 비중(%)만 쓴다 */
export type ReportSegment = { name?: string; pct: number; hex?: string; highlight?: "a" | "b" };

export type ReportStackRow = { label: string; own?: boolean; sub?: string; segments: ReportSegment[] };

/** 막대 한 줄 — brand·img·url 이 있으면 상품 줄(브랜드 작은 글씨 + 썸네일 + 상품 링크)로 그린다 */
export type ReportBarRow = {
  label: string;
  value: number;
  display: string;
  hex?: string;
  own?: boolean;
  brand?: string;
  img?: string;
  url?: string;
};

export type ReportSection =
  | { kind: "stack"; id: string; eyebrow: string; title: string; desc?: string; legend?: { label: string; hex: string }[]; rows: ReportStackRow[]; note?: string }
  | { kind: "bars"; id: string; eyebrow: string; title: string; desc?: string; rows: ReportBarRow[]; swatches?: boolean; muted?: boolean }
  | {
      kind: "cross";
      id: string;
      eyebrow: string;
      title: string;
      desc?: string;
      brandsTitle: string;
      brands: ReportBarRow[];
      paragraph: string;
      kinds: { kind: string; pct: string; keywords: string }[];
      top: { rank: number; brand: string; name: string; type: string; rating: string; price: string; buyers: number; img?: string; url?: string }[];
      reviews: { tone: "good" | "bad"; product: string; meta: string; quote: string }[];
    }
  | { kind: "keywords"; id: string; eyebrow: string; title: string; desc?: string; columns: { platform: string; items: { text: string; hl?: boolean }[] }[] };

export type CustomerReport = {
  id: string;
  /** 목록·문서 제목 */
  title: string;
  /** 문서 맨 위 작은 글씨(예: FEDIT DATA REPORT · 26/27 SEASON PLANNING) */
  eyebrow: string;
  /** 발행 시점 표기(예: 2026년 11월) */
  publishedAt: string;
  /** 자사 브랜드 */
  ownBrand: string;
  /** 비교 브랜드 */
  compareBrands: string[];
  /** 데이터 기준 한 줄 */
  basis: string;
  /** 핵심 요약 */
  summary: string[];
  sections: ReportSection[];
};
