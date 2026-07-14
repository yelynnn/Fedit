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
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsed?: AiResponse;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
