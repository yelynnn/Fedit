import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import { useChatStore } from "@/stores/ChatStore";
import { useUIStore } from "@/stores/UIStore";
import { useUserStore } from "@/stores/UserStore";
import feditLogo from "@/assets/logo/feditLogo.svg";
import snbLogoButton from "@/assets/logo/SNB_Logo button.svg";
import profileIcon from "@/assets/etc/profileIcon.svg";
import foldIcon from "@/assets/etc/fonldIcon.svg";
import dashboardIcon from "@/assets/etc/dashboardIcon.svg";
import analysisIcon from "@/assets/etc/analysisIcon.svg";
import colorIcon from "@/assets/etc/colorIcon.svg";
import categoryIcon from "@/assets/etc/categoryIcon.svg";
import runwayIcon from "@/assets/etc/runwayIcon.svg";

const TABS_CONFIG = [
  { label: "실시간 랭킹", icon: dashboardIcon },
  { label: "상품 분석", icon: analysisIcon },
  { label: "색상 분석", icon: colorIcon },
  { label: "유형 분석", icon: categoryIcon },
  { label: "패션쇼 분석", icon: runwayIcon },
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
        ${isActive ? "bg-brand-subtle" : "hover:bg-surface-base"}`}
      onClick={() => {
        if (!editing) onOpen();
      }}
    >
      <Icon
        icon="ph:chat-teardrop-text"
        className="w-3.5 h-3.5 text-icon-alt flex-shrink-0"
      />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(title);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 text-xs text-tx-neutral bg-white rounded px-1 py-0.5 outline-none border border-line-neutral"
        />
      ) : (
        <>
          <span className="flex-1 min-w-0 text-xs truncate text-tx-neutral">
            {title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDraft(title);
              setEditing(true);
            }}
            className="flex-shrink-0 transition-opacity opacity-0 group-hover:opacity-100 text-icon-alt hover:text-tx-neutral"
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
  const { openSettingsModal } = useUIStore();

  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true",
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState({ bottom: 0, left: 0 });

  const { name, email, fetchMe } = useUserStore((s) => s);
  const userName = name || "사용자명";
  const userEmail = email;

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

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
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    useUserStore.getState().reset();
    window.location.href = "/login";
  };

  const handleProfileButtonClick = () => {
    if (profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      setPopupPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
    setProfileOpen((prev) => !prev);
  };

  return (
    <aside
      className={`h-screen bg-white border-r border-line-divider flex flex-col transition-[width] duration-200 ease-out
        flex-shrink-0 z-40 ${isCollapsed ? "w-[72px]" : "w-55"}`}
    >
      {/* 로고 영역 */}
      <div
        className={`flex items-center px-5 pt-3 pb-4 flex-shrink-0 ${isCollapsed ? "flex-col gap-2" : "justify-between"}`}
      >
        {!isCollapsed ? (
          <>
            <img src={feditLogo} alt="fedit logo" className="h-[22px]" />
            <button
              onClick={() => toggleCollapsed(true)}
              className="p-1 transition-colors rounded-lg hover:bg-surface-base active:bg-line-divider"
            >
              <img src={foldIcon} alt="사이드바 접기" className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div
            className="relative flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-xl bg-white border border-line-alt cursor-pointer group"
            onClick={() => toggleCollapsed(false)}
          >
            <img
              src={snbLogoButton}
              alt="Fedit"
              className="absolute inset-0 w-9 h-9 transition-opacity duration-150 group-hover:opacity-0"
            />
            <img
              src={foldIcon}
              alt="사이드바 펼치기"
              className="absolute w-6 h-6 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            />
          </div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <nav
        className={`px-2 flex-shrink-0 ${isCollapsed ? "space-y-4" : ""}`}
      >
        {TABS_CONFIG.map((tab) => {
          const active = selectedTab === tab.label;
          const stateClasses = active
            ? "bg-brand-subtle hover:bg-brand-subtle-hover"
            : "hover:bg-[rgba(11,14,15,0.05)] active:bg-[rgba(11,14,15,0.08)]";
          return (
            <button
              key={tab.label}
              onClick={() => setSelectedTab(tab.label)}
              className={`w-full flex transition-colors duration-150
          ${
            isCollapsed
              ? "flex-col items-center justify-center"
              : `flex-row items-center h-10 p-2 gap-3 rounded-lg self-stretch ${stateClasses}`
          }
        `}
            >
              <div
                className={`flex items-center justify-center transition-colors
    ${
      isCollapsed
        ? `w-10 h-10 rounded-lg ${stateClasses} ${active ? "text-tx-strong" : "text-icon-alt"}`
        : `${active ? "text-tx-strong" : "text-icon-alt"}`
    }
  `}
              >
                <img
                  src={tab.icon}
                  alt={tab.label}
                  className="w-[18px] h-[18px]"
                />
              </div>

              <span
                className={`whitespace-nowrap transition-opacity duration-150
          ${isCollapsed ? "type-body-xsmall text-tx-neutral mt-1" : "type-body-small text-tx-default"}
          ${active ? "text-tx-strong" : ""}
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
        <div className="flex flex-col flex-1 min-h-0 px-2 mt-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-semibold text-tx-assistive uppercase tracking-wider">
              FEDI 최근 대화
            </span>
            <button
              onClick={() => openNewConversation()}
              title="새 대화 시작"
              className="flex items-center justify-center w-5 h-5 transition-colors rounded hover:bg-surface-base text-icon-alt hover:text-tx-neutral"
            >
              <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentConversations.length === 0 ? (
            <p className="text-[11px] text-icon-alt px-2">
              대화 내역이 없습니다
            </p>
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

      {/* 가이드 / 의견보내기 — 펼쳐진 상태에서만 표시 */}
      {!isCollapsed && (
        <div className="flex-shrink-0 px-2 pb-2">
          <div className="flex items-center rounded-lg bg-[#F9FAFB] overflow-hidden">
            <button
              onClick={() => openSettingsModal("사용가이드")}
              className="flex-1 py-3 text-center text-[12px] font-semibold leading-[133%] text-[#6F7173] hover:text-tx-default transition-colors"
            >
              가이드
            </button>
            <div className="flex-shrink-0 w-px h-4 bg-line-divider" />
            <button className="flex-1 py-3 text-center text-[12px] font-semibold leading-[133%] text-[#6F7173] hover:text-tx-default transition-colors">
              의견보내기
            </button>
          </div>
        </div>
      )}

      {/* 프로필 버튼 */}
      <div ref={profileRef} className="flex-shrink-0">
        <div className="p-2 border-t border-line-divider">
          <button
            ref={profileButtonRef}
            onClick={handleProfileButtonClick}
            className={`w-full flex items-center gap-2 rounded-xl transition-colors
              ${profileOpen ? "bg-surface-base" : "hover:bg-surface-base"}
              ${isCollapsed ? "justify-center py-2" : "px-2 py-2"}`}
          >
            <img
              src={profileIcon}
              alt=""
              className="flex-shrink-0"
              style={{ width: 34, height: 34, aspectRatio: "1/1" }}
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate type-body-small text-tx-neutral">
                  {userName}
                </p>
                <p className="truncate type-body-xsmall text-tx-assistive">
                  {userEmail}
                </p>
              </div>
            )}
          </button>
        </div>

        {profileOpen && (
          <div
            className="fixed z-[100] flex flex-col items-center gap-0 p-2 bg-white border border-line-divider rounded-xl shadow-xl"
            style={{ width: 250, bottom: popupPos.bottom, left: popupPos.left }}
          >
            {/* 유저 정보 */}
            <div className="flex items-center w-full gap-2 px-2 py-2">
              <img
                src={profileIcon}
                alt=""
                className="flex-shrink-0"
                style={{ width: 34, height: 34, aspectRatio: "1/1" }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate type-body-small text-tx-neutral">
                  {userName}
                </p>
                <p className="truncate type-body-xsmall text-tx-assistive">
                  {userEmail}
                </p>
              </div>
            </div>

            <div className="w-full h-px my-2 bg-line-divider" />

            {/* 메뉴 항목 */}
            <button
              onClick={() => {
                openSettingsModal("구독");
                setProfileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[#242628] text-[14px] font-medium leading-[143%] tracking-[-0.07px] hover:bg-surface-base"
            >
              <Icon icon="ph:sparkle" className="flex-shrink-0 w-5 h-5" />
              요금제 업그레이드
            </button>
            <button
              onClick={() => {
                openSettingsModal("내정보");
                setProfileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[#242628] text-[14px] font-medium leading-[143%] tracking-[-0.07px] hover:bg-surface-base"
            >
              <Icon icon="ph:user-circle" className="flex-shrink-0 w-5 h-5" />
              프로필
            </button>
            <button
              onClick={() => {
                openSettingsModal("내정보");
                setProfileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[#242628] text-[14px] font-medium leading-[143%] tracking-[-0.07px] hover:bg-surface-base"
            >
              <Icon
                icon="material-symbols:settings-outline"
                className="flex-shrink-0 w-5 h-5"
              />
              설정
            </button>

            <div className="w-full h-px my-2 bg-line-divider" />
            <button
              onClick={() => {
                openSettingsModal("사용가이드");
                setProfileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[#242628] text-[14px] font-medium leading-[143%] tracking-[-0.07px] hover:bg-surface-base"
            >
              <Icon icon="ph:question" className="flex-shrink-0 w-5 h-5" />
              도움말
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[14px] font-medium leading-[143%] tracking-[-0.07px] hover:bg-rising-bg"
            >
              <Icon icon="ph:sign-out" className="flex-shrink-0 w-5 h-5" />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
