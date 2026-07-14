import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useChatStore } from "@/stores/ChatStore";
import { useUIStore } from "@/stores/UIStore";
import { useUserStore } from "@/stores/UserStore";
import {
  GetCustomerKey,
  PostChangePlan,
  PostCancelSubscription,
  type PlanType,
} from "@/apis/BillingAPI";
import { getTossPayments } from "@/lib/toss";
import ChangePasswordModal from "@/components/common/ChangePasswordModal";
import { PostLogout, DeleteWithdraw } from "@/apis/AuthAPI";
import { AI_GUIDE_TOPICS, getGuideTopicsByCategory } from "@/content/aiGuides";
import GuideDetailView from "@/components/settings/guide/GuideDetailView";
import GuideCard from "@/components/settings/GuideCard";
import { GUIDE_CATEGORIES, type GuideCategory } from "@/types/guide";
import { useSubscriptionStore } from "@/stores/SubscriptionStore";

const GUIDE_TABS: ("전체" | GuideCategory)[] = ["전체", ...GUIDE_CATEGORIES];

type Section = "내정보" | "알림" | "FEDI대화" | "사용가이드" | "FAQ" | "구독";

const PLAN_DEFS: {
  key: "free" | PlanType;
  label: string;
  badge: string | null;
  originalPrice: string | null;
  discount: string | null;
  price: string;
  sub: string;
  features: { ok: boolean; text: string }[];
}[] = [
  {
    key: "free",
    label: "무료 체험",
    badge: null,
    originalPrice: null,
    discount: null,
    price: "0원",
    sub: "7일 · Basic 기능 일부 (브랜드 제한)",
    features: [
      { ok: true, text: "무신사 입점 브랜드 모니터링 제공" },
      { ok: true, text: "플랫폼별 키워드 분석 제공" },
      { ok: false, text: "유형/색상/패션쇼 분석 미지원" },
    ],
  },
  {
    key: "basic",
    label: "Basic",
    badge: "추천",
    originalPrice: "29,000원",
    discount: "34% 할인",
    price: "19,000원",
    sub: "/월",
    features: [
      { ok: true, text: "기본 무신사 입점 브랜드 외 브랜드 10개 추가 모니터링" },
      { ok: true, text: "플랫폼별 키워드 분석 제공" },
      { ok: true, text: "엑셀 다운로드 월 3회" },
      { ok: true, text: "추가 제안 브랜드 제안 문의 가능" },
      { ok: false, text: "유형/색상/패션쇼 분석 미지원" },
    ],
  },
  {
    key: "pro",
    label: "Pro",
    badge: null,
    originalPrice: "79,000원",
    discount: "25% 할인",
    price: "59,000원",
    sub: "/월",
    features: [
      { ok: true, text: "모든 브랜드 모니터링 제공" },
      { ok: true, text: "모든 Basic 기능 포함" },
      { ok: true, text: "엑셀 다운로드 무제한" },
      { ok: true, text: "유형/색상/패션쇼 분석 지원" },
      { ok: true, text: "기업 트렌드 리포트 제공 (월말 추가 제공)" },
      { ok: true, text: "자사 맞춤형 AI Agent 제공" },
    ],
  },
];

const PLAN_RANK: Record<"free" | PlanType, number> = { free: 0, basic: 1, pro: 2 };

// "Basic으로", "Pro로" — 플랜명 발음(받침 유무)에 맞춘 조사
const PLAN_PARTICLE: Record<PlanType, string> = { basic: "으로", pro: "로" };

