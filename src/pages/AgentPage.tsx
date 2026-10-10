import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import AgentThread from "@/components/agent/AgentThread";
import { Spin } from "@/components/agent/AgentV2Answer";
import { useAgentConversation } from "@/components/agent/useAgentConversation";
import { useChatStore } from "@/stores/ChatStore";
import AgentHistoryPanel from "@/components/agent/AgentHistoryPanel";

// 사이드바 "FEDI Agent" 전체화면. 플로팅 패널과 같은 현재 대화를 쓰고,
// 설정 > FEDI 채팅 목록에서 대화를 고르면 이 화면으로 열린다.
// 대화가 비어 있으면 시작 화면, 아니면 대화 화면을 보여준다.

const HISTORY_OPEN_KEY = "agent-history-open";
const PLACEHOLDER =
  "답은 이미 FEDIT가 쌓아온 데이터에 있어요. 바로 찾아드릴게요.";
const LOCKED_PLACEHOLDER = "Enterprise 요금제에서만 이용할 수 있어요";

const SparkIcon = ({
  size = 18,
  color = "#111",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinejoin="round"
  >
    <path d="M12 2l2.2 6.3L21 10l-6.8 1.7L12 18l-2.2-6.3L3 10l6.8-1.7z" />
  </svg>
);

const SendIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

// 입력창 — Enter 전송, Shift+Enter 줄바꿈, 한글 조합 중 Enter 무시
function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  canSend,
  placeholder,
  tall,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  canSend: boolean;
  placeholder: string;
  tall?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // 내용에 맞춰 높이를 늘린다(최대 200px 이후 스크롤)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <div
      className={`w-full rounded-2xl border border-[#D9DADB] bg-white px-5 pt-4 pb-3 transition-colors focus-within:border-[#9A9C9E] ${
        disabled ? "opacity-70" : ""
      }`}
    >
      <textarea
        ref={ref}
        rows={tall ? 3 : 1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full resize-none bg-transparent text-[16px] leading-[1.5] text-[#111] outline-none placeholder-[#A6A8AA] disabled:cursor-not-allowed ${
          tall ? "min-h-[72px]" : "min-h-[24px]"
        }`}
      />
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSend}
          aria-label="전송"
          className={`grid w-10 h-10 rounded-full place-items-center transition-colors disabled:cursor-not-allowed ${
            canSend
              ? "bg-[#111] text-white hover:bg-[#333]"
              : "bg-[#EBEBEB] text-[#A6A8AA]"
          }`}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// 대화 맨 위 날짜 구분선(MM.DD)
function DateDivider({ at }: { at: number }) {
  const d = new Date(at);
  const label = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  return (
    <div className="relative flex justify-center my-2">
      <div className="absolute inset-x-0 top-1/2 h-px bg-[#EAEAEA]" />
      <span className="relative px-6 py-1 text-[13px] text-[#6F7173] bg-white border border-[#E6E6E6] rounded-full">
        {label}
      </span>
    </div>
  );
}

function ConversationView({
  conversationId,
  historyOpen,
  onToggleHistory,
}: {
  conversationId: string;
  historyOpen: boolean;
  onToggleHistory: () => void;
}) {
  const { updateTitle, openNewConversation, deleteConversation } = useChatStore(
    (s) => s,
  );
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

  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isEmpty = !isLoadingHistory && messages.length === 0 && !isLoading;
  const title = conv?.title ?? "새 대화";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages, isLoading]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const handleSend = (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isBusy || !isEnterprise) return;
    setInput("");
    send(query);
  };

  const commitTitle = () => {
    if (titleDraft.trim()) updateTitle(conversationId, titleDraft);
    setEditingTitle(false);
  };

  const canSend = isEnterprise && !!input.trim() && !isBusy;
  const placeholder =
    isEnterprise || !planLoaded ? PLACEHOLDER : LOCKED_PLACEHOLDER;

  return (
    <div className="flex flex-col h-full">
      {/* 상단 — "FEDI Agent > 대화 제목" + 더보기 */}
      <header className="sticky top-0 z-20 flex items-center justify-between flex-shrink-0 w-full px-8 bg-white border-b h-15 border-line-divider">
        <div className="flex items-center min-w-0 gap-2 text-[16px]">
          {/* 기록 패널을 닫았을 때 다시 여는 버튼 */}
          {!historyOpen && (
            <button
              type="button"
              onClick={onToggleHistory}
              title="대화 기록 펼치기"
              className="grid flex-shrink-0 w-8 h-8 -ml-2 rounded-lg place-items-center text-[#6F7173] hover:bg-surface-base"
            >
              <Icon icon="ph:caret-double-right" className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => openNewConversation()}
            className="flex items-center flex-shrink-0 gap-2 font-medium text-[#6F7173] hover:text-[#111]"
            title="새 대화"
          >
            <SparkIcon size={18} color="currentColor" />
            FEDI Agent
          </button>
          <span className="flex-shrink-0 rounded-full bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-bold text-[#4F46E5]">
            베타
          </span>
          {!isEmpty && (
            <>
              <Icon
                icon="ph:caret-right"
                className="flex-shrink-0 w-4 h-4 text-[#A6A8AA]"
              />
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing)
                      commitTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="min-w-0 flex-1 max-w-[480px] font-semibold text-[#111] outline-none border-b border-[#9A9C9E] bg-transparent"
                />
              ) : (
                <button
                  type="button"
                  onDoubleClick={() => {
                    setTitleDraft(title);
                    setEditingTitle(true);
                  }}
                  title="더블클릭으로 제목 수정"
                  className="min-w-0 font-semibold text-[#111] truncate"
                >
                  {title}
                </button>
              )}
            </>
          )}
        </div>

        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="더보기"
            className="grid w-9 h-9 rounded-lg place-items-center text-[#6F7173] hover:bg-surface-base"
          >
            <Icon icon="ph:dots-three-bold" className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-30 w-44 p-1.5 bg-white border border-line-divider rounded-xl shadow-xl text-[14px] text-[#242628]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openNewConversation();
                }}
                className="flex items-center w-full gap-2 px-3 py-2 rounded-lg hover:bg-surface-base"
              >
                <Icon icon="ph:plus" className="w-4 h-4" />새 대화
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleHistory();
                }}
                className="flex items-center w-full gap-2 px-3 py-2 rounded-lg hover:bg-surface-base"
              >
                <Icon icon="ph:clock-counter-clockwise" className="w-4 h-4" />
                {historyOpen ? "대화 기록 숨기기" : "대화 기록 보기"}
              </button>
              {!isEmpty && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setTitleDraft(title);
                      setEditingTitle(true);
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 rounded-lg hover:bg-surface-base"
                  >
                    <Icon icon="lucide:pencil" className="w-4 h-4" />
                    제목 수정
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={async () => {
                      setMenuOpen(false);
                      try {
                        await deleteConversation(conversationId);
                      } catch {
                        alert(
                          "대화를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.",
                        );
                      }
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 rounded-lg text-status-error hover:bg-rising-bg disabled:opacity-40"
                  >
                    <Icon icon="ph:trash" className="w-4 h-4" />
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {isEmpty ? (
        /* 시작 화면 */
        <div className="flex flex-col items-center flex-1 px-8 overflow-y-auto pt-[18vh]">
          <h1 className="mb-8 text-[26px] font-bold text-[#111] tracking-[-0.01em]">
            어떤 패션 기획을 진행할까요?
          </h1>
          <div className="w-full max-w-[900px]">
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={() => handleSend()}
              disabled={!isEnterprise}
              canSend={canSend}
              placeholder={placeholder}
              tall
            />
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  disabled={isBusy || !isEnterprise}
                  className="text-[13px] px-3.5 py-2 border border-[#E6E6E6] rounded-full bg-white text-[#454749] hover:bg-[#F5F5F5] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 대화 화면 */
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[860px] mx-auto px-8 py-8 flex flex-col gap-5">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-[#8A8A8A]">
                  <Spin />
                  대화를 불러오는 중…
                </div>
              ) : (
                <>
                  <DateDivider at={conv?.createdAt ?? Date.now()} />
                  <AgentThread
                    messages={messages}
                    isLoading={isLoading}
                    loadingStep={loadingStep}
                    onSend={handleSend}
                    sendDisabled={isBusy || !isEnterprise}
                  />
                </>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="flex-shrink-0 bg-white">
            <div className="max-w-[860px] mx-auto px-8 pb-4">
              {/* 연관 질문 */}
              <div className="flex gap-1.5 pt-2 pb-2.5 overflow-x-auto hide-scrollbar">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    disabled={isBusy || !isEnterprise}
                    className="flex-none text-[12.5px] px-3 py-[7px] border border-[#E6E6E6] rounded-full bg-white text-[#111] hover:bg-[#F5F5F5] whitespace-nowrap disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Composer
                value={input}
                onChange={setInput}
                onSubmit={() => handleSend()}
                disabled={!isEnterprise}
                canSend={canSend}
                placeholder={placeholder}
              />
              <p className="mt-2.5 text-center text-[12px] text-[#8A8C8E]">
                출처를 기반으로 정보를 제공합니다. 자세한 내용은 원문을
                확인해주세요.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AgentPage() {
  const {
    activeConversationId,
    conversations,
    openNewConversation,
    loadConversation,
  } = useChatStore((s) => s);
  const exists =
    !!activeConversationId &&
    conversations.some((c) => c.id === activeConversationId);

  // 현재 대화가 없거나(처음·삭제 후) 사라졌으면 새 대화로, 있으면 내용을 불러온다
  useEffect(() => {
    if (!exists) openNewConversation();
    else if (activeConversationId) loadConversation(activeConversationId);
  }, [exists, activeConversationId, openNewConversation, loadConversation]);

  // 왼쪽 대화 기록 패널 — 열고 닫은 상태는 이 브라우저에 기억한다
  const [historyOpen, setHistoryOpen] = useState(() => {
    try {
      return localStorage.getItem(HISTORY_OPEN_KEY) !== "false";
    } catch {
      return true;
    }
  });
  const toggleHistory = () => {
    setHistoryOpen((v) => {
      try {
        localStorage.setItem(HISTORY_OPEN_KEY, String(!v));
      } catch {
        // 저장이 막혀 있어도 화면 전환은 그대로 한다
      }
      return !v;
    });
  };

  return (
    <div className="flex h-full">
      {historyOpen && <AgentHistoryPanel onCollapse={toggleHistory} />}
      <div className="flex-1 min-w-0 h-full">
        {exists && activeConversationId && (
          // 대화가 바뀌면 입력·칩 상태를 새로 시작하도록 key로 다시 그린다
          <ConversationView
            key={activeConversationId}
            conversationId={activeConversationId}
            historyOpen={historyOpen}
            onToggleHistory={toggleHistory}
          />
        )}
      </div>
    </div>
  );
}
