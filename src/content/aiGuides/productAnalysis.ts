import type { GuideTopic } from "@/types/guide";

const productAnalysis: GuideTopic = {
  id: "product-analysis",
  category: "분석 기능 익히기",
  title: "상품 분석",
  desc: "필터·그리드·상품 상세 속성",
  subtitle: "조건별 탐색부터 개별 상품의 속성·지표·유사 상품까지 심층 분석",
  blocks: [
    {
      type: "quote",
      text: "조건별로 상품을 탐색하고, 개별 상품의 속성·지표·유사 상품까지 심층 분석합니다. 진입: **'상품 분석'.**",
    },

    {
      type: "paragraph",
      text: "화면 구조 · 좌: 필터 → 중앙: 상품 그리드 → 우: 상품 상세",
    },

    { type: "heading", text: "필터 (좌)" },
    {
      type: "list",
      items: [
        "2025년·시즌 기준 + 성별·유형·색상·디테일·소재·패턴으로 조건 지정",
        "선택값은 칩(예: '자켓 X')으로 누적, '초기화'로 전체 해제",
      ],
    },

    { type: "heading", text: "상품 그리드 (중앙)" },
    {
      type: "list",
      items: [
        "카드에 브랜드명·상품명·가격·누적조회수·누적판매량·노출 플랫폼(무/W/29) 표시",
        "카드 클릭 시 우측에 상세 오픈",
      ],
    },

    { type: "heading", text: "상품 상세 (우)" },
    {
      type: "list",
      items: [
        "이미지 · 정가/할인가 · 성별 · 신상 업데이트일 · 노출 플랫폼 뱃지",
        "속성 분석 — 색상 · 소매 · 기장 · 넥라인 · 핏 · 디테일 · 패턴 (각 👍/👎 피드백)",
        "AI 개요 / 지표 카드 — 구매화력도·상품·브랜드 + 유형 트렌드성·실 품절 비율",
        "유사한 스타일 아이템 추천",
        "폴더명 → 저장하기로 내 보드에 저장",
      ],
    },

    {
      type: "callout",
      title: "태그가 실제와 다르면 👎 피드백",
      text: "속성 태그가 실제와 다르면 👎로 알려주세요. 태그·추천 품질이 점점 개선됩니다.",
    },
  ],
};

export default productAnalysis;
