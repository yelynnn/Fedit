import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useChatStore } from "@/stores/ChatStore";
import { useUIStore } from "@/stores/UIStore";
import { useUserStore } from "@/stores/UserStore";
import { useFilterStore } from "@/stores/FilterStore";
import {
  GetCustomerKey,
  PostChangePlan,
  PostCancelSubscription,
  PostStartTrial,
  type PlanType,
} from "@/apis/BillingAPI";
import { getTossPayments } from "@/lib/toss";
import ChangePasswordModal from "@/components/common/ChangePasswordModal";
import { PostLogout, DeleteWithdraw } from "@/apis/AuthAPI";
import { AI_GUIDE_TOPICS, getGuideTopicsByCategory } from "@/content/aiGuides";
import GuideDetailView from "@/components/settings/guide/GuideDetailView";
import GuideCard from "@/components/settings/GuideCard";
import { GUIDE_CATEGORIES, type GuideCategory } from "@/types/guide";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from "@/stores/SubscriptionStore";
import cancelIcon from "@/assets/planCard/cancel.svg";
import kakaoPayIcon from "@/assets/etc/kakaoIcon.png";
import tossIcon from "@/assets/etc/tossIcon.png";
import { RequestUpgrade, GetUpgradeStatus } from "@/apis/KakaoAPI";
import InterestBrandModal from "@/components/billing/InterestBrandModal";
import BrandApplyPanel from "@/components/settings/BrandApplyPanel";
import { GetBrandList, GetBrandPicks } from "@/apis/AnalysisAPI";
import { isSecretEntry as checkSecretEntry, clearSecretEntry } from "@/lib/secretEntry";

const GUIDE_TABS: ("전체" | GuideCategory)[] = ["전체", ...GUIDE_CATEGORIES];

type Section =
  | "내정보"
  | "알림"
  | "FEDI대화"
  | "사용가이드"
  | "FAQ"
  | "브랜드입점신청"
  | "관심브랜드"
  | "구독";

