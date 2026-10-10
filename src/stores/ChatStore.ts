import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, Conversation } from '@/types/chat';
import {
  DeleteConversation,
  GetConversation,
  GetConversations,
  toMessages,
  toMillis,
} from '@/apis/ChatAPI';

// ── 대화 기록 관리 규칙 (ChatGPT·Claude 방식) ─────────────────────────
// 서버(/chat/conversations)가 원본이고, 이 스토어는 화면용 캐시다.
// 1) 챗봇을 열 때 마지막 대화가 최근(RESUME_WINDOW_MS 이내)에 오갔으면 이어서
//    보여주고, 오래됐으면 빈 새 대화로 시작한다. 이전 대화는 설정 > FEDI 채팅
//    목록에서 골라 이어간다. 방금 보낸 대화는 패널을 닫았다 열어도 그대로다.
// 2) 새 대화는 첫 답변이 와서 서버 conversationId를 받기 전까지 "초안"(draft-)
//    이다. 메시지 없는 초안은 목록에 보이지 않고 하나만 남긴다.
// 3) 제목은 서버 제목(없으면 첫 질문)을 쓰고, 사용자가 바꾼 제목은 이
//    브라우저에 따로 저장해 우선한다(서버에 제목 수정 API가 아직 없음).
// 4) 다른 계정으로 로그인하면 캐시를 비운다.
// 5) 같은 현재 대화를 플로팅 패널(isAgentOpen)과 전체화면(사이드바 FEDI Agent)이
//    함께 쓴다 — 어느 쪽에서 열든 이어진다.
const RESUME_WINDOW_MS = 30 * 60 * 1000;
const TITLE_MAX = 30;
export const DEFAULT_TITLE = '새 대화';
// 사이드바·화면 전환에 쓰는 전체화면 챗봇 탭 이름(FilterStore.selectedTab)
export const AGENT_TAB = 'FEDI Agent';

export const isDraftId = (id: string) => id.startsWith('draft-');
const isEmptyDraft = (c: Conversation) => isDraftId(c.id) && c.messages.length === 0;

