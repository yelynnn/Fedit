import type { GuideTopic } from "@/types/guide";

const usageScenario: GuideTopic = {
  id: "usage-scenario",
  category: "FEDI AI",
  title: "실전 활용 시나리오",
  desc: "색상 기획·쇼→리테일 검증",
  subtitle: "업무 흐름별로 어떤 화면을 어떤 순서로 쓰는지 안내",
  blocks: [
    {
      type: "quote",
      text: "대표적인 업무 흐름별로 어떤 화면을 어떤 순서로 쓰면 좋을지 안내합니다.",
    },

    { type: "heading", text: "대표 시나리오" },

    { type: "heading", text: "오늘 트렌드 빠르게 보기" },
    {
      type: "paragraph",
      text: "실시간 아이템 → 인기 키워드(큰 흐름) → 트렌드 항목(대표 상품·단계)",
    },

    { type: "heading", text: "상품 벤치마킹" },
    {
      type: "paragraph",
      text: "상품 분석 → 필터 → 상세(속성·지표·유사) → 내 보드 저장",
    },

    { type: "heading", text: "다음 시즌 색상 기획" },
    {
      type: "paragraph",
      text: "색상 분석 → 전체 vs 자사/경쟁 비중 → 신규 주목 색상 진입 후보",
    },

    { type: "heading", text: "브랜드 포지셔닝 진단" },
    {
      type: "paragraph",
      text: "브랜드 선택 → 유형 분석(카테고리·핏·소재 편중) → 색상 분석 대조",
    },

    { type: "heading", text: "쇼 → 리테일 검증" },
    {
      type: "paragraph",
      text: "패션쇼 분석 인사이트 → 유형·색상 분석의 실제 데이터로 확산 확인",
    },
  ],
};

export default usageScenario;
