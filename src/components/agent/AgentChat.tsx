import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import AgentThread from './AgentThread';
import { Spin } from './AgentV2Answer';
import { useAgentConversation } from './useAgentConversation';
import { useChatStore } from '@/stores/ChatStore';
import { useUIStore } from '@/stores/UIStore';
import { useFilterStore } from '@/stores/FilterStore';

interface Props {
  conversationId: string;
  onClose?: () => void;
}

// 플로팅 FEDI 챗봇 패널. 전체화면은 사이드바 "FEDI Agent"(AgentPage)이고,
// 같은 현재 대화를 이어서 보여준다.
export default function AgentChat({ conversationId, onClose }: Props) {
  const { updateTitle, openNewConversation, closeAgent } = useChatStore((s) => s);
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const setSelectedTab = useFilterStore((s) => s.setSelectedTab);
  const {
    conv,
    messages,
    isEnterprise,
    planLoaded,
    isLoading,
    isLoadingHistory,
    isBusy,
    loadingStep,
    suggestions,
    send,
  } = useAgentConversation(conversationId);

  const [input, setInput] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(conv?.title ?? '새 대화');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages, isLoading]);

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

  const handleSend = (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isBusy || !isEnterprise) return;
    setInput('');
    send(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter는 무시(조합 확정 Enter로 두 번 전송되는 것 방지)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentTitle = conv?.title ?? '새 대화';

  // 참고 화면(fedi-chat-reference/index.html)의 .panel/.hd/.thread/.chips/.in 모양
  return (
    <div className="panel flex flex-col w-[520px] h-[min(640px,calc(100vh-180px))] bg-white border border-[#E6E6E6] rounded-[18px] shadow-2xl overflow-hidden text-[#111]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-[13px] border-b border-[#F0F0F0]">
        <div className="flex items-center gap-[7px] flex-1 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#111" className="flex-shrink-0">
            <path d="M12 2l2.2 6.3L21 10l-6.8 1.7L12 18l-2.2-6.3L3 10l6.8-1.7z" />
          </svg>
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
              className="flex-1 min-w-0 text-[14px] font-bold bg-white rounded-lg px-2 py-0.5 outline-none border border-[#E6E6E6]"
            />
          ) : (
            <button
              onDoubleClick={() => {
                setTitleDraft(currentTitle);
                setEditingTitle(true);
              }}
              title="더블클릭으로 제목 수정"
              className="text-[14px] font-bold truncate text-left"
            >
              {currentTitle}
            </button>
          )}
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold px-[7px] py-px rounded-full bg-[#EEF0FF] text-[#4F46E5] whitespace-nowrap">
          베타 테스트 중
        </span>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3 text-[11.5px] text-[#666]">
          <button
            onClick={() => {
              setTitleDraft(currentTitle);
              setEditingTitle(true);
            }}
            title="제목 수정"
            className="px-0.5 py-1 hover:text-[#111]"
          >
            <Icon icon="lucide:pencil" width={13} />
          </button>
          {/* 전체화면 — 같은 대화를 사이드바 "FEDI Agent" 화면으로 옮겨서 연다 */}
          <button
            onClick={() => {
              closeAgent();
              setSelectedTab('FEDI Agent');
            }}
            title="전체화면으로 보기"
            className="px-0.5 py-1 hover:text-[#111]"
          >
            <Icon icon="lucide:maximize-2" width={13} />
          </button>
          {/* 이전 대화 목록(설정 > FEDI 채팅 목록) — 고르면 그 대화로 다시 열린다 */}
          <button
            onClick={() => {
              closeAgent();
              openSettingsModal('FEDI대화');
            }}
            className="px-0.5 py-1 hover:text-[#111]"
          >
            기록
          </button>
          <button
            onClick={() => openNewConversation()}
            disabled={messages.length === 0}
            className="px-0.5 py-1 hover:text-[#111] disabled:opacity-40 disabled:hover:text-[#666]"
          >
            새 대화
          </button>
          <button onClick={onClose} className="px-0.5 py-1 hover:text-[#111]">
            닫기
          </button>
        </div>
      </div>

      {/* 메시지 영역(.thread) */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-[14px] flex flex-col gap-3">
        {isLoadingHistory && (
          <div className="flex items-center justify-center h-full gap-2 text-[12px] text-[#8A8A8A]">
            <Spin />
            대화를 불러오는 중…
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#8A8A8A]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#C7C7C7">
              <path d="M12 2l2.2 6.3L21 10l-6.8 1.7L12 18l-2.2-6.3L3 10l6.8-1.7z" />
            </svg>
            <p className="text-[13px] font-medium">무엇이든 물어보세요</p>
          </div>
        )}

        <AgentThread
          messages={messages}
          isLoading={isLoading}
          loadingStep={loadingStep}
          onSend={handleSend}
          sendDisabled={isBusy || !isEnterprise}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* 연관 질문(.chips) */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar px-[14px] pt-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            disabled={isBusy || !isEnterprise}
            className="flex-none text-[11.5px] px-[11px] py-[7px] border border-[#E6E6E6] rounded-full bg-white text-[#111] hover:bg-[#F5F5F5] whitespace-nowrap disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* 입력창(.in) */}
      <div className="flex items-center gap-2 px-[14px] pt-2.5 pb-[14px]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isEnterprise}
          placeholder={
            isEnterprise || !planLoaded
              ? '어떤 것을 도와드릴까요?'
              : 'Enterprise 요금제에서만 이용할 수 있어요'
          }
          className="flex-1 min-w-0 h-10 border border-[#E6E6E6] rounded-xl px-3 text-[13px] outline-none bg-white text-[#111] placeholder-[#8A8A8A] disabled:cursor-not-allowed"
        />
        <button
          onClick={() => handleSend()}
          disabled={!isEnterprise || !input.trim() || isBusy}
          aria-label="전송"
          className={`w-9 h-9 rounded-full grid place-items-center flex-none transition-colors disabled:cursor-not-allowed ${
            isEnterprise && input.trim() && !isBusy ? 'bg-[#111] text-white' : 'bg-[#E7E7E7] text-[#777]'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
