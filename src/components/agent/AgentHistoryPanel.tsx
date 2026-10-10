import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useChatStore } from "@/stores/ChatStore";
import {
  formatConversationTime,
  groupConversationsByDate,
  visibleConversations,
} from "@/lib/chatHistory";

// 전체화면 FEDI Agent 왼쪽 대화 기록 패널(ChatGPT·Claude 방식).
// 목록은 서버(/chat/conversations) 기준이고, 고르면 오른쪽에서 이어서 채팅한다.

interface Props {
  onCollapse: () => void;
}

export default function AgentHistoryPanel({ onCollapse }: Props) {
  const {
    conversations,
    activeConversationId,
    listLoading,
    fetchConversations,
    openConversation,
    openNewConversation,
    updateTitle,
    deleteConversation,
    pendingConversationId,
  } = useChatStore((s) => s);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  // 패널을 열 때 서버 목록으로 맞춘다(다른 기기에서 한 대화 포함)
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const groups = groupConversationsByDate(
    [...visibleConversations(conversations)].sort((a, b) => b.updatedAt - a.updatedAt),
  );

  const commitTitle = (id: string) => {
    if (titleDraft.trim()) updateTitle(id, titleDraft);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id);
    } catch {
      alert("대화를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <aside className="flex flex-col flex-shrink-0 w-[260px] h-full bg-[#FAFAFA] border-r border-line-divider">
      <div className="flex items-center justify-between px-4 h-15 flex-shrink-0">
        <span className="text-[14px] font-semibold text-[#242628]">대화 기록</span>
        <button
          type="button"
          onClick={onCollapse}
          title="기록 접기"
          className="grid w-8 h-8 rounded-lg place-items-center text-[#6F7173] hover:bg-[rgba(11,14,15,0.05)]"
        >
          <Icon icon="ph:caret-double-left" className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => openNewConversation()}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white border border-[#E6E6E6] text-[13px] font-medium text-[#242628] hover:bg-[#F5F5F5]"
        >
          <Icon icon="ph:plus" className="w-4 h-4" />새 대화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-2 pb-4">
        {groups.length === 0 ? (
          <p className="px-3 py-8 text-center text-[12.5px] text-[#A6A8AA]">
            {listLoading ? "불러오는 중…" : "아직 대화가 없어요"}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 pt-2 pb-1 text-[11.5px] font-semibold text-[#8A8C8E]">{group.label}</p>
              {group.items.map((c) => {
                const active = c.id === activeConversationId;
                return (
                  <div
                    key={c.id}
                    onClick={() => editingId !== c.id && openConversation(c.id)}
                    className={`group flex items-center gap-1 px-3 h-9 rounded-lg cursor-pointer transition-colors ${
                      active ? "bg-[#EDEDED]" : "hover:bg-[rgba(11,14,15,0.05)]"
                    }`}
                  >
                    {editingId === c.id ? (
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={() => commitTitle(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.nativeEvent.isComposing) commitTitle(c.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 text-[13px] bg-white border-b border-[#9A9C9E] outline-none"
                      />
                    ) : (
                      <>
                        <span
                          title={c.title}
                          className={`flex-1 min-w-0 truncate text-[13px] ${
                            active ? "font-semibold text-[#111]" : "text-[#454749]"
                          }`}
                        >
                          {c.title}
                        </span>
                        {c.id === pendingConversationId ? (
                          <Icon icon="mdi:loading" className="flex-shrink-0 w-3.5 h-3.5 animate-spin text-[#8A8C8E]" />
                        ) : (
                          <span className="flex-shrink-0 text-[11px] text-[#A6A8AA] group-hover:hidden">
                            {formatConversationTime(c.updatedAt)}
                          </span>
                        )}
                        <div
                          className="items-center flex-shrink-0 hidden gap-0.5 group-hover:flex"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="제목 수정"
                            onClick={() => {
                              setTitleDraft(c.title);
                              setEditingId(c.id);
                            }}
                            className="grid w-6 h-6 rounded place-items-center text-[#8A8C8E] hover:bg-white hover:text-[#111]"
                          >
                            <Icon icon="lucide:pencil" className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="삭제"
                            disabled={c.id === pendingConversationId}
                            onClick={() => handleDelete(c.id)}
                            className="grid w-6 h-6 rounded place-items-center text-[#8A8C8E] hover:bg-white hover:text-status-error disabled:opacity-40"
                          >
                            <Icon icon="ph:trash" className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
