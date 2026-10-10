export interface AiProduct {
  id: string;
  name: string;
  image?: string;
  price?: string;
  metric?: string;
  // 서버가 DB 실값으로 주입하는 구조화 지표 (LLM이 만들지 않음)
  brand?: string;
  trendScore?: number; // 시장반응 종합점수 0~100
  purchaseScore?: number; // 구매 화력 0~100
  sales?: number; // 판매량
  searchCount?: number; // 플랫폼 검색수
  // 기획 태깅(있으면 카드에 칩으로 노출)
  style?: string;
  material?: string;
  pattern?: string;
  color?: string;
}

// 비교(comparison) 표: 두 대상을 항목별로 비교
export interface AiComparisonRow {
  label: string; // 항목명 (예: 가격대, 타깃, 디자인 아이덴티티)
  left: string; // 대상 A 값
  right: string; // 대상 B 값
}
export interface AiComparison {
  left: string; // 대상 A 이름 (좌측 컬럼 헤더)
  right: string; // 대상 B 이름 (우측 컬럼 헤더)
  rows: AiComparisonRow[];
}

// 네이버/유튜브 등에서 지금 하입되는 콘텐츠
export interface AiSource {
  platform: string; // 'Naver' | 'YouTube' | 'Instagram' | 'Google' ...
  title: string; // 키워드/콘텐츠/영상 제목
  note?: string; // 왜 주목할지 한 줄
}

// 국내 인기 패션 인스타 계정(트렌드 참고)
export interface AiAccount {
  name: string;
  handle?: string; // @handle
  note?: string; // 특징/무드
}

// ── 챗봇 v2 (POST /chat mode: "fedi-v2") ──────────────────────────────
// parsed.v2 에 원본이 들어온다. 상품·숫자는 서버가 DB에서 규칙으로 뽑은 값.
// 형식(format)마다 data 모양이 달라서 필드는 대부분 optional로 둔다.

export type V2AnswerType =
  | 'definition'
  | 'single'
  | 'yesno'
  | 'list'
  | 'rank'
  | 'compare'
  | 'plan'
  | 'price'
  | 'trend'
  | 'period'
  | 'brand'
  | 'unsupported';

export interface V2Answer {
  summary: string;
  points?: string[];
  action?: string | null;
  caveat?: string | null;
  unknown?: string | null;
  answer_type?: V2AnswerType;
}

export interface V2Option {
  label: string;
  send: string;
}

// list 상품 카드 — m1/m2/m3는 답변 종류마다 의미가 다르다
//  상품 검색: m1=배지, m2=가격 문자열, m3=플랫폼
//  리뷰: m1="리뷰 1.4k", m2="4.8★", m3=가격 / 상품 비교: m1=가격, m2=리뷰, m3=평점·플랫폼
//  브랜드 순위: nm=브랜드명("★ "=관심, "자사 · "=회원 브랜드), itemcode 없음
export interface V2ListRow {
  rank?: number;
  img?: string;
  nm?: string;
  sb?: string; // "브랜드 · 유형"
  m1?: string; // 배지("트렌드 92 급상승"/"랭킹 3위")
  m2?: string; // 가격("₩34,100")
  m3?: string; // 플랫폼
  price?: number | null; // 원 — 가격은 m2 대신 이걸 쓴다
  url?: string;
  itemcode?: string;
  tscore?: number | null; // 0~100 소수, 50 = 변화 없음
  tags?: string[];
}

export interface V2Tile {
  k: string;
  v: string | number;
}

// 비중(share_*)은 전부 정수 퍼센트(46 = 46%), lift는 소수 배수
export interface V2AttrRow {
  v: string;
  share_top: number;
  share_all: number;
  lift?: number;
  n_top?: number;
  common?: boolean;
}

// 속성 축 묶음 — attrs 의 data 자체이자 list/ti 의 data.breakdown
export interface V2AttrAxes {
  axes?: { axis?: string; label?: string; rows: V2AttrRow[] }[]; // axis=영문 키, label=표시명
  top_n?: number;
  n?: number;
}

export interface V2GraphRow {
  l: string;
  a?: number; // 0~100 막대 길이
  b?: number; // 0~100 막대 길이
  v?: string; // "1.2배"
  hot?: boolean; // 배수 빨강 강조
  pa?: string | number; // 실제 값
  pb?: string | number;
}

