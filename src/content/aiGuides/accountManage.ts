import type { GuideTopic } from "@/types/guide";

const accountManage: GuideTopic = {
  id: "account-manage",
  category: "저장 및 계정",
  title: "설정·구독·계정 관리",
  desc: "내 정보·알림·Pro 업그레이드",
  subtitle: "계정 정보·알림·구독을 관리하는 공간",
  blocks: [
    {
      type: "quote",
      text: "계정 정보, 알림, 구독을 관리합니다. 진입: **좌측 하단 사용자 클릭.**",
    },

    { type: "heading", text: "설정 메뉴 구성" },
    {
      type: "table",
      headers: ["그룹", "항목", "설명"],
      rows: [
        ["설정", "내 정보 · 알림", "계정 정보 · 로그인 방식 · 알림 수신 설정"],
        [
          "에이전트",
          "FEDI 채팅 목록 · AI 사용 가이드",
          "FEDI 대화 내역 · AI 기능 사용법",
        ],
        ["고객 지원", "FAQ · 1:1 문의", "도움말 · 문의"],
        ["사용 권한 및 청구", "구독 관리", "요금제 · 결제"],
      ],
    },

    { type: "heading", text: "내 정보 화면" },
    {
      type: "list",
      items: [
        "기본 정보 — 이메일·비밀번호 변경하기",
        "계정 관리 — 로그아웃 / 회원탈퇴",
        "FEDIT Pro 업그레이드 — 무제한 분석·트렌드 리포트",
      ],
    },

    {
      type: "callout",
      title: "회원탈퇴는 되돌릴 수 없어요",
      text: "회원탈퇴는 계정을 영구 삭제하며 복구할 수 없습니다. 안내 문구를 반드시 확인하세요.",
    },
  ],
};

export default accountManage;
