import type { GuideTopic } from "@/types/guide";

const boardSave: GuideTopic = {
  id: "board-save",
  category: "저장 및 계정",
  title: "내 보드에 저장·비교",
  desc: "관심 상품 담고 나란히 보기",
  subtitle: "관심 상품을 저장하고 나란히 비교하는 개인 작업 공간",
  blocks: [
    {
      type: "quote",
      text: "관심 상품을 저장하고 나란히 비교하는 개인 작업 공간입니다. 진입: **우측 상단 '내 보드(저장함)'.**",
    },

    { type: "heading", text: "저장하고 열람하기" },
    {
      type: "list",
      items: [
        "상품 분석 상세에서 폴더명 → 저장하기로 아이템을 담습니다",
        "우측 상단 내 보드(저장함)에서 보드를 전환·열람",
        "좌측 필터는 상품 분석과 동일하게 동작합니다",
      ],
    },

    {
      type: "callout",
      title: "주제별 보드로 비교하기",
      text: "기획 주제별로 보드를 분리(예: '25FW 아우터 후보')하면 색상·유형·구매화력도를 한 번에 비교할 수 있어요.",
    },
  ],
};

export default boardSave;