// ti 카드(이미지 + 캡션)
export interface V2Card {
  img?: string;
  cap?: string;
  sub?: string;
  url?: string;
  itemcode?: string;
  // plan 예시 카드는 list 행 모양으로 올 수도 있어서 같이 받아둔다
  nm?: string;
  sb?: string;
  m1?: string;
  m2?: string;
}

export interface V2PlanAttr {
  axis: string;
  value: string;
  share_top?: number;
  standout?: { v: string; lift: number; level?: string } | null;
}

export interface V2PlanItem {
  type: string;
  share_top?: number;
  share_all?: number;
  lift?: number;
  level?: '뚜렷' | '참고' | '';
  move?: '강화' | '확장' | null;
  ours?: number | null; // 자사 안에서 이 유형 비중(%)
  attrs?: V2PlanAttr[];
  price?: { lo: number; med: number; hi: number } | null;
  cards?: V2Card[];
}

export interface V2Ours {
  brand: string;
  n?: number; // 자사 상품 수
  types?: [string, number][]; // [유형, %]
  colors?: string[];
  price_med?: number | null;
  price_lo?: number | null;
  price_hi?: number | null;
}

export interface V2GapRow {
  axis: string;
  ours: string;
  share_top?: number;
  rank?: number;
  lift?: number;
  verdict: '잘 맞음' | '무난' | '보완 고려' | string;
  top?: { v: string; share_top?: number };
  alt?: { v: string; lift?: number } | null;
}

export interface V2Data extends V2AttrAxes {
  title?: string; // 카드 제목(list/graph/plan)
  basis?: string; // plan 집계 기준
  legend?: [string, string][]; // [색, 이름]
  // list
  rows?: (V2ListRow & V2GraphRow)[];
  tiles?: V2Tile[];
  breakdown?: V2AttrAxes | null; // list/ti 아래 "잘나가는 속성"
  // attrs
  cond?: string;
  // graph
  foot?: string;
  priority?: { n: number; t: string; sub?: string }[];
  // plan
  items?: V2PlanItem[];
  ours?: V2Ours | null;
  // ti / text / clarify
  text?: string;
  bullets?: string[];
  cards?: V2Card[];
  imgs?: string[]; // cards 가 없을 때의 이미지/캡션
  captions?: string[];
  note?: string;
  after?: string;
  options?: V2Option[];
  gap_rows?: V2GapRow[];
}

export type V2Format = 'list' | 'attrs' | 'graph' | 'plan' | 'ti' | 'text' | 'clarify';

export interface AiV2 {
  answer?: V2Answer; // AI 정리 답변 — 없으면 headline 을 요약으로 쓴다
  headline?: string;
  intent?: string;
  state?: string;
  steps?: string[]; // 진행 단계("N개의 단계")
  related?: { q: string; a?: string } | null; // 연관 질문 한 줄
  extra?: { cond_label?: string; headline?: string; format?: string; data?: V2Data }[];
  format?: V2Format | string;
  data?: V2Data;
  labels?: string[];
  chips?: string[];
  knowledge?: { label?: string; text: string } | null;
  cond_label?: string | null;
  evidence?: string | string[] | null;
}

export type ChatMode = 'fedi-v2' | 'fedi-v2-unavailable' | 'guard' | string;

export interface AiResponse {
  type: 'product_recommend' | 'trend' | 'comparison' | 'analysis' | 'text';
  message: {
    summary: string;
    points?: string[];
    detail?: string;
  };
  products?: AiProduct[];
  comparison?: AiComparison; // type === 'comparison' 일 때 권장
  sources?: AiSource[]; // 네이버/유튜브 하입 (트렌드/분석 시 권장)
  accounts?: AiAccount[]; // 국내 인스타 계정 (트렌드 시 권장)
  chips?: string[];
  v2?: AiV2; // 챗봇 v2 원본 — 있으면 이걸로 렌더링
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsed?: AiResponse;
  mode?: ChatMode;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  // 서버에서 메시지 내용을 불러왔는지(목록만 받은 대화는 false)
  loaded?: boolean;
  createdAt: number;
  updatedAt: number;
}
