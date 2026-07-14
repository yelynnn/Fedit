import type { GuideTopic } from "@/types/guide";

const askFedi: GuideTopic = {
  id: "ask-fedi",
  category: "FEDI AI",
  title: "FEDI에게 물어보기",
  desc: "대화로 지표·트렌드 질문하기",
  subtitle: "FEDIT의 AI 에이전트에게 지표·트렌드·용어를 대화로 묻기",
  blocks: [
    {
      type: "quote",
      text: "FEDI는 FEDIT의 AI 에이전트입니다. 지표·트렌드·용어를 대화로 물어볼 수 있어요. 진입: **설정 > 에이전트 > FEDI 채팅 목록.**",
    },

    { type: "heading", text: "이렇게 활용하세요" },
    {
      type: "list",
      items: [
        "'구매 화력도가 87이면 높은 편이야?'처럼 지표 해석을 질문",
        "'세이지 그린 요즘 어때?'처럼 트렌드·색상 동향을 질문",
        "'이 브랜드 어디에 입점돼 있어?'처럼 데이터 범위를 확인",
        "각 화면의 (?) 툴팁 하단 'FEDI에게 더 물어보기'로 바로 연결",
      ],
    },

    { type: "heading", text: "대화 관리" },
    {
      type: "list",
      items: [
        "FEDI 채팅 목록에서 지난 대화 내역을 다시 열람",
        "AI 사용 가이드에서 기능별 사용법 확인",
      ],
    },

    {
      type: "callout",
      title: "막히면 바로 FEDI",
      text: "막히는 화면에서 곧바로 FEDI를 부르면 도움말을 찾아 헤맬 필요가 없어요.",
    },
  ],
};

export default askFedi;
