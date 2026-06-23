import { useState } from "react";
import { Icon } from "@iconify/react";
import { useFilterStore } from "@/stores/FilterStore";
import { useChatStore } from "@/stores/ChatStore";

type Section = "계정" | "구독" | "사용가이드" | "FAQ" | "알림" | "앱정보" | "FEDI대화";

const NAV_GROUPS = [
  {
    title: "계정 및 구독",
    items: [
      { id: "계정" as Section, label: "내 계정" },
      { id: "구독" as Section, label: "구독 관리" },
    ],
  },
  {
    title: "AI 에이전트",
    items: [
      { id: "FEDI대화" as Section, label: "FEDI 대화 목록" },
      { id: "사용가이드" as Section, label: "AI 사용 가이드" },
    ],
  },
  {
    title: "고객지원 및 정보",
    items: [
      { id: "FAQ" as Section, label: "FAQ / 1:1 문의" },
      { id: "알림" as Section, label: "알림 설정" },
      { id: "앱정보" as Section, label: "앱 정보" },
    ],
  },
];

type Plan = "Free" | "Basic" | "Pro";
const CURRENT_PLAN: Plan = "Basic";

function SectionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold text-[#91929D] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="border border-[#ECEEF0] rounded-xl px-5 divide-y divide-[#ECEEF0]">
        {children}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 overflow-hidden ${value ? "bg-[#242628]" : "bg-[#ECEEF0]"}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { setSelectedTab } = useFilterStore((s) => s);
  const {
    conversations,
    activeConversationId,
    openConversation,
    updateTitle,
    deleteConversation,
  } = useChatStore((s) => s);

  const [active, setActive] = useState<Section>("계정");
  const [aiNotif, setAiNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [withdrawStep, setWithdrawStep] = useState<null | "reason" | "confirm">(
    null,
  );
  const [withdrawReasons, setWithdrawReasons] = useState<string[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  const toggleReason = (r: string) =>
    setWithdrawReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <aside className="w-[220px] shrink-0 border-r border-[#ECEEF0] py-8 px-4 overflow-y-auto">
        <button
          onClick={() => setSelectedTab("대시보드")}
          className="flex items-center gap-2 text-sm font-semibold text-[#6F7173] hover:text-[#242628] mb-6 transition-colors"
        >
          <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          돌아가기
        </button>
        <h2 className="text-lg font-bold text-[#0B0E0F] mb-5 px-2">설정</h2>

        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="text-[11px] font-semibold text-[#91929D] uppercase tracking-wider px-2 mb-1.5">
              {group.title}
            </p>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors mb-0.5 ${
                  active === item.id
                    ? "bg-[#F2F9E9] text-[#0B0E0F]"
                    : "text-[#6F7173] hover:bg-[#F6F8FA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Right content */}
      <main className="flex-1 overflow-y-auto px-12 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* ── 내 계정 ── */}
        {active === "계정" && (
          <div className="max-w-[580px]">
            <h1 className="text-2xl font-bold text-[#0B0E0F] mb-8">내 계정</h1>

            <SectionBox title="이메일">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-[#3D3F41]">
                  example@fedit.com
                </span>
                <button className="text-sm font-semibold text-[#3E7EFF] hover:underline">
                  변경
                </button>
              </div>
            </SectionBox>

            <SectionBox title="비밀번호">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-[#3D3F41] tracking-widest">
                  ••••••••
                </span>
                <button className="text-sm font-semibold text-[#3E7EFF] hover:underline">
                  변경
                </button>
              </div>
            </SectionBox>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#ECEEF0] rounded-xl text-sm font-semibold text-[#3D3F41] hover:bg-[#F6F8FA] transition-colors"
            >
              <Icon icon="ph:sign-out" className="w-4 h-4" />
              로그아웃
            </button>

            <div className="mt-16 pt-5 border-t border-[#ECEEF0]">
              <button
                onClick={() => {
                  setWithdrawReasons([]);
                  setWithdrawStep("reason");
                }}
                className="text-xs text-[#91929D] hover:text-[#F04438] underline transition-colors"
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        )}

        {/* ── 구독 관리 ── */}
        {active === "구독" && (
          <div className="max-w-[760px]">
            <h1 className="text-2xl font-bold text-[#0B0E0F] mb-2">
              구독 관리
            </h1>
            <p className="text-sm text-[#91929D] mb-8">
              현재 이용 중인 요금제:{" "}
              <span className="font-semibold text-[#3E7EFF]">
                {CURRENT_PLAN}
              </span>
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                {
                  plan: "Free" as const,
                  label: "무료 체험",
                  price: "0원",
                  sub: "14일 · Basic 기능 일부 사용",
                  features: [
                    "14일 무료 체험",
                    "모니터링 (필터 항목별 2개·무신사 한정)",
                    "키워드 분석 제공",
                    "화면 캡처 미지원",
                    "Basic 기능 일부 체험",
                  ],
                  btnLabel: "무료로 체험하기",
                  btnStyle: "bg-[#0B0E0F] text-white hover:bg-black",
                },
                {
                  plan: "Basic" as const,
                  label: "Basic",
                  price: "₩9,900/mo",
                  sub: "대형 패션 브랜드와 리테일을 위한 플랜",
                  features: [
                    "20인 사용 가능",
                    "브랜드별 커스텀 분석",
                    "API 연동 재고 분석",
                    "전담 데이터 매니저 상주",
                    "CSV/PDF 내보내기 가능",
                    "브랜드 패션 기획 에이전트 제공",
                  ],
                  btnLabel: "Basic 플랜 문의",
                  btnStyle: "bg-[#0B0E0F] text-white hover:bg-black",
                },
                {
                  plan: "Pro" as const,
                  label: "Pro",
                  price: "₩29,000/mo",
                  sub: "대형 패션 브랜드와 리테일을 위한 플랜",
                  features: [
                    "20인 사용 가능",
                    "모든 Basic 기능 사용 가능",
                    "엑셀 다운로드 무제한",
                    "트렌드 리포트, 데이터 일괄 내보내기",
                    "CSV/PDF 내보내기 가능",
                    "브랜드 패션 기획 에이전트 제공",
                  ],
                  btnLabel: "Pro 플랜 문의",
                  btnStyle: "bg-[#0B0E0F] text-white hover:bg-black",
                },
              ].map(
                ({ plan, label, price, sub, features, btnLabel, btnStyle }) => {
                  const isCurrent = plan === CURRENT_PLAN;
                  return (
                    <div
                      key={plan}
                      className={`flex flex-col rounded-2xl p-5 border-2 ${isCurrent ? "border-[#3E7EFF] bg-white" : "border-[#ECEEF0] bg-[#F8F9FA]"}`}
                    >
                      <p className="text-sm text-[#6F7173] mb-1">{label}</p>
                      <p className="text-2xl font-bold text-[#0B0E0F] mb-1">
                        {price}
                      </p>
                      <p className="text-xs text-[#91929D] mb-4 leading-relaxed">
                        {sub}
                      </p>
                      <ul className="flex flex-col flex-1 gap-2 mb-5">
                        {features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-xs text-[#3D3F41]"
                          >
                            <Icon
                              icon="ph:check"
                              className="w-3.5 h-3.5 text-[#3D3F41] flex-shrink-0 mt-0.5"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        disabled={isCurrent}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isCurrent
                            ? "bg-[#E4E4E4] text-[#91929D] cursor-default"
                            : `${btnStyle} cursor-pointer`
                        }`}
                      >
                        {isCurrent ? "현재 요금제" : btnLabel}
                      </button>
                    </div>
                  );
                },
              )}
            </div>

            <div className="flex items-center gap-3 pt-5 border-t border-[#ECEEF0]">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-[#ECEEF0] rounded-xl text-sm font-semibold text-[#3D3F41] hover:bg-[#F6F8FA] transition-colors">
                <Icon icon="ph:credit-card" className="w-4 h-4" />
                결제 수단 변경
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-[#FEE4E2] rounded-xl text-sm font-semibold text-[#F04438] hover:bg-[#FFF5F4] transition-colors">
                <Icon icon="ph:x-circle" className="w-4 h-4" />
                구독 해지
              </button>
            </div>
          </div>
        )}

        {/* ── AI 사용 가이드 ── */}
        {active === "사용가이드" && (
          <div className="max-w-[680px]">
            <h1 className="text-2xl font-bold text-[#0B0E0F] mb-8">
              AI 사용 가이드
            </h1>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: "ph:chart-line-up-bold",
                  title: "트렌드 지수 분석",
                  desc: "실시간 판매·조회 데이터를 기반으로 상품의 트렌드 지수를 자동 산출합니다.",
                },
                {
                  icon: "ph:magnifying-glass-bold",
                  title: "상품 AI 개요",
                  desc: "색상, 소재, 핏 등 스타일 정보를 AI가 자동으로 요약합니다.",
                },
                {
                  icon: "ph:dress-bold",
                  title: "패션쇼 분석",
                  desc: "글로벌 런웨이 컬렉션을 브랜드·시즌별로 비교 분석합니다.",
                },
                {
                  icon: "ph:palette-bold",
                  title: "색상 트렌드",
                  desc: "시즌별 주요 컬러 팔레트와 트렌드 변화를 한눈에 파악합니다.",
                },
                {
                  icon: "ph:tag-bold",
                  title: "상품 유형 분석",
                  desc: "카테고리·성별별 상품 비중과 유형 트렌드를 분석합니다.",
                },
                {
                  icon: "ph:bookmark-simple-bold",
                  title: "내 보드",
                  desc: "관심 상품을 보드별로 저장하고 관리합니다.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-5 border border-[#ECEEF0] rounded-xl hover:border-[#3E7EFF] transition-colors group"
                >
                  <div className="w-10 h-10 bg-[#EBF2FF] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#D6E8FF] transition-colors">
                    <Icon icon={item.icon} className="w-5 h-5 text-[#3E7EFF]" />
                  </div>
                  <p className="font-bold text-[#0B0E0F] mb-1.5">
                    {item.title}
                  </p>
                  <p className="text-sm text-[#6F7173] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {active === "FAQ" && (
          <div className="max-w-[580px]">
            <h1 className="text-2xl font-bold text-[#0B0E0F] mb-8">
              FAQ / 1:1 문의
            </h1>

            <SectionBox title="자주 묻는 질문">
              {[
                {
                  q: "AI가 분석한 상품 정보는 어떻게 수집되나요?",
                  a: "Fedit AI는 주요 패션 플랫폼의 공개 데이터를 기반으로 상품 정보를 분석합니다. 저작권에 민감한 이미지는 직접 수집하지 않습니다.",
                },
                {
                  q: "결제가 잘못 청구된 것 같아요.",
                  a: "결제 관련 문의는 1:1 문의하기를 통해 접수해 주세요. 영업일 기준 1~2일 내 처리해 드립니다.",
                },
                {
                  q: "요금제는 어떻게 변경하나요?",
                  a: "구독 관리 섹션에서 원하는 요금제를 선택해 변경할 수 있습니다. 업그레이드는 즉시 적용, 다운그레이드는 다음 결제일부터 적용됩니다.",
                },
                {
                  q: "저장한 보드 데이터는 어디에 보관되나요?",
                  a: "현재 내 보드 데이터는 사용 중인 브라우저의 로컬 스토리지에 저장됩니다.",
                },
              ].map((item, i) => (
                <div key={i} className="py-4">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full gap-4 text-left"
                  >
                    <span className="text-sm font-semibold text-[#0B0E0F]">
                      {item.q}
                    </span>
                    <Icon
                      icon={openFaq === i ? "ph:caret-up" : "ph:caret-down"}
                      className="w-4 h-4 text-[#91929D] flex-shrink-0"
                    />
                  </button>
                  {openFaq === i && (
                    <p className="text-sm text-[#6F7173] mt-2 leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </SectionBox>

            <p className="text-sm text-[#6F7173] mb-3">
              해결되지 않는 문제가 있으신가요?
            </p>
            <a
              href="mailto:support@fedit.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#242628] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors"
            >
              <Icon icon="ph:envelope" className="w-4 h-4" />
              1:1 문의하기
            </a>
          </div>
        )}

        {/* ── 알림 설정 ── */}
        {active === "알림" && (
          <div className="max-w-[580px]">
            <h1 className="text-2xl font-bold text-[#0B0E0F] mb-8">
              알림 설정
            </h1>

            <SectionBox title="알림">
              {[
                {
                  label: "AI 생성 완료 알림",
                  desc: "AI 분석이 완료되면 알림을 받습니다.",
                  value: aiNotif,
                  toggle: () => setAiNotif((v) => !v),
                },
                {
                  label: "마케팅 알림",
                  desc: "새로운 기능 및 이벤트 소식을 받습니다.",
                  value: marketingNotif,
                  toggle: () => setMarketingNotif((v) => !v),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0B0E0F]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#91929D] mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle value={item.value} onChange={item.toggle} />
                </div>
              ))}
            </SectionBox>
          </div>
        )}

        {/* ── FEDI 대화 목록 ── */}
        {active === "FEDI대화" && (() => {
          const filtered = [...conversations]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .filter((c) =>
              c.title.toLowerCase().includes(chatSearch.toLowerCase()),
            );

          const handleOpen = (id: string) => {
            openConversation(id);
            setSelectedTab("대시보드");
          };

          const handleRename = (id: string) => {
            const trimmed = editingTitle.trim();
            if (trimmed) updateTitle(id, trimmed);
            setEditingConvId(null);
            setEditingTitle("");
          };

          return (
            <div className="max-w-[680px]">
              <h1 className="text-2xl font-bold text-[#0B0E0F] mb-2">
                FEDI 대화 목록
              </h1>
              <p className="text-sm text-[#91929D] mb-6">
                총 {conversations.length}개의 대화
              </p>

              {/* 검색 */}
              <div className="flex items-center gap-3 border border-[#ECEEF0] rounded-xl px-4 py-2.5 mb-5 bg-white">
                <Icon icon="ph:magnifying-glass" className="w-4 h-4 text-[#91929D] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="대화 검색..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="flex-1 text-sm outline-none text-[#3D3F41] placeholder-[#BABCBE]"
                />
                {chatSearch && (
                  <button onClick={() => setChatSearch("")} className="text-[#BABCBE] hover:text-[#3D3F41]">
                    <Icon icon="material-symbols:close" className="w-4 h-4" />
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#91929D]">
                  <Icon icon="ph:chat-teardrop-text" className="w-10 h-10 mb-3" />
                  <p className="text-sm font-medium">
                    {chatSearch ? "검색 결과가 없습니다" : "대화 내역이 없습니다"}
                  </p>
                </div>
              ) : (
                <div className="border border-[#ECEEF0] rounded-xl divide-y divide-[#ECEEF0] overflow-hidden">
                  {filtered.map((conv) => {
                    const isEditing = editingConvId === conv.id;
                    const lastMsg = conv.messages[conv.messages.length - 1];
                    const date = new Date(conv.updatedAt);
                    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

                    return (
                      <div
                        key={conv.id}
                        className={`flex items-center gap-3 px-5 py-4 group hover:bg-[#F6F8FA] transition-colors ${activeConversationId === conv.id ? "bg-[#F2F9E9]" : ""}`}
                      >
                        <Icon icon="ph:chat-teardrop-text" className="w-4 h-4 text-[#BABCBE] flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => handleRename(conv.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename(conv.id);
                                if (e.key === "Escape") {
                                  setEditingConvId(null);
                                  setEditingTitle("");
                                }
                              }}
                              className="w-full text-sm font-semibold text-[#0B0E0F] outline-none border-b border-[#3E7EFF] bg-transparent pb-0.5"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-[#0B0E0F] truncate">
                              {conv.title}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#91929D]">{dateStr}</span>
                            {lastMsg && (
                              <>
                                <span className="text-xs text-[#BABCBE]">·</span>
                                <span className="text-xs text-[#91929D] truncate">
                                  {lastMsg.content.slice(0, 40)}{lastMsg.content.length > 40 ? "..." : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleOpen(conv.id)}
                            title="열기"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#6F7173] hover:text-[#0B0E0F] transition-colors"
                          >
                            <Icon icon="lucide:external-link" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingConvId(conv.id);
                              setEditingTitle(conv.title);
                            }}
                            title="제목 수정"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#6F7173] hover:text-[#0B0E0F] transition-colors"
                          >
                            <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteConversation(conv.id)}
                            title="삭제"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#BABCBE] hover:text-[#F04438] transition-colors"
                          >
                            <Icon icon="ph:trash" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 앱 정보 ── */}
        {active === "앱정보" && (
          <div className="max-w-[580px]">
            <h1 className="text-2xl font-bold text-[#0B0E0F] mb-8">앱 정보</h1>

            <SectionBox title="법적 고지">
              {[
                { label: "이용약관", href: "/terms" },
                { label: "개인정보 처리방침", href: "/privacy" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between py-4 text-sm font-semibold text-[#3D3F41] hover:text-[#0B0E0F] transition-colors"
                >
                  {item.label}
                  <Icon
                    icon="ph:caret-right"
                    className="w-4 h-4 text-[#91929D]"
                  />
                </a>
              ))}
            </SectionBox>

            <SectionBox title="버전 정보">
              <div className="py-3.5 text-sm text-[#6F7173]">Fedit v1.0.0</div>
            </SectionBox>
          </div>
        )}
      </main>

      {/* ── 회원 탈퇴 모달 ── */}
      {withdrawStep && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setWithdrawStep(null)}
          />

          {withdrawStep === "reason" && (
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-[440px] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#242628]">
                  탈퇴 사유 선택
                </h2>
                <button onClick={() => setWithdrawStep(null)}>
                  <Icon
                    icon="material-symbols:close"
                    className="w-6 h-6 text-[#91929D] hover:text-black transition-colors"
                  />
                </button>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                {[
                  "서비스 사용 빈도가 낮아요",
                  "원하는 기능이 없어요",
                  "요금이 부담돼요",
                  "다른 서비스를 이용할 예정이에요",
                  "기타",
                ].map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => toggleReason(r)}
                  >
                    <div
                      className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${withdrawReasons.includes(r) ? "bg-[#4A4C4E] border-[#4A4C4E]" : "border-[#D1D3D9]"}`}
                    >
                      {withdrawReasons.includes(r) && (
                        <Icon
                          icon="lucide:check"
                          className="w-4 h-4 text-white"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-[#242628]">
                      {r}
                    </span>
                  </label>
                ))}
              </div>

              <p className="text-xs text-[#91929D] leading-relaxed mb-5">
                인터뷰 참여 시 지난 구독 요금을 환불해 드립니다.
                <a
                  href="https://calendly.com/team-mify/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3E7EFF] underline ml-1"
                >
                  인터뷰 일정 예약하기 →
                </a>
              </p>

              <button
                onClick={() => {
                  if (withdrawReasons.length > 0) setWithdrawStep("confirm");
                }}
                disabled={withdrawReasons.length === 0}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  withdrawReasons.length > 0
                    ? "bg-[#F04438] text-white hover:bg-red-600 cursor-pointer"
                    : "bg-[#F6F8FA] text-[#A1A3A5] cursor-not-allowed"
                }`}
              >
                최종 탈퇴
              </button>
            </div>
          )}

          {withdrawStep === "confirm" && (
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-[380px] shadow-xl text-center">
              <div className="w-14 h-14 bg-[#FEE4E2] rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="ph:warning" className="w-7 h-7 text-[#F04438]" />
              </div>
              <h2 className="text-xl font-bold text-[#0B0E0F] mb-2">
                정말 탈퇴하시겠어요?
              </h2>
              <p className="text-sm text-[#6F7173] mb-8 leading-relaxed">
                탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setWithdrawStep(null)}
                  className="flex-1 py-3 border border-[#ECEEF0] rounded-xl text-sm font-semibold text-[#3D3F41] hover:bg-[#F6F8FA] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/login";
                  }}
                  className="flex-1 py-3 bg-[#F04438] text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  탈퇴하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