const makeDraft = (): Conversation => {
  const now = Date.now();
  return {
    // 같은 밀리초에 두 개가 만들어져도 겹치지 않게 임의 값을 붙인다
    id: `draft-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: DEFAULT_TITLE,
    messages: [],
    loaded: true,
    createdAt: now,
    updatedAt: now,
  };
};

// 첫 질문을 한 줄로 줄여 제목으로 쓴다
const titleFrom = (text: string) => {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > TITLE_MAX ? `${oneLine.slice(0, TITLE_MAX)}…` : oneLine;
};

const byRecent = (a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt;

const withoutKey = (obj: Record<string, string>, key: string) => {
  const next = { ...obj };
  delete next[key];
  return next;
};

interface ChatStore {
  conversations: Conversation[];
  isAgentOpen: boolean;
  activeConversationId: string | null;
  // 대화를 저장한 계정(이메일) — 계정이 바뀌면 캐시를 비운다
  ownerKey: string | null;
  // 응답을 기다리는 대화 id(새로고침하면 사라지므로 저장하지 않음)
  pendingConversationId: string | null;
  // 사용자가 직접 바꾼 제목(서버 id → 제목)
  titleOverrides: Record<string, string>;
  listLoading: boolean;

  openNewConversation: () => string;
  openConversation: (id: string) => void;
  // 1)번 규칙으로 이어갈 대화를 정한다(최근이면 이어서, 아니면 새 대화)
  resumeOrStartConversation: () => string;
  openAgent: () => void;
  closeAgent: () => void;
  updateTitle: (id: string, title: string) => void;
  saveMessages: (id: string, messages: Message[]) => void;
  // 첫 답변으로 받은 서버 conversationId로 초안을 바꾼다
  promoteDraft: (draftId: string, serverId: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  setPending: (id: string | null) => void;
  syncOwner: (key: string) => void;
  fetchConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
}

// 브라우저에 저장하는 부분(목록 요약·현재 대화·계정·직접 바꾼 제목)
type PersistedChat = Pick<ChatStore, 'conversations' | 'activeConversationId' | 'ownerKey' | 'titleOverrides'>;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      isAgentOpen: false,
      activeConversationId: null,
      ownerKey: null,
      pendingConversationId: null,
      titleOverrides: {},
      listLoading: false,

      // 빈 초안이 이미 있으면 그걸 다시 쓰고, 다른 빈 초안은 정리한다
      openNewConversation: () => {
        const { conversations } = get();
        const draft = conversations.find(isEmptyDraft) ?? makeDraft();
        set({
          conversations: [draft, ...conversations.filter((c) => !isEmptyDraft(c))],
          activeConversationId: draft.id,
        });
        return draft.id;
      },

      openConversation: (id) => {
        set((state) => ({
          activeConversationId: id,
          // 다른 대화로 옮기면 쓰지 않은 빈 초안은 지운다
          conversations: state.conversations.filter((c) => c.id === id || !isEmptyDraft(c)),
        }));
        get().loadConversation(id);
      },

      resumeOrStartConversation: () => {
        const { conversations, activeConversationId, pendingConversationId } = get();
        const active = conversations.find((c) => c.id === activeConversationId);
        const resumable =
          active &&
          (isEmptyDraft(active) ||
            active.id === pendingConversationId ||
            Date.now() - active.updatedAt < RESUME_WINDOW_MS);
        if (!resumable) return get().openNewConversation();
        get().loadConversation(active.id);
        return active.id;
      },

      openAgent: () => {
        get().resumeOrStartConversation();
        set({ isAgentOpen: true });
      },

      closeAgent: () => {
        set({ isAgentOpen: false });
      },

      updateTitle: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === id ? { ...c, title: trimmed } : c)),
          titleOverrides: { ...state.titleOverrides, [id]: trimmed },
        }));
      },

      saveMessages: (id, messages) => {
        set((state) => {
          const conv = state.conversations.find((c) => c.id === id);
          if (!conv) return state;
          let title = conv.title;
          if (title === DEFAULT_TITLE) {
            const first = messages.find((m) => m.role === 'user');
            if (first) title = titleFrom(first.content);
          }
          const updated = { ...conv, messages, title, loaded: true, updatedAt: Date.now() };
          return {
            conversations: [updated, ...state.conversations.filter((c) => c.id !== id)].sort(byRecent),
          };
        });
      },

      promoteDraft: (draftId, serverId) => {
        if (draftId === serverId) return;
        set((state) => {
          if (!state.conversations.some((c) => c.id === draftId)) return state;
          const override = state.titleOverrides[draftId];
          const rest = withoutKey(state.titleOverrides, draftId);
          return {
            conversations: state.conversations
              .filter((c) => c.id !== serverId)
              .map((c) => (c.id === draftId ? { ...c, id: serverId } : c)),
            activeConversationId:
              state.activeConversationId === draftId ? serverId : state.activeConversationId,
            pendingConversationId:
              state.pendingConversationId === draftId ? serverId : state.pendingConversationId,
            titleOverrides: override ? { ...rest, [serverId]: override } : rest,
          };
        });
      },

      deleteConversation: async (id) => {
        if (!isDraftId(id)) await DeleteConversation(id);
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          titleOverrides: withoutKey(state.titleOverrides, id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          isAgentOpen: state.activeConversationId === id ? false : state.isAgentOpen,
        }));
      },

      setPending: (id) => set({ pendingConversationId: id }),

      syncOwner: (key) => {
        const { ownerKey } = get();
        if (ownerKey === key) return;
        set({
          ownerKey: key,
          conversations: [],
          activeConversationId: null,
          isAgentOpen: false,
          pendingConversationId: null,
          titleOverrides: {},
        });
      },

      // 서버 목록으로 캐시를 맞춘다 — 이미 불러온 메시지와 초안은 유지
      fetchConversations: async () => {
        set({ listLoading: true });
        try {
          const list = await GetConversations();
          set((state) => {
            const cached = new Map(state.conversations.map((c) => [c.id, c]));
            const fromServer: Conversation[] = list.map((dto) => {
              const id = String(dto.id);
              const prev = cached.get(id);
              const updatedAt = toMillis(dto.updatedAt);
              // 서버가 더 최신이면(다른 기기에서 이어감) 메시지를 다시 불러오게 한다
              const fresh = !!prev?.loaded && prev.updatedAt >= updatedAt;
              return {
                id,
                title: state.titleOverrides[id] ?? dto.title ?? prev?.title ?? DEFAULT_TITLE,
                messages: fresh ? prev!.messages : [],
                loaded: fresh,
                createdAt: toMillis(dto.createdAt),
                updatedAt: Math.max(updatedAt, prev?.updatedAt ?? 0),
              };
            });
            const drafts = state.conversations.filter((c) => isDraftId(c.id));
            const ids = new Set(fromServer.map((c) => c.id));
            // 서버 목록에 없는 대화(다른 기기에서 삭제됨)는 버리되, 지금 응답을
            // 기다리는 대화는 화면이 깨지지 않게 남긴다.
            const keepPending = state.conversations.filter(
              (c) => !isDraftId(c.id) && !ids.has(c.id) && c.id === state.pendingConversationId,
            );
            return {
              conversations: [...drafts, ...fromServer, ...keepPending].sort(byRecent),
              listLoading: false,
            };
          });
          // 현재 대화가 다시 불러와야 하는 상태가 됐으면 내용을 가져온다
          const { activeConversationId } = get();
          if (activeConversationId) get().loadConversation(activeConversationId);
        } catch {
          set({ listLoading: false });
        }
      },

      // 메시지를 아직 안 불러온 서버 대화면 내용을 가져온다
      loadConversation: async (id) => {
        if (isDraftId(id)) return;
        const existing = get().conversations.find((c) => c.id === id);
        if (existing?.loaded || get().pendingConversationId === id) return;
        try {
          const dto = await GetConversation(id);
          set((state) => {
            const conv: Conversation = {
              id,
              title: state.titleOverrides[id] ?? dto.title ?? existing?.title ?? DEFAULT_TITLE,
              messages: toMessages(dto.messages ?? []),
              loaded: true,
              createdAt: toMillis(dto.createdAt),
              updatedAt: toMillis(dto.updatedAt),
            };
            return {
              conversations: [conv, ...state.conversations.filter((c) => c.id !== id)].sort(byRecent),
            };
          });
        } catch {
          // 삭제됐거나 볼 수 없는 대화(403/404) — 열려 있었다면 새 대화로
          const wasActive = get().activeConversationId === id;
          set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
          }));
          if (wasActive) get().openNewConversation();
        }
      },
    }),
    {
      name: 'fedit-chat-store',
      version: 2,
      // 메시지 내용은 서버에서 다시 불러오므로 목록 요약만 저장한다.
      // 패널 열림·응답 대기 상태도 새로고침 후 이어지면 안 돼서 저장하지 않는다.
      partialize: (s): PersistedChat => ({
        conversations: s.conversations
          .filter((c) => !isDraftId(c.id))
          .map((c) => ({ ...c, messages: [], loaded: false })),
        activeConversationId:
          s.activeConversationId && isDraftId(s.activeConversationId) ? null : s.activeConversationId,
        ownerKey: s.ownerKey,
        titleOverrides: s.titleOverrides,
      }),
      // v1(브라우저에만 저장하던 시절) 기록은 서버 id가 아니라 버린다 — 같은
      // 대화는 서버 목록에서 다시 불러온다.
      migrate: (persisted, version) =>
        version < 2
          ? { conversations: [], activeConversationId: null, ownerKey: null, titleOverrides: {} }
          : (persisted as PersistedChat),
    },
  ),
);
