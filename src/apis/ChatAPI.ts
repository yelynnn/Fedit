import { axiosInstance } from "./AxiosInstance";
import type { AiResponse, ChatMode, Message } from "@/types/chat";

// FEDI 챗봇 대화 — 서버(POST /chat, /chat/conversations)가 대화 기록의 원본이다.

export interface PostChatResponse {
  conversationId: string | number;
  answer: string; // parsed 와 같은 JSON 문자열
  parsed?: AiResponse;
  mode?: ChatMode;
}

export interface ConversationSummaryDto {
  id: string | number;
  title: string | null;
  createdAt: string | number;
  updatedAt: string | number;
}

interface ConversationMessageDto {
  id: string | number;
  role: string; // "USER" | "ASSISTANT" — 대소문자가 다르게 올 수 있어 문자열로 받는다
  content: string;
  createdAt: string | number;
}

export interface ConversationDetailDto extends ConversationSummaryDto {
  messages: ConversationMessageDto[];
}

// 같은 대화의 다음 질문부터 conversationId를 보내야 서버가 최근 3턴을 읽어
// "그럼 블랙은?" 같은 후속 질문을 이해한다.
export const PostChat = async (
  message: string,
  conversationId?: string,
): Promise<PostChatResponse> => {
  const res = await axiosInstance.post("/chat", {
    message,
    ...(conversationId ? { conversationId } : {}),
  });
  return res.data;
};

export const GetConversations = async (): Promise<ConversationSummaryDto[]> => {
  const res = await axiosInstance.get("/chat/conversations");
  return Array.isArray(res.data) ? res.data : [];
};

export const GetConversation = async (
  id: string,
): Promise<ConversationDetailDto> => {
  const res = await axiosInstance.get(`/chat/conversations/${id}`);
  return res.data;
};

export const DeleteConversation = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/chat/conversations/${id}`);
};

// 서버 시각(ISO 문자열 또는 epoch)을 ms로
export const toMillis = (v: string | number | null | undefined): number => {
  if (typeof v === "number") return v;
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : Date.now();
};

// ASSISTANT content는 parsed와 같은 JSON 문자열 — 파싱이 안 되는 예전
// 메시지는 parsed 없이 텍스트로 둔다(렌더러가 마크다운으로 표시).
export const parseAssistantContent = (content: string): AiResponse | undefined => {
  try {
    const obj = JSON.parse(content);
    return obj && typeof obj === "object" && (obj.v2 || obj.message)
      ? (obj as AiResponse)
      : undefined;
  } catch {
    return undefined;
  }
};

// role은 대소문자 구분 없이 USER만 사용자 메시지로 본다. 답변 JSON(parsed)으로
// 읽히는 내용은 role 값과 상관없이 답변으로 그린다(사용자 질문은 JSON이 아님).
export const toMessages = (dtos: ConversationMessageDto[]): Message[] =>
  dtos.map((m) => {
    const parsed = parseAssistantContent(m.content);
    const isUser = String(m.role).toUpperCase() === "USER" && !parsed;
    return isUser
      ? { id: String(m.id), role: "user", content: m.content }
      : { id: String(m.id), role: "assistant", content: m.content, parsed };
  });
