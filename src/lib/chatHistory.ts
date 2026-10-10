import type { Conversation } from "@/types/chat";
import { isDraftId } from "@/stores/ChatStore";

// FEDI 대화 기록 목록 규칙 — 설정 > FEDI 채팅 목록과 전체화면 기록 패널이 같이 쓴다.

const DAY = 86400000;
const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0)).getTime();

// 서버 대화 + 질문을 보냈지만 아직 서버 id가 없는 초안만 보여준다
// (메시지 없는 새 대화 초안은 숨김)
export const visibleConversations = (conversations: Conversation[]) =>
  conversations.filter((c) => !isDraftId(c.id) || c.messages.length > 0);

// 검색은 제목과 (불러온) 대화 내용(질문·답변) 모두에서 찾는다
export const searchConversations = (conversations: Conversation[], query: string) => {
  const q = query.trim().toLowerCase();
  return [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter(
      (c) =>
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) =>
          (m.parsed?.v2?.answer?.summary ?? m.parsed?.message?.summary ?? m.content)
            .toLowerCase()
            .includes(q),
        ),
    );
};

// ChatGPT·Claude처럼 날짜 구간으로 묶는다(달력 기준 오늘/어제)
export const groupConversationsByDate = (conversations: Conversation[]) => {
  const today = startOfToday();
  return [
    { label: "오늘", from: today, to: Infinity },
    { label: "어제", from: today - DAY, to: today },
    { label: "지난 7일", from: today - 7 * DAY, to: today - DAY },
    { label: "지난 30일", from: today - 30 * DAY, to: today - 7 * DAY },
    { label: "이전", from: -Infinity, to: today - 30 * DAY },
  ]
    .map((g) => ({
      label: g.label,
      items: conversations.filter((c) => c.updatedAt >= g.from && c.updatedAt < g.to),
    }))
    .filter((g) => g.items.length > 0);
};

// 오늘이면 시각, 그 외엔 "어제"/"N일 전"/날짜
export const formatConversationTime = (at: number) => {
  const today = startOfToday();
  const d = new Date(at);
  const daysAgo = Math.ceil((today - at) / DAY);
  if (at >= today) return d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
  if (daysAgo <= 1) return "어제";
  if (daysAgo <= 30) return `${daysAgo}일 전`;
  return d.toLocaleDateString("ko-KR", { year: "2-digit", month: "numeric", day: "numeric" });
};
