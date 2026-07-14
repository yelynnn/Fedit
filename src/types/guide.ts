export type GuideCategory =
  | "시작하기"
  | "분석 기능 익히기"
  | "데이터 제대로 이해하기"
  | "FEDI AI"
  | "저장 및 계정";

export const GUIDE_CATEGORIES: GuideCategory[] = [
  "시작하기",
  "분석 기능 익히기",
  "데이터 제대로 이해하기",
  "FEDI AI",
  "저장 및 계정",
];

export type GuideBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; title?: string; text: string }
  | { type: "note"; text: string }
  | { type: "image"; src: string; alt?: string };

export interface GuideTopic {
  id: string;
  category: GuideCategory;
  title: string;
  /** 카드 그리드에 쓰이는 짧은 한 줄 설명 */
  desc: string;
  /** 상세 페이지 헤더(H1) 아래 표시되는 문장 */
  subtitle: string;
  blocks: GuideBlock[];
}
