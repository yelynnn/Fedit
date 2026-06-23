import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, Conversation } from '@/types/chat';

interface ChatStore {
  conversations: Conversation[];
  isAgentOpen: boolean;
  activeConversationId: string | null;

  openNewConversation: () => string;
  openConversation: (id: string) => void;
  openAgent: () => void;
  closeAgent: () => void;
  updateTitle: (id: string, title: string) => void;
  saveMessages: (id: string, messages: Message[]) => void;
  deleteConversation: (id: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      isAgentOpen: false,
      activeConversationId: null,

      openNewConversation: () => {
        const id = `conv-${Date.now()}`;
        set((state) => ({
          conversations: [
            {
              id,
              title: '새 대화',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...state.conversations,
          ],
          activeConversationId: id,
          isAgentOpen: true,
        }));
        return id;
      },

      openConversation: (id) => {
        set({ activeConversationId: id, isAgentOpen: true });
      },

      openAgent: () => {
        const { conversations, activeConversationId } = get();
        const valid =
          activeConversationId &&
          conversations.find((c) => c.id === activeConversationId);
        if (valid) {
          set({ isAgentOpen: true });
        } else {
          const id = `conv-${Date.now()}`;
          set((state) => ({
            conversations: [
              {
                id,
                title: '새 대화',
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
              ...state.conversations,
            ],
            activeConversationId: id,
            isAgentOpen: true,
          }));
        }
      },

      closeAgent: () => {
        set({ isAgentOpen: false });
      },

      updateTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c,
          ),
        }));
      },

      saveMessages: (id, messages) => {
        set((state) => {
          const conv = state.conversations.find((c) => c.id === id);
          if (!conv) return state;

          let newTitle = conv.title;
          if (conv.title === '새 대화' && messages.length > 0) {
            const first = messages.find((m) => m.role === 'user');
            if (first) {
              newTitle =
                first.content.length > 22
                  ? first.content.slice(0, 22) + '...'
                  : first.content;
            }
          }

          return {
            conversations: state.conversations.map((c) =>
              c.id === id
                ? { ...c, messages, title: newTitle, updatedAt: Date.now() }
                : c,
            ),
          };
        });
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? null
              : state.activeConversationId,
          isAgentOpen:
            state.activeConversationId === id ? false : state.isAgentOpen,
        }));
      },
    }),
    { name: 'fedit-chat-store' },
  ),
);
