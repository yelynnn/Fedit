import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import AgentMessage from './AgentMessage';
import type { Message } from '@/types/chat';
import { useChatStore } from '@/stores/ChatStore';
import { axiosInstance } from '@/apis/AxiosInstance';

const DEFAULT_SUGGESTIONS = [
  '이번 시즌 여성복 트렌드 키워드',
  '여성복 스타일 무드별 추천',
  '경쟁사 여성복 디자인 비교',
  '여성복 시즌 컬러·소재 제안',
];

function parseAiResponse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return undefined; }
    }
    return undefined;
  }
}

interface Props {
  conversationId: string;
  onClose?: () => void;
}

export default function AgentChat({ conversationId, onClose }: Props) {
  const { conversations, saveMessages, updateTitle } = useChatStore((s) => s);
  const conv = conversations.find((c) => c.id === conversationId);

  const [messages, setMessages] = useState<Message[]>(conv?.messages ?? []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(conv?.title ?? '새 대화');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  // Sync title draft when conversation title changes externally
  useEffect(() => {
    if (conv?.title && !editingTitle) setTitleDraft(conv.title);
  }, [conv?.title, editingTitle]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed) updateTitle(conversationId, trimmed);
    else setTitleDraft(conv?.title ?? '새 대화');
    setEditingTitle(false);
  };

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: query,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    saveMessages(conversationId, nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axiosInstance.post('/chat', { message: query });

      const raw = res.data.answer || '';
      const parsed = res.data.parsed || parseAiResponse(raw);

      const assistantMsg: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: raw,
        parsed,
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveMessages(conversationId, finalMessages);

      if (parsed?.chips && parsed.chips.length > 0) {
        setSuggestions(parsed.chips);
      }
    } catch {
      const errorMessages = [
        ...nextMessages,
        {
          id: `${Date.now()}-error`,
          role: 'assistant' as const,
          content: '응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
      ];
      setMessages(errorMessages);
      saveMessages(conversationId, errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentTitle = conv?.title ?? '새 대화';

  return (
    <div className="flex flex-col w-[460px] h-[580px] bg-[#EDECFF] rounded-3xl shadow-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon icon="ph:star-four-fill" width={17} className="text-gray-700 flex-shrink-0" />
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitleDraft(currentTitle);
                  setEditingTitle(false);
                }
              }}
              className="flex-1 min-w-0 text-[15px] font-semibold text-gray-800 bg-white/60 rounded-lg px-2 py-0.5 outline-none border border-indigo-300"
            />
          ) : (
            <button
              onDoubleClick={() => {
                setTitleDraft(currentTitle);
                setEditingTitle(true);
              }}
              title="더블클릭으로 제목 수정"
              className="text-[15px] font-semibold text-gray-800 truncate text-left hover:text-indigo-700 transition-colors"
            >
              {currentTitle}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <button
            onClick={() => {
              setTitleDraft(currentTitle);
              setEditingTitle(true);
            }}
            title="제목 수정"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Icon icon="lucide:pencil" width={13} />
          </button>
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
            닫기
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <Icon icon="ph:star-four-fill" width={32} className="text-indigo-300" />
            <p className="text-sm font-medium">무엇이든 물어보세요</p>
          </div>
        )}

        {messages.map((msg) => (
          <AgentMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
            <Icon icon="mdi:loading" width={14} className="animate-spin" />
            분석 중...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 추천 질문 */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={isLoading}
              className="flex-shrink-0 text-xs bg-white/80 border border-white/60 rounded-full px-3 py-1.5 text-gray-600 hover:bg-white transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 입력창 */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center bg-white rounded-2xl px-4 py-2.5 gap-3 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="어떤 것을 도와드릴까요?"
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:arrow-up" width={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
