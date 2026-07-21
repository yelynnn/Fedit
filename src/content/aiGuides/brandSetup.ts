import type { GuideTopic } from "@/types/guide";

const brandSetup: GuideTopic = {
  id: "brand-setup",
  category: "시작하기",
  title: "브랜드 선택 설정하기",
  desc: "분석 기준이 되는 브랜드 고르기",
  subtitle: "분석의 기준이 되는 브랜드를 고르고 관리",
  blocks: [
    { type: "heading", text: "브랜드 선택 흐름" },
    {
      type: "quote",
      text: "분석의 기준이 되는 브랜드를 고르고 관리합니다. 진입: **상단 우측 '브랜드' 버튼(선택 수 표시, 예: 122).**",
    },
    {
      type: "list",
      items: [
        "상단 우측 '브랜드' 클릭 → 브랜드 필터 모달 오픈",
        "모달에 현재 선택된 브랜드가 함께 표시",
        "검색창 또는 탭 탐색 — 선택된 브랜드 · SPA · 명품 · 디자이너",
        "브랜드 칩 선택/해제(선택된 브랜드 OO개로 개수 표시)",
        "'해당 브랜드 데이터 보기'로 적용 / '선택 초기화하기'로 해제",
        "적용하면 선택 브랜드가 상단 가로 칩으로 뜨고 모든 분석이 그 세트 기준으로 갱신",
      ],
    },

    {
      type: "callout",
      title: "브랜드 세트가 공통 기준",
      text: "여기서 고른 브랜드가 상품·색상·유형·패션쇼 분석의 공통 기준 대상입니다.",
    },
  ],
};

export default brandSetup;
