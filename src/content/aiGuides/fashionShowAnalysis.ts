import type { GuideTopic } from "@/types/guide";

const fashionShowAnalysis: GuideTopic = {
  id: "fashion-show-analysis",
  category: "분석 기능 익히기",
  title: "패션쇼 분석",
  desc: "런웨이 인사이트 → 실무 적용",
  subtitle: "10대 브랜드 런웨이 비교로 시즌 트렌드 인사이트를 도출하고 실무로 연결",
  blocks: [
    {
      type: "quote",
      text: "10대 브랜드 런웨이를 비교해 시즌 트렌드 인사이트를 도출하고 실무 적용 포인트로 연결합니다. 진입: **'패션쇼 분석'. 상단 Season Select로 시즌 선택.**",
    },

    { type: "heading", text: "시즌 전반 분석" },
    {
      type: "list",
      items: [
        "시즌 인사이트 — 콘셉트 요약 문장(예: '과시 대신 여백, 구조보다 유연함...')",
        "대표 포인트 컬러 — 스와치 + 명칭(퍼날레 레드·코발트 블루·헌터 그린·스톤 그레이)과 조합 코멘트",
        "주요 소재 & 텍스처 — 핵심 소재 키워드(경량 트위드, 프린지/크러시드 가공 등) + 예시 썸네일",
        "실루엣 적용 포인트 — 체크리스트형 제안(수트 셋업, 스커트 라인, 트위드 라인, 핏 조정)",
        "주요 아이템 & 디테일 — 런웨이 이미지 그리드 + 라벨(크롭 트위드 재킷, 로우슬럼 스트레이트 팬츠 등)",
      ],
    },

    { type: "heading", text: "브랜드별 컬렉션 분석" },
    {
      type: "list",
      items: [
        "브랜드 탭 — Chanel · Miu Miu · Prada · Dior · Loewe · Bottega Veneta",
        "각 브랜드 — 컬렉션 타이틀·시즌(예: 2025 S/S), 룩 설명, '자세히 보기'",
        "Color Palette — 브랜드 대표 색(아이보리·베이지·그레이·네이비 등)",
        "핵심 포인트 — 룩별 요약(경량 트위드로 봄 대응 / 미니 실루엣·로우라이즈 강조 등)",
      ],
    },

    {
      type: "callout",
      title: "쇼 → 리테일 확산 검증하기",
      text: "런웨이(5장)에서 잡은 컬러·소재·실루엣을 유형 분석(4장)·색상 분석(3장)의 실제 플랫폼 데이터와 대조하면 '쇼 트렌드 → 리테일 확산' 여부를 검증할 수 있습니다.",
    },
  ],
};

export default fashionShowAnalysis;
