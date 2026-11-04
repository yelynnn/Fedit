import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/stores/UserStore";
import CustomerBrandSetModal, { CUSTOMER_BRAND_MAX } from "@/components/customer/CustomerBrandSetModal";
import { AnalysisRequestDialog } from "@/components/customer/AnalysisRequestDialog";
import { GetCustomerBrands, GetCustomerSummary } from "@/apis/CustomerAnalysisAPI";
import type {
  CustomerBrand,
  CustomerPeriod,
  CustomerPlatformFilter,
  CustomerSummary,
} from "@/types/CustomerAnalysis";
import { BrandChips, CustomerAnalysisHeader } from "@/components/customer/CustomerAnalysisToolbar";
import { CustomerKpiCards, RepurchaseCard } from "@/components/customer/CustomerKpiSection";
import { CustomerReviewSection } from "@/components/customer/CustomerReviewSection";
import { CustomerCrossSection } from "@/components/customer/CustomerCrossSection";
import { CustomerOnboarding } from "@/components/customer/CustomerOnboarding";
import { CustomerDemoBanner, CustomerDemoCta } from "@/components/customer/CustomerDemo";
import CustomerReportModal, { CustomerReportStrip } from "@/components/customer/CustomerReportModal";
import { useUIStore } from "@/stores/UIStore";
import { getEffectivePlan, useSubscriptionStore } from "@/stores/SubscriptionStore";
import { EmptyText, ErrorBox, LoadingBox } from "@/components/customer/CustomerUI";
import {
  PLATFORM_LABELS,
  platformAvailability,
  topicParticle,
} from "@/components/customer/customerFormat";

// 고객별로 저장해 두는 분석 묶음(브랜드명 목록)
const BRAND_SET_KEY = (email: string) => `customer-analysis-brand-set:${email}`;

const readStoredSet = (email: string): string[] | null => {
  if (!email) return null;
  try {
    const raw = JSON.parse(localStorage.getItem(BRAND_SET_KEY(email)) ?? "null");
    // 빈 배열 = 고객이 브랜드를 모두 뺀 상태(처음 화면을 보여준다)
    return Array.isArray(raw) && raw.every((x) => typeof x === "string") ? raw : null;
  } catch {
    return null;
  }
};

const writeStoredSet = (email: string, names: string[]) => {
  if (!email) return;
  try {
    localStorage.setItem(BRAND_SET_KEY(email), JSON.stringify(names));
  } catch {
    // 저장 못 해도 이번 화면에서는 그대로 쓴다
  }
};

// 기본 기준 브랜드 — 자사 브랜드가 있으면 그것, 없으면 첫 브랜드
const defaultBaseId = (list: CustomerBrand[]) =>
  (list.find((b) => b.isOwn) ?? list[0])?.brandId ?? null;