const NAV_GROUPS: {
  title: string;
  items: { id: Section; label: string; icon: string }[];
}[] = [
  {
    title: "설정",
    items: [
      { id: "내정보", label: "내 정보", icon: "ph:user-circle" },
      { id: "알림", label: "알림", icon: "ph:bell" },
    ],
  },
  {
    title: "에이전트",
    items: [
      {
        id: "FEDI대화",
        label: "FEDI 채팅 목록",
        icon: "mynaui:chat-messages",
      },
      { id: "사용가이드", label: "AI 사용 가이드", icon: "ph:device-tablet" },
    ],
  },
  {
    title: "고객 지원",
    items: [{ id: "FAQ", label: "FAQ / 1:1 문의", icon: "ph:question" }],
  },
  {
    title: "사용 권한 및 청구",
    items: [{ id: "구독", label: "구독 관리", icon: "ph:credit-card" }],
  },
];

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 overflow-hidden ${value ? "bg-[#111827]" : "bg-line-divider"}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { settingsModalTab, closeSettingsModal } = useUIStore();
  const {
    conversations,
    activeConversationId,
    openConversation,
    updateTitle,
    deleteConversation,
  } = useChatStore((s) => s);

  const [active, setActive] = useState<Section>(
    () => (settingsModalTab as Section) || "내정보",
  );
  const [aiNotif, setAiNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [inquiryType, setInquiryType] = useState("요금제·결제 문의");
  const [inquiryContent, setInquiryContent] = useState("");
  const [withdrawStep, setWithdrawStep] = useState<null | "reason" | "confirm">(
    null,
  );
  const [withdrawReasons, setWithdrawReasons] = useState<string[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<"전체" | GuideCategory>(
    "전체",
  );
  const [agreedCancelTerms, setAgreedCancelTerms] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);

  const {
    subscription,
    loaded: subscriptionLoaded,
    fetchSubscription,
    setSubscription,
  } = useSubscriptionStore((s) => s);
  const [billingLoading, setBillingLoading] = useState<PlanType | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const userEmail = useUserStore((s) => s.email);

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPlan: "free" | PlanType = subscription?.plan ?? "free";

  const handleSelectPlan = async (plan: PlanType) => {
    if (plan === currentPlan || billingLoading) return;
    setBillingLoading(plan);
    try {
      if (subscription?.hasBillingKey) {
        const updated = await PostChangePlan(plan);
        setSubscription(updated);
        const label = PLAN_DEFS.find((p) => p.key === plan)?.label ?? plan;
        alert(`${label} 요금제로 변경되었습니다.`);
      } else {
        const customerKey = await GetCustomerKey();
        const tossPayments = await getTossPayments();
        const payment = tossPayments.payment({ customerKey });
        await payment.requestBillingAuth({
          method: "CARD",
          windowTarget: "self",
          successUrl: `${window.location.origin}/billing/success?plan=${plan}`,
          failUrl: `${window.location.origin}/billing/fail?plan=${plan}`,
          customerEmail: userEmail,
        });
      }
    } catch (error: any) {
      alert(error?.message || "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setBillingLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (isCanceling) return;
    setIsCanceling(true);
    try {
      const updated = await PostCancelSubscription();
      setSubscription(updated);
      setShowCancelModal(false);
    } catch (error: any) {
      alert(error?.message || "구독 해지에 실패했습니다.");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleLogout = async () => {
    try {
      await PostLogout();
    } catch {
      // 서버 로그아웃 실패와 무관하게 로컬 세션은 정리한다.
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      useUserStore.getState().reset();
      window.location.href = "/login";
    }
  };

  const toggleReason = (r: string) =>
    setWithdrawReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  const now = Date.now();
  const DAY = 86400000;

  const filteredConversations = [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((c) => c.title.toLowerCase().includes(chatSearch.toLowerCase()));

  const recentGroup = filteredConversations.filter(
    (c) => now - c.updatedAt <= 7 * DAY,
  );
  const olderGroup = filteredConversations.filter(
    (c) => now - c.updatedAt > 7 * DAY && now - c.updatedAt <= 30 * DAY,
  );

  const handleOpenConv = (id: string) => {
    openConversation(id);
    closeSettingsModal();
  };

  const handleRename = (id: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) updateTitle(id, trimmed);
    setEditingConvId(null);
    setEditingTitle("");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={closeSettingsModal}
    >
      <div
        className="relative flex overflow-hidden bg-white shadow-2xl rounded-2xl"
        style={{ height: 740 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left nav */}
        <aside
          className="shrink-0 border-r border-line-divider flex flex-col items-start self-stretch overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#F9FAFB]"
          style={{ width: 240, padding: "20px 16px", gap: 24 }}
        >
          {/* Nav groups */}
          <div className="flex-1 flex flex-col w-full gap-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-0.5">
                <p className="text-[11px] font-semibold text-tx-assistive uppercase tracking-wider px-2 mb-1">
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      active === item.id
                        ? "bg-[rgba(11,14,15,0.08)] text-tx-strong"
                        : "text-tx-alt hover:bg-[rgba(11,14,15,0.08)]"
                    }`}
                  >
                    <Icon icon={item.icon} className="flex-shrink-0 w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* FEDIT Pro upgrade card */}
          {currentPlan !== "pro" && (
            <div className="w-full shrink-0">
              <div className="flex flex-col items-start self-stretch gap-3 p-3 rounded-xl border border-[#E4E4E4] bg-white shadow-[0_2px_6px_0_rgba(0,0,0,0.06)]">
                <p className="text-sm font-semibold text-tx-strong">FEDIT Pro</p>
                <p className="text-xs leading-relaxed text-tx-alt">
                  무제한 분석과 트렌드 리포트를 확인
                </p>
                <button
                  onClick={() => setActive("구독")}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#111827] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
                >
                  <Icon icon="ph:plus-circle" className="w-3.5 h-3.5" />
                  요금제 업그레이드
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right content */}
        <main
          className="flex flex-col items-start self-stretch overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative"
          style={{ width: 820, padding: "12px 12px 36px 12px", gap: 2 }}
        >
          {/* Close button */}
          <button
            onClick={closeSettingsModal}
            className="absolute z-10 flex items-center justify-center w-8 h-8 transition-colors rounded-full top-5 right-5 hover:bg-surface-base text-tx-alt hover:text-tx-strong"
          >
            <Icon icon="material-symbols:close" className="w-5 h-5" />
          </button>

          <div className="w-full px-8 py-6">
            {/* ── 내 정보 ── */}
            {active === "내정보" && (
              <div className="max-w-[560px]">
                <h1 className="text-2xl font-semibold text-[#0B0E0F]">
                  내 정보
                </h1>
                <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                  계정 정보와 로그인 방식을 관리해요
                </p>

                <h3 className="mt-6 mb-4 text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-[#3D3F41]">
                  기본 정보
                </h3>
                <div className="border-t border-line-divider" />

                <div className="flex items-center py-4 ">
                  <div>
                    <p className="text-sm font-semibold text-tx-strong">
                      이메일
                    </p>
                    <p className="text-sm text-tx-alt mt-0.5">{userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 ">
                  <div>
                    <p className="text-sm font-semibold text-tx-strong">
                      비밀번호
                    </p>
                    <p className="text-sm text-tx-alt mt-0.5 tracking-widest">
                      ••••••••••
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex h-[34px] px-2 py-1 justify-center items-center gap-1.5 rounded-lg border border-[#E4E4E4] bg-white text-sm font-semibold text-tx-neutral hover:bg-surface-base transition-colors whitespace-nowrap"
                  >
                    변경하기
                  </button>
                </div>

                <h3 className="mt-8 mb-4 text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-[#3D3F41]">
                  계정 관리
                </h3>
                <div className="border-t border-line-divider" />

                <div className="flex items-center justify-between py-4 ">
                  <div>
                    <p className="text-sm font-semibold text-tx-strong">
                      로그아웃하기
                    </p>
                    <p className="text-sm text-tx-alt mt-0.5">
                      현재 계정에서 로그아웃 됩니다.
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex h-[34px] px-2 py-1 justify-center items-center gap-1.5 rounded-lg border border-[#E4E4E4] bg-white text-sm font-semibold text-tx-neutral hover:bg-surface-base transition-colors whitespace-nowrap"
                  >
                    로그아웃
                  </button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-tx-strong">
                      회원탈퇴
                    </p>
                    <p className="text-sm text-tx-alt mt-0.5">
                      계정을 영구적으로 삭제합니다. 더 이상 접근할 수 없게
                      됩니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setWithdrawReasons([]);
                      setWithdrawStep("reason");
                    }}
                    className="flex h-[34px] px-2 py-1 justify-center items-center gap-1.5 rounded-lg bg-[#FEE4E2] text-status-error text-sm font-semibold hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    회원 탈퇴
                  </button>
                </div>
              </div>
            )}

            {/* ── 알림 ── */}
            {active === "알림" && (
              <div className="max-w-[560px]">
                <h1 className="text-2xl font-semibold text-[#0B0E0F]">
                  알림
                </h1>
                <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                  알림을 받을 시점과 방법을 설정하세요
                </p>

                <h3 className="mt-6 mb-4 text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-[#3D3F41]">
                  푸시 알림
                </h3>
                <div className="border-t border-line-divider" />

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
                    className="flex items-center justify-between py-4 "
                  >
                    <div>
                      <p className="text-sm font-semibold text-tx-strong">
                        {item.label}
                      </p>
                      <p className="text-xs text-tx-assistive mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <Toggle value={item.value} onChange={item.toggle} />
                  </div>
                ))}
              </div>
            )}

            {/* ── FEDI 채팅 목록 ── */}
            {active === "FEDI대화" && (
              <div className="max-w-[620px]">
                <h1 className="text-2xl font-semibold text-[#0B0E0F]">
                  FEDI 채팅 목록
                </h1>
                <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                  총 {conversations.length}개의 대화
                </p>

                {/* Filters + Search */}
                <div className="flex items-center gap-2 mb-5">
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-line-divider rounded-lg text-sm text-tx-neutral hover:bg-surface-base transition-colors">
                    최신순
                    <Icon icon="ph:caret-down" className="w-3.5 h-3.5" />
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-line-divider rounded-lg text-sm text-tx-neutral hover:bg-surface-base transition-colors">
                    전체
                    <Icon icon="ph:caret-down" className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 border border-line-divider rounded-lg px-3 py-1.5 bg-white">
                    <input
                      type="text"
                      placeholder="검색어를 입력하세요."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="text-sm outline-none text-tx-neutral placeholder-icon-alt w-44"
                    />
                    <Icon
                      icon="ph:magnifying-glass"
                      className="flex-shrink-0 w-4 h-4 text-tx-assistive"
                    />
                  </div>
                </div>

                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-tx-assistive">
                    <Icon
                      icon="ph:chat-teardrop-text"
                      className="w-10 h-10 mb-3"
                    />
                    <p className="text-sm font-medium">
                      {chatSearch
                        ? "검색 결과가 없습니다"
                        : "대화 내역이 없습니다"}
                    </p>
                  </div>
                ) : (
                  <div>
                    {recentGroup.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold text-tx-assistive">
                          지난 7일
                        </p>
                        <div className="flex flex-col gap-1">
                          {recentGroup.map((conv) => (
                            <ChatRow
                              key={conv.id}
                              conv={conv}
                              isActive={conv.id === activeConversationId}
                              isEditing={editingConvId === conv.id}
                              editingTitle={editingTitle}
                              setEditingTitle={setEditingTitle}
                              onOpen={() => handleOpenConv(conv.id)}
                              onStartEdit={() => {
                                setEditingConvId(conv.id);
                                setEditingTitle(conv.title);
                              }}
                              onRename={() => handleRename(conv.id)}
                              onCancelEdit={() => {
                                setEditingConvId(null);
                                setEditingTitle("");
                              }}
                              onDelete={() => deleteConversation(conv.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {olderGroup.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold text-tx-assistive">
                          지난 30일
                        </p>
                        <div className="flex flex-col gap-1">
                          {olderGroup.map((conv) => (
                            <ChatRow
                              key={conv.id}
                              conv={conv}
                              isActive={conv.id === activeConversationId}
                              isEditing={editingConvId === conv.id}
                              editingTitle={editingTitle}
                              setEditingTitle={setEditingTitle}
                              onOpen={() => handleOpenConv(conv.id)}
                              onStartEdit={() => {
                                setEditingConvId(conv.id);
                                setEditingTitle(conv.title);
                              }}
                              onRename={() => handleRename(conv.id)}
                              onCancelEdit={() => {
                                setEditingConvId(null);
                                setEditingTitle("");
                              }}
                              onDelete={() => deleteConversation(conv.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── AI 사용 가이드 ── */}
            {active === "사용가이드" && (
              activeGuideId ? (
                (() => {
                  const topic = AI_GUIDE_TOPICS.find(
                    (t) => t.id === activeGuideId,
                  );
                  return topic ? (
                    <GuideDetailView
                      topic={topic}
                      onBack={() => setActiveGuideId(null)}
                    />
                  ) : null;
                })()
              ) : (
                <div className="max-w-[600px]">
                  <h1 className="text-2xl font-semibold text-[#0B0E0F]">
                    AI 사용 가이드
                  </h1>
                  <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                    주제를 골라 FEDIT 활용법을 자세히 알아보세요
                  </p>

                  <div className="flex items-center gap-5 overflow-x-auto hide-scrollbar border-b border-line-divider mb-8">
                    {GUIDE_TABS.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveGuideTab(tab)}
                        className={`relative flex-shrink-0 pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                          activeGuideTab === tab
                            ? "text-[#0B0E0F]"
                            : "text-tx-assistive hover:text-tx-neutral"
                        }`}
                      >
                        {tab}
                        {activeGuideTab === tab && (
                          <span className="absolute inset-x-0 -bottom-px h-[2px] bg-[#0B0E0F]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-10">
                    {getGuideTopicsByCategory(
                      activeGuideTab === "전체"
                        ? AI_GUIDE_TOPICS
                        : AI_GUIDE_TOPICS.filter(
                            (t) => t.category === activeGuideTab,
                          ),
                    ).map((group) => (
                      <div key={group.category}>
                        <p className="mb-3 text-sm font-semibold text-tx-assistive">
                          {group.category}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {group.topics.map((topic) => (
                            <GuideCard
                              key={topic.id}
                              title={topic.title}
                              desc={topic.desc}
                              onClick={() => setActiveGuideId(topic.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ── FAQ ── */}
            {active === "FAQ" && (
              <div className="max-w-[560px]">
                <h1 className="text-2xl font-semibold text-[#0B0E0F]">
                  자주 찾는 질문
                </h1>
                <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                  궁금한 점을 빠르게 해결하세요
                </p>

                <h3 className="mt-6 mb-4 text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-[#3D3F41]">
                  자주 찾는 질문
                </h3>
                <div className="border-t border-line-divider" />

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
                  <div key={i} className="py-4 ">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex items-center justify-between w-full gap-4 text-left"
                    >
                      <span className="text-sm font-semibold text-tx-strong">
                        {item.q}
                      </span>
                      <Icon
                        icon={openFaq === i ? "ph:caret-up" : "ph:caret-down"}
                        className="flex-shrink-0 w-4 h-4 text-tx-assistive"
                      />
                    </button>
                    {openFaq === i && (
                      <p className="mt-2 text-sm leading-relaxed text-tx-alt">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}

                <h3 className="mt-8 mb-4 text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-[#3D3F41]">
                  1:1 문의
                </h3>
                <div className="border-t border-line-divider" />

                <div className="flex flex-col gap-4 mt-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-tx-strong">
                      문의 유형
                    </label>
                    <div className="relative">
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="w-full appearance-none border border-line-divider rounded-xl px-4 py-3 text-sm text-tx-neutral bg-white focus:outline-none focus:border-[#111827] cursor-pointer"
                      >
                        <option>요금제·결제 문의</option>
                        <option>서비스 이용 문의</option>
                        <option>기술 문제 신고</option>
                        <option>계정 문의</option>
                        <option>기타</option>
                      </select>
                      <Icon
                        icon="ph:caret-down"
                        className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none right-4 top-1/2 text-tx-assistive"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-tx-strong">
                      문의 내용
                    </label>
                    <textarea
                      value={inquiryContent}
                      onChange={(e) => setInquiryContent(e.target.value)}
                      placeholder="궁금한 점이나 겪고 계신 문제를 자세히 적어주세요."
                      rows={5}
                      className="w-full border border-line-divider rounded-xl px-4 py-3 text-sm text-tx-neutral placeholder-tx-assistive bg-white focus:outline-none focus:border-[#111827] resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-tx-strong">
                      답변 받을 이메일
                    </label>
                    <input
                      type="email"
                      defaultValue={userEmail}
                      className="w-full border border-line-divider rounded-xl px-4 py-3 text-sm text-tx-neutral bg-white focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-tx-assistive">
                      보통 1영업일 이내에 답변드려요 · 평일 10:00–18:00
                    </p>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors whitespace-nowrap">
                      문의 보내기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 구독 관리 ── */}
            {active === "구독" && (
              <div className="max-w-[680px]">
                <h1 className="text-2xl font-semibold text-[#0B0E0F]">
                  구독 관리
                </h1>
                <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                  모든 Fedit 요금제를 살펴보세요
                </p>

                <h3 className="mt-6 mb-4 text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-[#3D3F41]">
                  현재 요금제
                </h3>
                <div className="flex items-center justify-between p-5 bg-[#F9FAFB] border border-line-divider rounded-xl mb-8">
                  <div>
                    {!subscriptionLoaded ? (
                      <>
                        <div className="w-20 h-5 rounded bg-line-divider animate-pulse" />
                        <div className="w-40 h-4 mt-2 rounded bg-line-divider animate-pulse" />
                      </>
                    ) : (
                      <>
                        <p className="text-base font-semibold text-tx-strong">
                          {PLAN_DEFS.find((p) => p.key === currentPlan)?.label}
                        </p>
                        {currentPlan === "free" ? (
                          <p className="text-sm text-tx-alt mt-0.5">
                            14일 동안 Basic 기능 일부 사용 가능한 요금제
                          </p>
                        ) : subscription?.cancelAtPeriodEnd ? (
                          <p className="flex items-center gap-1 mt-0.5 text-sm text-tx-alt">
                            <Icon icon="ph:info" className="w-4 h-4" />
                            해지 예약됨 · {subscription?.nextBillingDate ?? "-"}까지 이용 가능
                          </p>
                        ) : subscription?.status === "past_due" ? (
                          <p className="flex items-center gap-1 mt-0.5 text-sm text-status-error">
                            <Icon icon="ph:warning-circle" className="w-4 h-4" />
                            결제에 실패했어요. 카드 정보를 확인해주세요.
                          </p>
                        ) : (
                          <p className="text-sm text-tx-alt mt-0.5">
                            다음 결제일 {subscription?.nextBillingDate ?? "-"}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {currentPlan !== "pro" && (
                    <button
                      onClick={() =>
                        setPendingPlan(currentPlan === "free" ? "basic" : "pro")
                      }
                      className="px-5 py-2 bg-[#111827] text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
                    >
                      업그레이드
                    </button>
                  )}
                </div>

                <h3 className="mb-4 text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-[#3D3F41]">
                  모든 요금제 비교하기
                </h3>

                <div
                  id="plan-comparison"
                  className="flex overflow-hidden border-t border-line-divider"
                >
                  {PLAN_DEFS.map((plan, index, arr) => {
                    const isCurrent = plan.key === currentPlan;
                    const isDowngrade =
                      PLAN_RANK[plan.key] < PLAN_RANK[currentPlan];
                    const btnLabel = isCurrent
                      ? "현재 플랜"
                      : plan.key === "free"
                        ? "무료 체험"
                        : `${plan.label}${PLAN_PARTICLE[plan.key]} ${isDowngrade ? "다운그레이드" : "업그레이드"}`;
                    const isLoading = billingLoading === plan.key;
                    return (
                      <div
                        key={plan.label}
                        className={`flex flex-col flex-1 ${index === 1 ? "bg-white" : "bg-[#F9FAFB]"} ${index < arr.length - 1 ? "border-r border-line-divider" : ""}`}
                        style={{ padding: "20px 16px", gap: 20 }}
                      >
                        {/* 플랜명 + 배지 */}
                        <div className="flex items-center gap-2">
                          <p className="text-[16px] font-semibold leading-[150%] tracking-[-0.08px] text-[#242628]">
                            {plan.label}
                          </p>
                          {plan.badge && (
                            <span
                              className="px-1.5 py-0.5 text-[12px] font-semibold leading-[133%] text-[#1A75FF]"
                              style={{ borderRadius: 4, background: "#EAF2FE" }}
                            >
                              {plan.badge}
                            </span>
                          )}
                        </div>

                        {/* 가격 영역 */}
                        <div className="flex flex-col gap-0.5">
                          {plan.originalPrice && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs line-through text-[#A1A3A5]">
                                정가 {plan.originalPrice}
                              </span>
                              <span className="text-xs text-[#3E7EFF] font-semibold">
                                {plan.discount}
                              </span>
                            </div>
                          )}
                          <p className="text-[24px] font-semibold leading-[133%] tracking-[-0.48px] text-[#0B0E0F]">
                            {plan.price}
                            {plan.key !== "free" && (
                              <span className="text-sm font-medium text-[#6F7173] ml-0.5">
                                {plan.sub}
                              </span>
                            )}
                          </p>
                          {plan.key === "free" && (
                            <p className="text-[12px] font-medium leading-[133%] text-[#6F7173]">
                              {plan.sub}
                            </p>
                          )}
                        </div>

                        {/* 버튼 */}
                        <button
                          disabled={
                            isCurrent || plan.key === "free" || !!billingLoading
                          }
                          onClick={() =>
                            plan.key !== "free" && setPendingPlan(plan.key)
                          }
                          className={`flex h-[34px] px-2 py-1 justify-center items-center w-full rounded-lg text-sm font-semibold transition-colors ${
                            isCurrent || plan.key === "free"
                              ? "border border-[#E4E4E4] bg-[#E4E4E4] text-[#A1A3A5] cursor-default"
                              : "border border-line-divider bg-white text-[#3D3F41] hover:bg-surface-base cursor-pointer disabled:opacity-60 disabled:cursor-default"
                          }`}
                        >
                          {isLoading ? (
                            <Icon icon="ph:spinner" className="w-4 h-4 animate-spin" />
                          ) : (
                            btnLabel
                          )}
                        </button>

                        {/* 기능 목록 */}
                        <ul className="flex flex-col gap-3">
                          {plan.features.map((f) => (
                            <li key={f.text} className="flex items-start gap-2">
                              <Icon
                                icon={f.ok ? "ph:check" : "ph:x"}
                                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.ok ? "text-[#3D3F41]" : "text-[#A1A3A5]"}`}
                              />
                              <span
                                className={`text-[14px] font-medium leading-[143%] tracking-[-0.07px] ${f.ok ? "text-[#3D3F41]" : "text-[#A1A3A5]"}`}
                              >
                                {f.text}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {isCurrent && plan.key !== "free" && (
                          subscription?.cancelAtPeriodEnd ? (
                            <p className="pt-2 mt-auto text-xs font-medium text-tx-assistive">
                              {subscription?.nextBillingDate ?? "-"}까지 이용 가능 · 해지 예약됨
                            </p>
                          ) : (
                            <button
                              onClick={() => setShowCancelModal(true)}
                              className="self-start text-left mt-auto pt-2 text-[12px] font-medium leading-[133%] underline decoration-solid decoration-auto underline-offset-auto [text-underline-position:from-font] text-[#242628] transition-colors hover:text-status-error"
                            >
                              구독 해지
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── 회원 탈퇴 모달 ── */}
      {withdrawStep && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setWithdrawStep(null)}
          />

          {withdrawStep === "reason" && (
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-[440px] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-tx-default">
                  탈퇴 사유 선택
                </h2>
                <button onClick={() => setWithdrawStep(null)}>
                  <Icon
                    icon="material-symbols:close"
                    className="w-6 h-6 transition-colors text-tx-assistive hover:text-black"
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
                      className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${withdrawReasons.includes(r) ? "bg-tx-neutral border-tx-neutral" : "border-line-neutral"}`}
                    >
                      {withdrawReasons.includes(r) && (
                        <Icon
                          icon="lucide:check"
                          className="w-4 h-4 text-white"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-tx-default">
                      {r}
                    </span>
                  </label>
                ))}
              </div>

              <p className="mb-5 text-xs leading-relaxed text-tx-assistive">
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
                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                  withdrawReasons.length > 0
                    ? "bg-status-error text-white hover:bg-red-600 cursor-pointer"
                    : "bg-surface-base text-tx-assistive cursor-not-allowed"
                }`}
              >
                최종 탈퇴
              </button>
            </div>
          )}

          {withdrawStep === "confirm" && (
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-[380px] shadow-xl text-center">
              <div className="flex items-center justify-center mx-auto mb-4 rounded-full w-14 h-14 bg-rising-bg">
                <Icon icon="ph:warning" className="w-7 h-7 text-status-error" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-tx-strong">
                정말 탈퇴하시겠어요?
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-tx-alt">
                탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setWithdrawStep(null)}
                  disabled={isWithdrawing}
                  className="flex-1 py-3 text-sm font-semibold transition-colors border border-line-divider rounded-xl text-tx-neutral hover:bg-surface-base disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (isWithdrawing) return;
                    setIsWithdrawing(true);
                    try {
                      await DeleteWithdraw(withdrawReasons);
                      localStorage.clear();
                      window.location.href = "/login";
                    } catch (error: any) {
                      alert(error?.message || "회원 탈퇴에 실패했습니다.");
                      setIsWithdrawing(false);
                    }
                  }}
                  disabled={isWithdrawing}
                  className="flex-1 py-3 text-sm font-semibold text-white transition-colors bg-status-error rounded-xl hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWithdrawing ? "탈퇴 처리 중..." : "탈퇴하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 구독 해지 모달 ── */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => !isCanceling && setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-[380px] p-8 text-center bg-white shadow-xl rounded-2xl">
            <div className="flex items-center justify-center mx-auto mb-4 rounded-full w-14 h-14 bg-rising-bg">
              <Icon icon="ph:warning" className="w-7 h-7 text-status-error" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-tx-strong">
              구독을 해지하시겠어요?
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-tx-alt">
              해지 시 다음 결제일부터 청구가 중단돼요.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="flex-1 py-3 text-sm font-semibold transition-colors border border-line-divider rounded-xl text-tx-neutral hover:bg-surface-base disabled:cursor-not-allowed"
              >
                유지하기
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="flex-1 py-3 text-sm font-semibold text-white transition-colors bg-status-error rounded-xl hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCanceling ? "해지 처리 중..." : "해지하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 정기결제 동의 모달 (플랜 업그레이드 직전) ── */}
      {pendingPlan && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setPendingPlan(null);
              setAgreedCancelTerms(false);
            }}
          />
          <div className="relative w-full max-w-[400px] p-8 bg-white shadow-xl rounded-2xl">
            <h2 className="mb-2 text-xl font-semibold text-tx-strong">
              {PLAN_DEFS.find((p) => p.key === pendingPlan)?.label} 요금제로
              시작할게요
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-tx-alt">
              {PLAN_DEFS.find((p) => p.key === pendingPlan)?.price}
              {PLAN_DEFS.find((p) => p.key === pendingPlan)?.sub}에 정기결제가
              시작됩니다. 진행 전 아래 내용을 확인해주세요.
            </p>

            <label className="flex items-start gap-2 p-4 mb-6 cursor-pointer select-none bg-surface-base rounded-xl">
              <input
                type="checkbox"
                checked={agreedCancelTerms}
                onChange={(e) => setAgreedCancelTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-tx-neutral flex-shrink-0"
              />
              <span className="text-sm text-tx-alt">
                정기결제(자동 결제) 및 해지 방법, 환불 정책을 확인했으며 이에
                동의합니다.{" "}
                <Link
                  to="/terms/cancellation"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold underline text-tx-neutral hover:text-tx-strong"
                >
                  자세히 보기
                </Link>
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPendingPlan(null);
                  setAgreedCancelTerms(false);
                }}
                className="flex-1 py-3 text-sm font-semibold transition-colors border border-line-divider rounded-xl text-tx-neutral hover:bg-surface-base"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const plan = pendingPlan;
                  setPendingPlan(null);
                  setAgreedCancelTerms(false);
                  handleSelectPlan(plan);
                }}
                disabled={!agreedCancelTerms}
                className="flex-1 py-3 text-sm font-semibold text-white transition-colors bg-fill-primary rounded-xl hover:bg-fill-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                결제 진행하기
              </button>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}

