import type { GuideTopic } from "@/types/guide";

const colorAnalysis: GuideTopic = {
  id: "color-analysis",
  category: "분석 기능 익히기",
  title: "색상 분석",
  desc: "색상 비중 + 신규 주목 색",
  subtitle: "시즌 색상 트렌드와 브랜드 색상 전략 비교, 신규 부상 색 포착",
  blocks: [
    {
      type: "quote",
      text: "시즌 색상 트렌드와 브랜드 색상 전략을 비교하고, 신규 부상 색을 포착합니다. 진입: **'색상 분석', 상단 시즌선택, 우상단 그리드/리스트 보기 토글.**",
    },

    { type: "heading", text: "색상비중 비교" },
    {
      type: "list",
      items: [
        "전체 브랜드 색상 분석 — 시장 전체 색상 비중 트리맵(예: 블랙 40%) + 전 시즌 대비 증감%",
        "브랜드별 카드(예: Dior) — 특정 브랜드의 색상 구성 비교",
        "브랜드 추가하기(+)로 비교 대상 추가, 카드 X로 제거",
        "읽는 법 — 블록 크기 = 비중, 뱃지 = 전 시즌 대비 변화",
      ],
    },

    { type: "heading", text: "신규 주목 색상 (트렌드 컬러)" },
    {
      type: "list",
      items: [
        "여러 경쟁사가 소량으로 동시 출시 중인 유행 색상(예: 세이지 그린 88점)",
        "트렌드 스코어 · 성장 가속도 · 2개 이상 경쟁사 동시 출시 · 평균 비중/총 출시 수 · ⭐ AI 추천",
        "하단: 브랜드별 비중(예: A.P.C. 4%) + 관련 아이템",
      ],
    },

    {
      type: "callout",
      title: "트렌드 스코어도 대외비입니다",
      text: "여러 지표를 종합 계산한 값이며, 입점 플랫폼 범위에 따라 일부 값이 비어 보일 수 있습니다.",
    },
    {
      type: "callout",
      title: "확산 직전 신호 읽는 법",
      text: "'소량 + 다수 브랜드 동시 출시 + 성장 가속' 조합은 확산 직전 신호예요. 초기 진입 색 후보로 보세요.",
    },
  ],
};

export default colorAnalysis;
