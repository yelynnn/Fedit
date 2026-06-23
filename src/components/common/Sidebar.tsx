import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import { useChatStore } from "@/stores/ChatStore";
import feditLogo from "@/assets/logo/feditLogo.svg";

const TABS_CONFIG = [
  {
    label: "대시보드",
    activeIcon: "material-symbols:dashboard-rounded",
    inactiveIcon: "material-symbols:dashboard-outline-rounded",
  },
  {
    label: "상품 분석",
    activeIcon: "fluent:tag-32-filled",
    inactiveIcon: "fluent:tag-28-regular",
  },
  {
    label: "색상 분석",
    activeIcon: "zondicons:color-palette",
    inactiveIcon: "qlementine-icons:color-swatch-16",
  },
  {
    label: "유형 분석",
    activeIcon: "ph:chart-pie-slice-fill",
    inactiveIcon: "ph:chart-pie-slice",
  },
  {
    label: "패션쇼 분석",
    activeIcon: "ph:dress-fill",
    inactiveIcon: "ph:dress",
  },
];

function ConversationItem({
  title,
  isActive,
  onOpen,
  onRename,
}: {
  id: string;
  title: string;
  isActive: boolean;
  onOpen: () => void;
  onRename: (newTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    else setDraft(title);
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
        ${isActive ? "bg-[#F2F9E9]" : "hover:bg-[#F6F8FA]"}`}
      onClick={() => { if (!editing) onOpen(); }}
    >
      <Icon
        icon="ph:chat-teardrop-text"
        className="w-3.5 h-3.5 text-[#BABCBE] flex-shrink-0"
      />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(title); setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 text-xs text-[#3D3F41] bg-white rounded px-1 py-0.5 outline-none border border-[#BABCBE]"
        />
      ) : (
        <>
          <span className="flex-1 min-w-0 text-xs text-[#3D3F41] truncate">
            {title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDraft(title);
              setEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-[#BABCBE] hover:text-[#3D3F41]"
          >
            <Icon icon="lucide:pencil" className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { selectedTab, setSelectedTab } = useFilterStore((s) => s);
  const {
    conversations,
    activeConversationId,
    openConversation,
    openNewConversation,
    updateTitle,
  } = useChatStore((s) => s);

  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState({ bottom: 0, left: 0 });

  const recentConversations = [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);

  const toggleCollapsed = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("sidebar-collapsed", String(value));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  return (
    <aside
      className={`h-screen bg-white border-r border-[#ECEEF0] flex flex-col transition-all duration-300
        flex-shrink-0 z-40 ${isCollapsed ? "w-[72px]" : "w-[220px]"}`}
    >
      {/* 로고 영역 */}
      <div
        className={`flex items-center px-5 py-6 flex-shrink-0 ${isCollapsed ? "flex-col gap-2" : "justify-between"}`}
      >
        {!isCollapsed ? (
          <>
            <img src={feditLogo} alt="fedit logo" className="h-7" />
            <button
              onClick={() => toggleCollapsed(true)}
              className="p-1 transition-colors rounded hover:bg-gray-100"
            >
              <Icon
                icon="meteor-icons:angles-left"
                className="w-5 h-5 text-[#888A8C]"
              />
            </button>
          </>
        ) : (
          <div
            className="relative flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden bg-black rounded-md cursor-pointer group transition-all duration-200 hover:bg-[#F6F8FA]"
            onClick={() => toggleCollapsed(false)}
          >
            <img
              src="/feditIcon.png"
              alt="Fedit Icon"
              className="object-contain w-full h-full transition-opacity duration-200 rounded-md group-hover:opacity-0"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[2px]">
              <Icon
                icon="lucide:chevrons-right"
                className="w-6 h-6 text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <nav className={`px-2 space-y-2 flex-shrink-0 ${isCollapsed ? "mt-2" : "mt-4"}`}>
        {TABS_CONFIG.map((tab) => {
          const active = selectedTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setSelectedTab(tab.label)}
              className={`w-full flex transition-all duration-200
          ${
            isCollapsed
              ? "flex-col items-center justify-center"
              : "flex-row items-center p-3 gap-4 rounded-lg"
          }
          ${!isCollapsed && active ? "bg-[#F2F9E9] text-[#0B0E0F]" : "text-[#6F7173]"}
        `}
            >
              <div
                className={`flex items-center justify-center transition-colors
    ${
      isCollapsed
        ? `w-12 h-12 rounded-xl ${active ? "bg-[#F2F9E9] text-[#0B0E0F] border border-[#F6F8FA]" : "text-[#BABCBE]"}`
        : `${active ? "text-[#0B0E0F]" : "text-[#BABCBE]"}`
    }
  `}
              >
                <Icon
                  icon={active ? tab.activeIcon : tab.inactiveIcon}
                  className={`${isCollapsed ? "w-7 h-7" : "w-6 h-6"}`}
                />
              </div>

              <span
                className={`font-semibold tracking-tighter whitespace-nowrap
          ${isCollapsed ? "text-[11px] leading-tight mt-1" : "text-base"}
          ${active && isCollapsed ? "text-[#0B0E0F]" : ""}
        `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* FEDI 최근 대화 — 사이드바 펼쳐진 경우에만 표시 */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 mt-4 px-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-semibold text-[#91929D] uppercase tracking-wider">
              FEDI 최근 대화
            </span>
            <button
              onClick={() => openNewConversation()}
              title="새 대화 시작"
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#F6F8FA] transition-colors text-[#BABCBE] hover:text-[#3D3F41]"
            >
              <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentConversations.length === 0 ? (
            <p className="text-[11px] text-[#BABCBE] px-2">대화 내역이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  id={conv.id}
                  title={conv.title}
                  isActive={conv.id === activeConversationId}
                  onOpen={() => openConversation(conv.id)}
                  onRename={(newTitle) => updateTitle(conv.id, newTitle)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* collapsed 상태면 flex-1 spacer */}
      {isCollapsed && <div className="flex-1" />}

      {/* 설정 버튼 */}
      <div ref={settingsRef} className="flex-shrink-0">
        <div className="p-2 border-t border-[#ECEEF0]">
          <button
            ref={settingsButtonRef}
            onClick={() => {
              if (settingsButtonRef.current) {
                const rect = settingsButtonRef.current.getBoundingClientRect();
                setPopupPos({
                  bottom: window.innerHeight - rect.top + 8,
                  left: rect.left,
                });
              }
              setSettingsOpen((prev) => !prev);
            }}
            className={`w-full flex items-center rounded-xl transition-colors
              ${settingsOpen ? "bg-[#F2F9E9] text-[#0B0E0F]" : "text-[#6F7173] hover:bg-[#F6F8FA]"}
              ${isCollapsed ? "flex-col justify-center py-4 gap-1" : "px-4 py-3 gap-3"}`}
          >
            <Icon
              icon="material-symbols:settings-outline"
              className="w-6 h-6"
            />
            <span
              className={`font-semibold ${isCollapsed ? "text-[10px]" : "text-base"}`}
            >
              설정
            </span>
          </button>
        </div>

        {settingsOpen && (
          <div
            className="fixed z-[100] w-45 bg-white border border-[#ECEEF0] rounded-xl shadow-xl overflow-hidden"
            style={{ bottom: popupPos.bottom, left: popupPos.left }}
          >
            <button
              onClick={() => {
                setSelectedTab("설정");
                setSettingsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#3D3F41] hover:bg-[#F6F8FA] transition-colors"
            >
              <Icon
                icon="material-symbols:settings-outline"
                className="w-4 h-4"
              />
              설정
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#F04438] hover:bg-[#FFF5F4] transition-colors"
            >
              <Icon icon="ph:sign-out" className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