// basic_secret은 비밀 링크 전용 플랜이라 일반 요금제 비교표에는 노출하지 않는다.
const PLAN_DEFS: {
  key: "free" | "basic" | "pro";
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
    sub: "14일 · Basic 기능 일부 (브랜드 제한)",
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
      {
        ok: true,
        text: "기본 무신사 입점 브랜드 외 브랜드 10개 추가 모니터링",
      },
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

// basic_secret은 Basic과 랭크가 같다(가격만 다른 동일 기능 플랜).
const PLAN_RANK: Record<"free" | PlanType, number> = {
  free: 0,
  basic: 1,
  basic_secret: 1,
  pro: 2,
};

// "Basic으로", "Pro로" — 플랜명 발음(받침 유무)에 맞춘 조사
const PLAN_PARTICLE: Record<PlanType, string> = {
  basic: "으로",
  pro: "로",
  basic_secret: "으로",
};

const PLAN_AMOUNT: Record<PlanType, number> = {
  basic: 19000,
  pro: 59000,
  basic_secret: 9900,
};

// 카카오페이 코드송금 링크 — 개발자센터 대시보드에서 관리자가 1회 수동 발급한
// 고정 링크라 요청마다 동적으로 내려오지 않는다. 링크가 재발급되면 이 값만 교체하면 된다.
const KAKAO_PAY_LINK_URL = "https://link.kakaopay.com/__/WXeNpEp";

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
    items: [
      { id: "FAQ", label: "FAQ / 1:1 문의", icon: "ph:question" },
      {
        id: "브랜드입점신청",
        label: "브랜드 입점 신청",
        icon: "ph:storefront",
      },
    ],
  },
  {
    title: "사용 권한 및 청구",
    items: [
      { id: "관심브랜드", label: "관심 브랜드 설정", icon: "ph:storefront" },
      { id: "구독", label: "구독 관리", icon: "ph:credit-card" },
    ],
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
  const {
    settingsModalTab,
    closeSettingsModal,
    openInterestBrandModal,
    openOnboardingTour,
  } = useUIStore();
  const setSelectedTab = useFilterStore((s) => s.setSelectedTab);
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
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<
    null | "stats" | "reason" | "interview" | "interview-confirmed" | "complete"
  >(null);
  const [withdrawReason, setWithdrawReason] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<"전체" | GuideCategory>(
    "전체",
  );
  const [agreedCancelTerms, setAgreedCancelTerms] = useState(false);
  // 비밀 링크(?ref=vip)로 들어왔던 사용자인지 — 로그인 페이지에서 심어둔
  // 플래그를 읽어서 Basic 카드를 "비밀 특가(9,900원 첫 달)"로 보여준다.
  const [isSecretEntry] = useState(checkSecretEntry);
  // basic_secret은 설정 화면의 일반 결제 플로우로는 선택할 수 없는 플랜(비밀
  // 링크 전용)이라 여기서 다루는 대상에서 제외한다.
  const [pendingPlan, setPendingPlan] = useState<"basic" | "pro" | null>(null);
  const [paymentStep, setPaymentStep] = useState<
    "agree" | "method" | "pending" | "failed"
  >("agree");
  const [selectedMethod, setSelectedMethod] = useState<"toss" | "kakao" | null>(
    null,
  );
  const [upgradeRequestId, setUpgradeRequestId] = useState<number | null>(null);
  const [isRequestingUpgrade, setIsRequestingUpgrade] = useState(false);
  const [depositorName, setDepositorName] = useState("");

  const closePendingPlanModal = () => {
    setPendingPlan(null);
    setAgreedCancelTerms(false);
    setPaymentStep("agree");
    setSelectedMethod(null);
    setUpgradeRequestId(null);
    setDepositorName("");
  };

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
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const userEmail = useUserStore((s) => s.email);

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // effectivePlan은 "선택 안 함"(구독 레코드 자체가 없음)과 "명시적 무료"를
  // 구분해서 보여줄 때만 쓰고, 그 외 요금제 비교/업그레이드 로직은 지금까지처럼
  // currentPlan(둘 다 free로 취급)을 그대로 쓴다.
  const effectivePlan = getEffectivePlan(subscription);
  const currentPlan: "free" | PlanType = toBillingPlan(effectivePlan);

  // 비밀 링크로 들어온 경우, Basic 카드는 "첫 달 9,900원" 특가로 바꿔서
  // 보여준다. Pro는 가격은 그대로지만(정가 그대로 결제) 배지만 "비밀 링크
  // 한정"으로 같이 표시한다. 실제 결제 요청에 보낼 plan_code(및 그 금액)는
  // 이거랑 별개로 handleStartKakaoPayment 안에서 pendingPlan === "basic"일
  // 때만 "basic_secret"으로 바꿔서 보낸다 — Pro는 비밀 링크로 들어와도
  // 정가 그대로다.
  const planDefs = isSecretEntry
    ? PLAN_DEFS.map((plan) =>
        plan.key === "basic"
          ? {
              ...plan,
              badge: "비밀 링크 한정",
              discount: "→ 9,900원 · 첫 1달",
              price: "9,900원",
            }
          : plan.key === "pro"
            ? { ...plan, badge: "비밀 링크 한정" }
            : plan,
      )
    : PLAN_DEFS;

  // 카카오페이 결제 요청에 실제로 실어 보낼 plan_code — Pro는 비밀 링크로
  // 들어와도 정가(pro/59,000원) 그대로 요청한다.
  const kakaoPlanCode: PlanType | null =
    pendingPlan === "basic" && isSecretEntry ? "basic_secret" : pendingPlan;

  // ── 관심 브랜드 설정 ──
  const [currentBrandPicks, setCurrentBrandPicks] = useState<string[]>([]);
  const [brandPicksLoading, setBrandPicksLoading] = useState(false);
  const [brandCategoryMap, setBrandCategoryMap] = useState<
    Record<string, string>
  >({});
  const [isBrandChangeModalOpen, setIsBrandChangeModalOpen] = useState(false);

  const fetchBrandPicks = async () => {
    setBrandPicksLoading(true);
    try {
      const picks = await GetBrandPicks();
      setCurrentBrandPicks(picks);
    } catch {
      setCurrentBrandPicks([]);
    } finally {
      setBrandPicksLoading(false);
    }
  };

  useEffect(() => {
    if (active !== "관심브랜드" || currentPlan !== "basic") return;
    fetchBrandPicks();
    GetBrandList()
      .then((data) => {
        const cats: { label: string; brands: string[] }[] = Array.isArray(
          data?.categories,
        )
          ? data.categories
          : [];
        const map: Record<string, string> = {};
        cats.forEach((cat) => {
          cat.brands.forEach((b) => {
            map[b] = cat.label;
          });
        });
        setBrandCategoryMap(map);
      })
      .catch(() => {});
  }, [active, currentPlan]);

  const formatMonthDay = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const currentPeriodStart = (() => {
    if (!subscription?.nextBillingDate) return null;
    const end = new Date(subscription.nextBillingDate);
    if (Number.isNaN(end.getTime())) return null;
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    return start;
  })();

  const currentPeriodLabel = (() => {
    if (!subscription?.nextBillingDate || !currentPeriodStart) return null;
    const end = new Date(subscription.nextBillingDate);
    if (Number.isNaN(end.getTime())) return null;
    const displayEnd = new Date(end);
    displayEnd.setDate(displayEnd.getDate() - 1);
    return `${formatMonthDay(currentPeriodStart.toISOString())} - ${formatMonthDay(displayEnd.toISOString())}`;
  })();

  // 백엔드에 "이번 주기에 이미 변경했는지" 필드가 없어서, 프론트에서 마지막
  // 저장 시각과 이번 주기 시작일을 비교해 임시로 판단한다. 기기별로만
  // 유효하므로, 백엔드가 이 값을 내려주게 되면 그쪽으로 교체해야 한다.
  const lastBrandPicksSavedAt = useFilterStore((s) => s.lastBrandPicksSavedAt);
  const hasChangedThisCycle =
    !!lastBrandPicksSavedAt &&
    !!currentPeriodStart &&
    new Date(lastBrandPicksSavedAt) >= currentPeriodStart;

  const handleSelectPlan = async (plan: PlanType) => {
    if (plan === currentPlan || billingLoading) return;
    setBillingLoading(plan);
    try {
      if (subscription?.hasBillingKey) {
        const updated = await PostChangePlan(plan);
        setSubscription(updated);
        const label = PLAN_DEFS.find((p) => p.key === plan)?.label ?? plan;
        alert(`${label} 요금제로 변경되었습니다.`);
        if (plan === "basic") {
          closeSettingsModal();
          openInterestBrandModal();
        } else if (plan === "pro") {
          closeSettingsModal();
          setSelectedTab("상품 분석");
          openOnboardingTour("pro");
        }
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

  const handleStartKakaoPayment = async () => {
    if (!kakaoPlanCode || isRequestingUpgrade || !depositorName.trim()) return;
    setIsRequestingUpgrade(true);
    try {
      // 링크는 고정 링크라 응답을 기다릴 필요 없이 바로 새 창으로 연다
      // (팝업 차단을 피하려면 클릭 핸들러와 최대한 가깝게 호출해야 한다).
      window.open(KAKAO_PAY_LINK_URL, "_blank");
      const { request_id } = await RequestUpgrade(
        kakaoPlanCode,
        PLAN_AMOUNT[kakaoPlanCode],
        depositorName.trim(),
      );
      setUpgradeRequestId(request_id);
      setPaymentStep("pending");
    } catch (error: any) {
      alert(error?.message || "결제 요청에 실패했습니다.");
    } finally {
      setIsRequestingUpgrade(false);
    }
  };

  // 카카오페이 입금 확인 폴링 — 자동 확인이 아니라 관리자가 입금 내역을 대조해
  // 수동 승인하는 구조라 30초 간격으로 조회한다. status는 pending/completed 외에도
  // expired·rejected 등으로 확장될 수 있어, pending/completed가 아니면 전부 실패
  // 화면으로 처리한다 (백엔드 권장 방식).
  useEffect(() => {
    if (paymentStep !== "pending" || !upgradeRequestId) return;
    const plan = pendingPlan;
    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const { status } = await GetUpgradeStatus(upgradeRequestId);
        if (cancelled) return;
        if (status === "completed") {
          clearInterval(interval);
          await fetchSubscription();
          closePendingPlanModal();
          clearSecretEntry();
          if (plan === "basic") {
            closeSettingsModal();
            openInterestBrandModal();
          } else if (plan === "pro") {
            closeSettingsModal();
            setSelectedTab("상품 분석");
            openOnboardingTour("pro");
          }
        } else if (status !== "pending") {
          clearInterval(interval);
          setPaymentStep("failed");
        }
      } catch {
        if (!cancelled) {
          clearInterval(interval);
          setPaymentStep("failed");
        }
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStep, upgradeRequestId]);

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

  const handleStartTrial = async () => {
    if (isStartingTrial) return;
    setIsStartingTrial(true);
    try {
      await PostStartTrial();
      await fetchSubscription();
      closeSettingsModal();
      setSelectedTab("상품 분석");
      openOnboardingTour("signup");
    } catch (error: any) {
      alert(error?.message || "무료체험 시작에 실패했습니다.");
    } finally {
      setIsStartingTrial(false);
    }
  };

  // 1:1 문의는 백엔드 없이, Zapier 웹훅(VITE_INQUIRY_WEBHOOK_URL)으로 보내
  // Confluence에 문서로 쌓는 방식으로 연결한다. Zapier의 Webhooks 트리거는
  // 항상 200을 즉시 반환하고 뒤에서 비동기로 처리하므로, 여기서의 성공은
  // "Zapier가 요청을 받았다"는 뜻이지 Confluence 문서화까지 끝났다는 보장은
  // 아니다.
  const handleSendInquiry = async () => {
    if (isSendingInquiry || !inquiryContent.trim()) return;
    const webhookUrl = import.meta.env.VITE_INQUIRY_WEBHOOK_URL as
      | string
      | undefined;
    if (!webhookUrl) {
      alert("문의 접수 연결이 아직 설정되지 않았습니다.");
      return;
    }
    setIsSendingInquiry(true);
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          email: inquiryEmail.trim() || userEmail,
          type: inquiryType,
          content: inquiryContent,
        }),
      });
      if (!res.ok) throw new Error();
      alert("문의가 접수되었습니다.");
      setInquiryContent("");
    } catch {
      alert("문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSendingInquiry(false);
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

  const CALENDLY_URL = "https://calendly.com/team-mify/30min";

  const loadCalendlyScript = () =>
    new Promise<void>((resolve) => {
      if (!document.getElementById("calendly-widget-style")) {
        const link = document.createElement("link");
        link.id = "calendly-widget-style";
        link.rel = "stylesheet";
        link.href = "https://assets.calendly.com/assets/external/widget.css";
        document.head.appendChild(link);
      }

      if ((window as any).Calendly) {
        resolve();
        return;
      }
      const existing = document.getElementById("calendly-widget-script");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        return;
      }
      const script = document.createElement("script");
      script.id = "calendly-widget-script";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });

  const handleOpenInterviewScheduler = async () => {
    await loadCalendlyScript();
    const url = new URL(CALENDLY_URL);
    if (userEmail) url.searchParams.set("email", userEmail);
    (window as any).Calendly?.initPopupWidget({ url: url.toString() });
  };

  useEffect(() => {
    if (withdrawStep !== "interview") return;
    const handleMessage = (e: MessageEvent) => {
      if (
        e.origin.includes("calendly.com") &&
        e.data?.event === "calendly.event_scheduled"
      ) {
        setWithdrawStep("interview-confirmed");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [withdrawStep]);

  const finalizeWithdraw = async () => {
    if (isWithdrawing) return;
    setIsWithdrawing(true);
    try {
      await DeleteWithdraw(withdrawReason ? [withdrawReason] : []);
      setWithdrawStep("complete");
    } catch (error: any) {
      alert(error?.message || "회원 탈퇴에 실패했습니다.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleContinueAfterReason = () => {
    setWithdrawStep("interview");
  };

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
                {group.items
                  .filter(
                    (item) =>
                      item.id !== "관심브랜드" || currentPlan === "basic",
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        active === item.id
                          ? "bg-[rgba(11,14,15,0.08)] text-tx-strong"
                          : "text-tx-alt hover:bg-[rgba(11,14,15,0.08)]"
                      }`}
                    >
                      <Icon
                        icon={item.icon}
                        className="flex-shrink-0 w-4 h-4"
                      />
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
                <p className="text-sm font-semibold text-tx-strong">
                  FEDIT Pro
                </p>
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
                      setWithdrawReason(null);
                      setWithdrawStep("stats");
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
                <h1 className="text-2xl font-semibold text-[#0B0E0F]">알림</h1>
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
            {active === "사용가이드" &&
              (activeGuideId ? (
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
                    서비스 사용 가이드
                  </h1>
                  <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                    주제를 골라 FEDIT 활용법을 자세히 알아보세요
                  </p>

                  <div className="flex items-center gap-5 mb-8 overflow-x-auto border-b hide-scrollbar border-line-divider">
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
              ))}

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
                      value={inquiryEmail || userEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full border border-line-divider rounded-xl px-4 py-3 text-sm text-tx-neutral bg-white focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-tx-assistive">
                      보통 1영업일 이내에 답변드려요 · 평일 10:00–18:00
                    </p>
                    <button
                      onClick={handleSendInquiry}
                      disabled={isSendingInquiry || !inquiryContent.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSendingInquiry ? "전송 중..." : "문의 보내기"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 브랜드 입점 신청 ── */}
            {active === "브랜드입점신청" && <BrandApplyPanel />}

            {/* ── 관심 브랜드 설정 ── */}
            {active === "관심브랜드" && currentPlan === "basic" && (
              <div className="max-w-[680px]">
                <h1 className="text-2xl font-semibold text-[#0B0E0F]">
                  관심 브랜드 설정
                </h1>
                <p className="text-base font-medium text-[#6F7173] mt-1 mb-6">
                  분석에 사용할 브랜드를 관리하세요
                </p>

                <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-sm bg-[#EAF2FE]">
                  <Icon
                    icon="material-symbols-light:info-rounded"
                    className="flex-shrink-0 w-5 h-5 text-[#1A75FF]"
                  />
                  <p className="text-xs font-medium text-[#1A75FF] leading-[133%]">
                    브랜드는 결제일마다 1회 변경할 수 있어요.{" "}
                    {subscription?.nextBillingDate && (
                      <>
                        다음 변경일은{" "}
                        {formatMonthDay(subscription.nextBillingDate)}이에요.
                      </>
                    )}
                  </p>
                </div>

                <div className="p-5 border border-line-divider rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[18px] font-semibold text-[#3D3F41]">
                        지금 적용 중인 브랜드
                      </h3>
                      {currentPeriodLabel && (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-fill-bg-strong text-tx-alt">
                          <Icon icon="ph:calendar" className="w-3.5 h-3.5" />
                          {currentPeriodLabel} 분석에 반영 중
                        </span>
                      )}
                    </div>
                    {!brandPicksLoading &&
                      currentBrandPicks.length > 0 &&
                      (hasChangedThisCycle ? (
                        <span className="text-xs text-tx-assistive">
                          {subscription?.nextBillingDate
                            ? `${formatMonthDay(subscription.nextBillingDate)}부터 다시 변경할 수 있어요`
                            : "다음 결제일부터 다시 변경할 수 있어요"}
                        </span>
                      ) : (
                        <button
                          onClick={() => setIsBrandChangeModalOpen(true)}
                          className="px-4 py-2 text-sm font-semibold transition-colors border rounded-lg border-line-divider text-tx-neutral hover:bg-surface-base"
                        >
                          변경하기
                        </button>
                      ))}
                  </div>

                  {brandPicksLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[68px] rounded-xl bg-fill-bg-strong animate-pulse"
                        />
                      ))}
                    </div>
                  ) : currentBrandPicks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <p className="text-sm text-tx-alt">
                        아직 선택한 관심 브랜드가 없어요.
                      </p>
                      <button
                        onClick={() => setIsBrandChangeModalOpen(true)}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-fill-primary"
                      >
                        브랜드 선택하기
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {currentBrandPicks.map((brand) => (
                        <div
                          key={brand}
                          className="flex items-center gap-3 p-4 border rounded-xl border-line-divider"
                        >
                          <span className="flex items-center justify-center flex-shrink-0 text-sm font-semibold rounded-lg w-9 h-9 bg-fill-bg-strong text-tx-neutral">
                            {brand.trim().charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate text-tx-strong">
                              {brand}
                            </p>
                            {brandCategoryMap[brand] && (
                              <p className="text-xs truncate text-tx-alt">
                                {brandCategoryMap[brand]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                          {effectivePlan === "none"
                            ? "요금제 미선택"
                            : effectivePlan === "expired"
                              ? "이용 만료"
                              : PLAN_DEFS.find((p) => p.key === currentPlan)
                                  ?.label}
                        </p>
                        {effectivePlan === "none" ? (
                          <p className="text-sm text-tx-alt mt-0.5">
                            아직 선택한 요금제가 없어요. 원하는 플랜을
                            골라주세요.
                          </p>
                        ) : effectivePlan === "expired" ? (
                          <p className="flex items-center gap-1 mt-0.5 text-sm text-status-error">
                            <Icon
                              icon="ph:warning-circle"
                              className="w-4 h-4"
                            />
                            이용 기간이 만료됐어요. 요금제를 다시
                            선택해주세요.
                          </p>
                        ) : currentPlan === "free" ? (
                          <p className="text-sm text-tx-alt mt-0.5">
                            14일 동안 Basic 기능 일부 사용 가능한 요금제
                          </p>
                        ) : subscription?.cancelAtPeriodEnd ? (
                          <p className="flex items-center gap-1 mt-0.5 text-sm text-tx-alt">
                            <Icon icon="ph:info" className="w-4 h-4" />
                            해지 예약됨 · {subscription?.nextBillingDate ?? "-"}
                            까지 이용 가능
                          </p>
                        ) : subscription?.status === "past_due" ? (
                          <p className="flex items-center gap-1 mt-0.5 text-sm text-status-error">
                            <Icon
                              icon="ph:warning-circle"
                              className="w-4 h-4"
                            />
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
                  {planDefs.map((plan, index, arr) => {
                    // Free는 currentPlan(무료체험 미시작도 "free"로 뭉개진 값)이
                    // 아니라 effectivePlan으로 실제 무료체험 이용 중인지를 봐야
                    // "요금제 미선택" 상태에서 현재 플랜으로 잘못 표시되지 않는다.
                    const isCurrent =
                      plan.key === "free"
                        ? effectivePlan === "free"
                        : plan.key === currentPlan;
                    const isDowngrade =
                      PLAN_RANK[plan.key] < PLAN_RANK[currentPlan];
                    const isTrialAvailable = effectivePlan === "none";
                    const btnLabel = isCurrent
                      ? "현재 플랜"
                      : plan.key === "free"
                        ? isTrialAvailable
                          ? "무료체험 시작하기"
                          : "무료 체험"
                        : isSecretEntry
                          ? "비밀 특가로 시작하기"
                          : `${plan.label}${PLAN_PARTICLE[plan.key]} ${isDowngrade ? "다운그레이드" : "업그레이드"}`;
                    const isLoading =
                      billingLoading === plan.key ||
                      (plan.key === "free" && isStartingTrial);
                    const isFreeDisabled =
                      plan.key === "free" && !isTrialAvailable;
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
                          {plan.badge &&
                            ((plan.key === "basic" || plan.key === "pro") &&
                            isSecretEntry ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[12px] font-semibold leading-[133%] text-[#7A5C00]"
                                style={{ borderRadius: 4, background: "#FFF6DD" }}
                              >
                                <Icon icon="ph:lock-simple-fill" className="w-3 h-3" />
                                {plan.badge}
                              </span>
                            ) : (
                              <span
                                className="px-1.5 py-0.5 text-[12px] font-semibold leading-[133%] text-[#1A75FF]"
                                style={{ borderRadius: 4, background: "#EAF2FE" }}
                              >
                                {plan.badge}
                              </span>
                            ))}
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
                            isCurrent ||
                            isFreeDisabled ||
                            !!billingLoading ||
                            isStartingTrial
                          }
                          onClick={() => {
                            if (plan.key === "free") {
                              if (isTrialAvailable) handleStartTrial();
                              return;
                            }
                            setPendingPlan(plan.key);
                          }}
                          className={`flex h-[34px] px-2 py-1 justify-center items-center w-full rounded-lg text-sm font-semibold transition-colors ${
                            isCurrent || isFreeDisabled
                              ? "border border-[#E4E4E4] bg-[#E4E4E4] text-[#A1A3A5] cursor-default"
                              : "border border-line-divider bg-white text-[#3D3F41] hover:bg-surface-base cursor-pointer disabled:opacity-60 disabled:cursor-default"
                          }`}
                        >
                          {isLoading ? (
                            <Icon
                              icon="ph:spinner"
                              className="w-4 h-4 animate-spin"
                            />
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

                        {isCurrent &&
                          plan.key !== "free" &&
                          (subscription?.cancelAtPeriodEnd ? (
                            <p className="pt-2 mt-auto text-xs font-medium text-tx-assistive">
                              {subscription?.nextBillingDate ?? "-"}까지 이용
                              가능 · 해지 예약됨
                            </p>
                          ) : (
                            <button
                              onClick={() => setShowCancelModal(true)}
                              className="self-start text-left mt-auto pt-2 text-[12px] font-medium leading-[133%] underline decoration-solid decoration-auto underline-offset-auto [text-underline-position:from-font] text-[#242628] transition-colors hover:text-status-error"
                            >
                              구독 해지
                            </button>
                          ))}
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
            onClick={() => {
              if (withdrawStep !== "complete") setWithdrawStep(null);
            }}
          />

          {withdrawStep === "stats" && (
            <div className="relative flex w-[420px] flex-col items-end gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-between w-full">
                <span className="type-body-small text-tx-alt">지난 3개월</span>
                <button
                  type="button"
                  onClick={() => setWithdrawStep(null)}
                  className="flex h-7 w-7 items-center justify-center gap-2.5 rounded-pill border border-line-alt bg-fill-bg p-1 hover:bg-fill-bg-strong"
                >
                  <img src={cancelIcon} alt="닫기" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col w-full gap-2">
                <h2 className="type-title-large break-keep text-tx-strong">
                  FEDIT과 함께한
                  <br />
                  당신의 패션 기획 아카이브
                </h2>
                <p className="type-body-small break-keep text-tx-alt">
                  떠나기 전에, 지금까지 발견한 스타일을 확인해보세요.
                </p>
              </div>

              <div className="flex items-center w-full rounded-xl bg-fill-bg-strong">
                {[
                  { value: "48", label: "저장한 아이템" },
                  { value: "12", label: "발견한 키워드" },
                  { value: "86%", label: "평균 매칭률" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center flex-1">
                    {i > 0 && <div className="w-px h-8 bg-line-divider" />}
                    <div className="flex flex-col items-center flex-1 gap-1 px-2 py-5">
                      <span className="text-center type-headline text-tx-strong">
                        {stat.value}
                      </span>
                      <span className="type-body-xsmall text-tx-alt">
                        {stat.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => setWithdrawStep("reason")}
                  className="type-body-small text-tx-default"
                >
                  탈퇴 계속하기
                </button>
                <button
                  onClick={() => setWithdrawStep(null)}
                  className="flex h-[34px] items-center justify-center gap-1.5 rounded-md bg-fill-primary px-2 py-1 type-body-small text-tx-inverse"
                >
                  계정 유지하기
                </button>
              </div>
            </div>
          )}

          {withdrawStep === "reason" && (
            <div className="relative flex w-[420px] flex-col items-end gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-between w-full">
                <h2 className="type-title-large text-tx-strong">
                  떠나시려는 이유를 알려주세요
                </h2>
                <button
                  type="button"
                  onClick={() => setWithdrawStep(null)}
                  className="flex h-7 w-7 items-center justify-center gap-2.5 rounded-pill border border-line-alt bg-fill-bg p-1 hover:bg-fill-bg-strong"
                >
                  <img src={cancelIcon} alt="닫기" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col w-full gap-4">
                <p className="type-body-small text-tx-neutral">
                  탈퇴하시는 주된 이유는 무엇인가요?
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    ...(currentPlan === "free" ? [] : ["요금이 부담돼요"]),
                    "AI 추천·기획 결과가 기대에 못 미쳐요",
                    "원하는 브랜드·콘텐츠가 없어요",
                    "생각보다 자주 안 쓰게 돼요",
                    "잠시 쉬고 싶어요",
                  ].map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setWithdrawReason(r)}
                    >
                      <div
                        className={[
                          "flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-full border-2",
                          withdrawReason === r
                            ? "border-tx-strong"
                            : "border-icon-alt",
                        ].join(" ")}
                      >
                        {withdrawReason === r && (
                          <div className="h-2.5 w-2.5 rounded-full bg-tx-strong" />
                        )}
                      </div>
                      <span className="type-body-small text-tx-neutral">
                        {r}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <button
                  onClick={handleContinueAfterReason}
                  className="type-body-small text-tx-default"
                >
                  건너뛰기
                </button>
                <button
                  onClick={handleContinueAfterReason}
                  disabled={!withdrawReason || isWithdrawing}
                  className={[
                    "flex h-[34px] items-center justify-center gap-1.5 rounded-md px-2 py-1 type-body-small transition-colors",
                    withdrawReason
                      ? "bg-fill-primary text-tx-inverse"
                      : "cursor-not-allowed bg-[#F4F4F5] text-[#A1A3A5]",
                  ].join(" ")}
                >
                  탈퇴 계속하기
                </button>
              </div>
            </div>
          )}

          {withdrawStep === "interview" && (
            <div className="relative flex w-[420px] flex-col items-end gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-between w-full">
                <span className="type-body-small text-tx-alt">
                  화상 인터뷰 제안
                </span>
                <button
                  type="button"
                  onClick={() => setWithdrawStep(null)}
                  className="flex h-7 w-7 items-center justify-center gap-2.5 rounded-pill border border-line-alt bg-fill-bg p-1 hover:bg-fill-bg-strong"
                >
                  <img src={cancelIcon} alt="닫기" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col w-full gap-2">
                <h2 className="type-title-large break-keep text-tx-strong">
                  20분만 시간을
                  <br />
                  내주실 수 있나요?
                </h2>
                <p className="type-body-small break-keep text-tx-alt">
                  추천이 왜 안맞았는지 들려주세요. FEDIT를 더 정교하게 만드는 데
                  큰 힘이 돼요.
                </p>
              </div>

              {currentPlan !== "free" && (
                <div className="flex w-full flex-col gap-2 rounded-xl bg-[#EFFBF3] p-3">
                  <span className="type-body-xsmall text-tx-alt">
                    인터뷰 참여 리워드
                  </span>
                  <p className="type-title-medium text-tx-strong">
                    최근 결제한 1개월권{" "}
                    <span className="text-status-warning">
                      {currentPlan === "pro" ? "59,000원" : "19,000원"}
                    </span>{" "}
                    페이백
                  </p>
                  <div className="flex items-center gap-1">
                    <Icon
                      icon="ph:info"
                      className="h-3.5 w-3.5 flex-shrink-0 text-tx-assistive"
                    />
                    <span className="type-body-xsmall text-tx-alt">
                      인터뷰(20분)를 완료 후 1개월권 페이백이 진행됩니다.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between w-full">
                <button
                  onClick={finalizeWithdraw}
                  disabled={isWithdrawing}
                  className="type-body-small text-tx-default"
                >
                  괜찮아요, 탈퇴할게요
                </button>
                <button
                  onClick={handleOpenInterviewScheduler}
                  className="flex h-[34px] items-center justify-center gap-1.5 rounded-md bg-fill-primary px-2 py-1 type-body-small text-tx-inverse"
                >
                  인터뷰 일정 잡기
                </button>
              </div>
            </div>
          )}

          {withdrawStep === "interview-confirmed" && (
            <div className="relative flex w-[420px] flex-col items-center gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-center rounded-full h-11 w-11 bg-fill-primary">
                <Icon icon="ph:check-bold" className="w-5 h-5 text-white" />
              </div>

              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="type-title-large text-tx-strong">
                  예약이 확정됐어요
                </h2>
                <p className="type-body-small text-tx-alt">
                  입력하신 메일로 참여 링크를 보내드렸어요.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 p-3 rounded-xl bg-fill-bg-strong">
                <div className="flex items-center justify-between">
                  <span className="type-body-small text-tx-alt">
                    입력하신 이메일
                  </span>
                  <span className="type-body-small text-tx-strong">
                    {userEmail}
                  </span>
                </div>
                <div className="w-full h-px bg-line-divider" />
                <p className="type-body-xsmall break-keep text-tx-alt">
                  탈퇴하시면 인터뷰 일정은 그대로 유지되고, 인터뷰 후
                  환급됩니다.
                </p>
              </div>

              <button
                onClick={finalizeWithdraw}
                disabled={isWithdrawing}
                className="flex h-[46px] w-full items-center justify-center gap-1 rounded-md bg-fill-primary type-title-medium text-tx-inverse"
              >
                {isWithdrawing ? "탈퇴 처리 중..." : "탈퇴하기"}
              </button>
            </div>
          )}

          {withdrawStep === "complete" && (
            <div className="relative flex w-[420px] flex-col items-start gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
              <div className="flex flex-col gap-1">
                <span className="type-body-small text-tx-assistive">
                  탈퇴 완료
                </span>
                <h2 className="type-title-large text-tx-strong">
                  언제든 다시 돌아오세요
                </h2>
                <p className="type-body-small break-keep text-tx-neutral">
                  계정 탈퇴가 완료되었어요. 이용 데이터는 30일간 안전하게
                  보관되며, 30일 내 재구독 시, 그대로 복구됩니다.
                </p>
              </div>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="flex h-[46px] w-full items-center justify-center gap-1 rounded-md bg-fill-primary type-title-medium text-tx-inverse"
              >
                확인했어요
              </button>
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
            onClick={closePendingPlanModal}
          />
          <div className="relative w-full max-w-[440px] p-8 bg-white shadow-xl rounded-2xl">
            {paymentStep === "agree" ? (
              <>
                <h2 className="mb-2 text-xl font-semibold text-tx-strong">
                  {planDefs.find((p) => p.key === pendingPlan)?.label} 요금제로
                  시작할게요
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-tx-alt">
                  {planDefs.find((p) => p.key === pendingPlan)?.price}
                  {planDefs.find((p) => p.key === pendingPlan)?.sub}에
                  정기결제가 시작됩니다. 진행 전 아래 내용을 확인해주세요.
                </p>

                <label className="flex items-start gap-2 p-4 mb-6 cursor-pointer select-none bg-surface-base rounded-xl">
                  <input
                    type="checkbox"
                    checked={agreedCancelTerms}
                    onChange={(e) => setAgreedCancelTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-tx-neutral flex-shrink-0"
                  />
                  <span className="text-sm text-tx-alt">
                    정기결제(자동 결제) 및 해지 방법, 환불 정책을 확인했으며
                    이에 동의합니다.{" "}
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
                    onClick={closePendingPlanModal}
                    className="flex-1 py-3 text-sm font-semibold transition-colors border border-line-divider rounded-xl text-tx-neutral hover:bg-surface-base"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setPaymentStep("method")}
                    disabled={!agreedCancelTerms}
                    className="flex-1 py-3 text-sm font-semibold text-white transition-colors bg-fill-primary rounded-xl hover:bg-fill-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    결제 진행하기
                  </button>
                </div>
              </>
            ) : paymentStep === "method" ? (
              <>
                <button
                  onClick={() => setPaymentStep("agree")}
                  className="flex items-center gap-1 mb-2 text-sm font-medium text-tx-alt hover:text-tx-neutral"
                >
                  <Icon icon="ph:arrow-left" className="w-4 h-4" />
                  이전
                </button>
                <h2 className="mb-2 text-xl font-semibold text-tx-strong">
                  결제 수단을 선택해주세요
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-tx-alt">
                  {planDefs.find((p) => p.key === pendingPlan)?.label} 요금제
                  {planDefs.find((p) => p.key === pendingPlan)?.price}
                  {planDefs.find((p) => p.key === pendingPlan)?.sub}
                </p>

                <div className="flex flex-col gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("kakao")}
                    className={`flex items-center justify-between w-full p-4 border rounded-xl transition-colors ${
                      selectedMethod === "kakao"
                        ? "border-1 border-tx-neutral bg-surface-base"
                        : "border-line-divider hover:border-tx-alt"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <img
                        src={kakaoPayIcon}
                        alt="카카오페이"
                        className="object-contain w-auto h-6"
                      />
                      <span className="text-sm font-semibold text-tx-strong">
                        카카오페이
                      </span>
                    </span>
                    {selectedMethod === "kakao" && (
                      <Icon
                        icon="ph:check-circle-fill"
                        className="w-5 h-5 text-tx-neutral"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-between w-full p-4 border cursor-not-allowed rounded-xl border-line-divider bg-surface-base opacity-60"
                  >
                    <span className="flex items-center gap-2">
                      <img
                        src={tossIcon}
                        alt="토스페이먼츠"
                        className="object-contain w-auto h-7"
                      />
                      <span className="text-sm font-semibold text-tx-alt">
                        토스페이먼츠
                      </span>
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full text-tx-alt bg-fill-bg-strong">
                      추후 오픈 예정
                    </span>
                  </button>
                </div>

                {selectedMethod === "kakao" && (
                  <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FFF6DD]">
                      <Icon
                        icon="ph:info"
                        className="flex-shrink-0 w-4 h-4 mt-0.5 text-[#B8860B]"
                      />
                      <p className="text-xs leading-relaxed text-[#7A5C00]">
                        결제하기를 누르면 카카오페이 송금 링크가 새 창으로
                        열려요. 정확히{" "}
                        <b>{PLAN_AMOUNT[kakaoPlanCode ?? "basic"].toLocaleString()}원</b>을
                        아래 입금자명과 동일한 이름으로 송금해주세요.
                      </p>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-semibold text-tx-strong">
                        입금자명
                      </label>
                      <input
                        type="text"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        placeholder="카카오페이 송금 시 사용할 이름을 입력해주세요"
                        className="w-full px-4 py-3 text-sm border rounded-xl border-line-divider text-tx-neutral placeholder-tx-assistive focus:outline-none focus:border-tx-neutral"
                      />
                      <p className="mt-1.5 text-xs text-tx-assistive">
                        입력하신 이름과 실제 송금자명이 일치해야 확인이
                        가능해요.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closePendingPlanModal}
                    className="flex-1 py-3 text-sm font-semibold transition-colors border border-line-divider rounded-xl text-tx-neutral hover:bg-surface-base"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      if (selectedMethod === "kakao") {
                        handleStartKakaoPayment();
                      } else if (selectedMethod === "toss") {
                        const plan = pendingPlan;
                        closePendingPlanModal();
                        handleSelectPlan(plan);
                      }
                    }}
                    disabled={
                      !selectedMethod ||
                      isRequestingUpgrade ||
                      (selectedMethod === "kakao" && !depositorName.trim())
                    }
                    className="flex-1 py-3 text-sm font-semibold text-white transition-colors bg-fill-primary rounded-xl hover:bg-fill-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRequestingUpgrade ? "연결 중..." : "결제하기"}
                  </button>
                </div>
              </>
            ) : paymentStep === "pending" ? (
              <>
                <div className="flex flex-col items-center py-6 text-center">
                  <Icon
                    icon="ph:hourglass-medium"
                    className="w-10 h-10 mb-4 text-tx-neutral"
                  />
                  <h2 className="mb-2 text-xl font-semibold text-tx-strong">
                    입금 확인 중이에요
                  </h2>
                  <p className="text-sm leading-relaxed text-tx-alt">
                    새로 열린 카카오페이 창에서 송금을 완료해주세요.
                    <br />
                    담당자가 입금 내역을 확인하는 대로, 영업시간 기준 빠르게
                    확인 후 승인해드릴게요.
                  </p>
                  <button
                    onClick={() => window.open(KAKAO_PAY_LINK_URL, "_blank")}
                    className="mt-4 text-sm font-semibold underline text-tx-neutral hover:text-tx-strong"
                  >
                    결제 링크 다시 열기
                  </button>
                </div>
                <button
                  onClick={closePendingPlanModal}
                  className="w-full py-3 text-sm font-semibold transition-colors border border-line-divider rounded-xl text-tx-neutral hover:bg-surface-base"
                >
                  닫기
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center py-6 text-center">
                  <Icon
                    icon="ph:x-circle"
                    className="w-10 h-10 mb-4 text-status-error"
                  />
                  <h2 className="mb-2 text-xl font-semibold text-tx-strong">
                    결제가 확인되지 않았어요
                  </h2>
                  <p className="text-sm leading-relaxed text-tx-alt">
                    입금 확인이 되지 않았거나 요청이 만료되었습니다.
                    <br />
                    다시 시도해주세요.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closePendingPlanModal}
                    className="flex-1 py-3 text-sm font-semibold transition-colors border border-line-divider rounded-xl text-tx-neutral hover:bg-surface-base"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      setUpgradeRequestId(null);
                      setPaymentStep("method");
                    }}
                    className="flex-1 py-3 text-sm font-semibold text-white transition-colors bg-fill-primary rounded-xl hover:bg-fill-primary-hover"
                  >
                    다시 시도하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <InterestBrandModal
        isOpen={isBrandChangeModalOpen}
        mode="change"
        onClose={() => setIsBrandChangeModalOpen(false)}
        onComplete={fetchBrandPicks}
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