function ChatRow({
  conv,
  isActive,
  isEditing,
  editingTitle,
  setEditingTitle,
  onOpen,
  onStartEdit,
  onRename,
  onCancelEdit,
  onDelete,
}: {
  conv: {
    id: string;
    title: string;
    updatedAt: number;
    messages: { content: string }[];
  };
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  setEditingTitle: (v: string) => void;
  onOpen: () => void;
  onStartEdit: () => void;
  onRename: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const now = Date.now();
  const diffDays = Math.floor((now - conv.updatedAt) / 86400000);
  const dateStr = diffDays === 0 ? "오늘" : `${diffDays}일전`;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg group hover:bg-surface-base transition-colors cursor-pointer ${isActive ? "bg-brand-subtle" : ""}`}
      onClick={() => {
        if (!isEditing) onOpen();
      }}
    >
      <div className="flex-shrink-0 w-5 h-5 border rounded-full border-line-divider" />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename();
              if (e.key === "Escape") onCancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-semibold text-tx-strong outline-none border-b border-[#3E7EFF] bg-transparent pb-0.5"
          />
        ) : (
          <p className="text-sm truncate text-tx-neutral">{conv.title}</p>
        )}
      </div>
      <span className="flex-shrink-0 text-xs text-tx-assistive">{dateStr}</span>
      <div
        className="flex items-center flex-shrink-0 gap-1 transition-opacity opacity-0 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onStartEdit}
          className="flex items-center justify-center w-6 h-6 transition-colors rounded hover:bg-white text-tx-alt hover:text-tx-strong"
        >
          <Icon icon="lucide:pencil" className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-6 h-6 transition-colors rounded hover:bg-white text-icon-alt hover:text-status-error"
        >
          <Icon icon="ph:trash" className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