// 고객 분석 — 분석 묶음(브랜드 칩)의 리뷰로 고객 프로필·재구매·교차 구매를 본다.
// 처음 묶음은 GET /customer-analysis/brands(이번 달 관심 브랜드 픽 + 자사 여부 + 플랫폼 입점 상태),
// "+ 브랜드"·×로 고친 묶음은 브라우저에 고객별로 저장해 두고 ?names= 로 다시 불러온다.
function CustomerAnalysisPage() {
  const email = useUserStore((s) => s.email);
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const openTrialModal = useUIStore((s) => s.openTrialModal);
  const notStarted = useSubscriptionStore((s) => getEffectivePlan(s.subscription) === "none");
  // 예시 화면(Pro 미만) — 서버가 정한 묶음만 보고, 브랜드 추가·빼기·리뷰 분석 신청은 Pro 안내로 바뀐다
  const [demo, setDemo] = useState(false);
  // 예시 화면도 처음엔 사용 안내(CustomerOnboarding)를 먼저 — "예시 분석 보기"를 누르면 연다
  const [demoOpened, setDemoOpened] = useState(false);
  // 사용법(처음 화면) — 이 계정이 처음 들어오면 먼저 보여 주고, 이후엔 "사용법" 버튼으로 다시 연다
  const guideKey = `customer-analysis-guide-seen:${email}`;
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return !localStorage.getItem(guideKey);
    } catch {
      return false;
    }
  });
  // 로그인 정보(email)가 늦게 오면 그 계정 기준으로 다시 본다
  useEffect(() => {
    if (!email) return;
    try {
      setGuideOpen(!localStorage.getItem(guideKey));
    } catch {
      setGuideOpen(false);
    }
  }, [email, guideKey]);
  const closeGuide = () => {
    setGuideOpen(false);
    try {
      localStorage.setItem(guideKey, "1");
    } catch {
      // 저장이 막혀 있으면 다음에 또 보여 준다
    }
  };
  const openUpgrade = () => openSettingsModal("구독");
  const [isSetModalOpen, setSetModalOpen] = useState(false);
  // 맞춤 리포트 창(문서 + PDF 다운로드) — 리포트는 이 탭에서만 본다
  const [reportOpen, setReportOpen] = useState(false);
  // 헤더 "리뷰 분석 신청" — ""로 열면 브랜드명을 적는 칸이 나온다
  const [requestBrand, setRequestBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<CustomerBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [brandsReloadKey, setBrandsReloadKey] = useState(0);

  const [brandId, setBrandId] = useState<string | null>(null);
  // 브랜드마다 리뷰를 한 플랫폼에서만 받아서 플랫폼 선택은 없앴다 — 항상 전체(서버가 그 브랜드의 플랫폼을 쓴다)
  const platform: CustomerPlatformFilter = "all";
  const [period, setPeriod] = useState<CustomerPeriod>(12);

  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);
  const summaryRequestRef = useRef(0);

  useEffect(() => {
    let ignore = false;
    setBrandsLoading(true);
    setBrandsError(null);
    // 저장해 둔 묶음이 있으면 그 브랜드들로, 없거나 하나도 못 찾으면 기본 묶음으로
    // 개발 화면의 ?mockEmpty(목업)는 저장된 묶음도 무시하고 처음 화면을 보여준다
    const mockEmpty = import.meta.env.DEV && new URLSearchParams(window.location.search).has("mockEmpty");
    const stored = mockEmpty ? null : readStoredSet(email);
    (async () => {
      // 기본 묶음을 먼저 받아 예시 화면인지 본다 — 예시면 저장해 둔 묶음은 쓰지 않는다
      const base = await GetCustomerBrands();
      if (base.demo) return { list: base.brands ?? [], demo: true };
      if (stored && stored.length === 0) return { list: [], demo: false };
      const fromStored = stored ? (await GetCustomerBrands(stored)).brands ?? [] : [];
      return { list: fromStored.length > 0 ? fromStored : base.brands ?? [], demo: false };
    })()
      .then(({ list: all, demo: isDemo }) => {
        if (ignore) return;
        // 기본 묶음(관심 브랜드 전부)이나 예전에 저장한 묶음이 5개를 넘으면 자사 브랜드를 앞에 두고 5개만
        const list = [...all]
          .sort((a, b) => Number(!!b.isOwn) - Number(!!a.isOwn))
          .slice(0, CUSTOMER_BRAND_MAX);
        setDemo(isDemo);
        setBrands(list);
        setBrandId((prev) =>
          prev && list.some((b) => b.brandId === prev) ? prev : defaultBaseId(list),
        );
      })
      .catch((e: any) => {
        if (!ignore) setBrandsError(e?.message || "브랜드 목록을 불러오지 못했어요.");
      })
      .finally(() => {
        if (!ignore) setBrandsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [email, brandsReloadKey]);

  const brand = brands.find((b) => b.brandId === brandId);
  const availability = platformAvailability(brand, platform);

  const applySet = (list: CustomerBrand[]) => {
    if (demo) return;
    setBrands(list);
    writeStoredSet(email, list.map((b) => b.name));
    const keep = list.find((b) => b.brandId === brandId);
    const nextBase = keep ? keep.brandId : defaultBaseId(list);
    if (!keep) setBrandId(nextBase);
  };

  const handleRemoveBrand = (id: string) => {
    applySet(brands.filter((b) => b.brandId !== id));
  };

  // "+ 브랜드" 창에서 확인 — 이미 있던 브랜드는 그대로 두고, 새 브랜드만 정보를 받아 붙인다
  const [setSaving, setSetSaving] = useState(false);
  const handleConfirmSet = async (names: string[]) => {
    if (names.length === 0 || setSaving) return;
    const known = new Map(brands.map((b) => [b.name, b]));
    const missing = names.filter((n) => !known.has(n));
    setSetSaving(true);
    try {
      if (missing.length > 0) {
        const res = await GetCustomerBrands(missing);
        (res.brands ?? []).forEach((b) => known.set(b.name, b));
      }
      const next = names.map((n) => known.get(n)).filter((b): b is CustomerBrand => !!b);
      if (next.length > 0) applySet(next);
      setSetModalOpen(false);
    } catch (e: any) {
      alert(e?.message || "브랜드를 추가하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSetSaving(false);
    }
  };

  const handleBrandSelect = (id: string) => setBrandId(id);

  useEffect(() => {
    if (!brandId || availability !== "ok") {
      setSummary(null);
      return;
    }
    const id = ++summaryRequestRef.current;
    setSummaryLoading(true);
    setSummaryError(null);
    GetCustomerSummary(brandId, { period, platform })
      .then((res) => {
        if (id === summaryRequestRef.current) setSummary(res);
      })
      .catch((e: any) => {
        if (id !== summaryRequestRef.current) return;
        setSummary(null);
        setSummaryError(e?.message || "고객 분석을 불러오지 못했어요.");
      })
      .finally(() => {
        if (id === summaryRequestRef.current) setSummaryLoading(false);
      });
  }, [brandId, period, platform, availability, summaryReloadKey]);

  const renderBody = () => {
    if (!brand) return null;
    if (availability === "collecting") {
      return (
        <div className="rounded-xl border border-line-alt bg-fill-bg-strong px-5 py-12 text-center text-[14px] text-tx-alt">
          이 브랜드는 리뷰를 수집하는 중이에요. 내일 오전까지 반영돼요.
        </div>
      );
    }
    if (availability !== "ok") {
      const label = PLATFORM_LABELS[platform];
      return (
        <div className="rounded-xl border border-line-alt bg-fill-bg-strong px-5 py-12 text-center text-[14px] text-tx-alt">
          {availability === "unlisted"
            ? `${brand.name}${topicParticle(brand.name)} ${label}에 입점하지 않아 ${label} 리뷰가 없어요.`
            : `${brand.name}의 ${label} 리뷰는 아직 수집하지 않았어요.`}
        </div>
      );
    }
    if (summaryLoading && !summary) return <LoadingBox label="고객 분석을 불러오는 중…" />;
    if (summaryError && !summary)
      return <ErrorBox message={summaryError} onRetry={() => setSummaryReloadKey((k) => k + 1)} />;
    if (!summary) return null;
    if (summary.reviews === 0) return <EmptyText>이 기간에 수집한 리뷰가 없어요.</EmptyText>;
    return (
      <div className={`flex flex-col gap-8 ${summaryLoading ? "opacity-60" : ""}`}>
        <div className="flex flex-col gap-4">
          <CustomerKpiCards summary={summary} />
          <RepurchaseCard summary={summary} />
        </div>
        <CustomerReviewSection
          brandId={brand.brandId}
          period={period}
          platform={platform}
          summary={summary}
        />
        <CustomerCrossSection
          brandId={brand.brandId}
          brandName={brand.name}
          period={period}
          platform={platform}
          // 구매 브랜드는 교차 구매가 많은 상위 브랜드만 — 묶음 브랜드를 따로 붙이지 않는다(0명 "미포착" 줄이 생겨서)
          include={[]}
        />
        {demo && <CustomerDemoCta baseName={brand.name} onUpgrade={openUpgrade} />}
      </div>
    );
  };

  // 분석 화면(브랜드 칩·결과)이 보이는지 — 이때는 칩 위 리포트 줄이 있어서 머리말의 리포트 버튼은 숨긴다
  const analysisView =
    !brandsLoading && !brandsError && (demo ? demoOpened : brands.length > 0 && !guideOpen);

  return (
    <div className="flex flex-col w-full min-w-0 gap-6 px-4 sm:px-8 lg:px-14">
      <CustomerAnalysisHeader
        period={period}
        onPeriodChange={setPeriod}
        onRequestAnalysis={() => (demo ? openUpgrade() : setRequestBrand(""))}
        demo={demo}
        // 예시 화면은 사용 안내가 첫 화면이라 그 화면으로, 그 밖은 사용법 화면으로
        onOpenGuide={() => (demo ? setDemoOpened(false) : setGuideOpen(true))}
        onOpenReport={analysisView ? undefined : () => setReportOpen(true)}
      />

      {brandsLoading ? (
        <LoadingBox label="브랜드를 불러오는 중…" />
      ) : brandsError ? (
        <ErrorBox message={brandsError} onRetry={() => setBrandsReloadKey((k) => k + 1)} />
      ) : demo && !demoOpened ? (
        <CustomerOnboarding
          demo
          // 체험 전 고객은 무료체험부터 — 시작하면 이어서 예시 분석을 연다
          onSelectBrands={() => (notStarted ? openTrialModal(() => setDemoOpened(true)) : setDemoOpened(true))}
        />
      ) : brands.length === 0 && !demo ? (
        <CustomerOnboarding onSelectBrands={() => { closeGuide(); setSetModalOpen(true); }} />
      ) : !demo && guideOpen ? (
        // 브랜드가 있어도 처음엔 사용법부터 — 버튼을 누르면 분석 화면
        <CustomerOnboarding startLabel="고객 분석 시작하기" onSelectBrands={closeGuide} />
      ) : (
        <>
          {/* 리포트 박스를 맨 위에, 예시 안내는 칩 바로 위 한 줄로 */}
          <CustomerReportStrip onOpen={() => setReportOpen(true)} />
          {demo && (
            <CustomerDemoBanner brandNames={brands.map((b) => b.name)} onUpgrade={openUpgrade} />
          )}
          <BrandChips
            brands={brands}
            selectedId={brandId}
            onSelect={handleBrandSelect}
            onRemove={handleRemoveBrand}
            onAdd={() => (demo ? openUpgrade() : setSetModalOpen(true))}
            demo={demo}
          />
          {renderBody()}
        </>
      )}
      <AnalysisRequestDialog brand={requestBrand} onClose={() => setRequestBrand(null)} />
      <CustomerReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      {/* 브랜드가 없을 때(처음 화면)도 같은 창으로 고른다 */}
      <CustomerBrandSetModal
        isOpen={isSetModalOpen}
        onClose={() => setSetModalOpen(false)}
        value={brands.map((b) => b.name)}
        onConfirm={handleConfirmSet}
      />
    </div>
  );
}

export default CustomerAnalysisPage;
