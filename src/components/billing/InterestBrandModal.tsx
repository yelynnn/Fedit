import { Icon } from "@iconify/react";
import Modal from "react-modal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { useUIStore } from "@/stores/UIStore";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from "@/stores/SubscriptionStore";
import { GetBrandList, GetBrandPicks, PutBrandPicks } from "@/apis/AnalysisAPI";
import pointIcon from "@/assets/etc/pointIcon.svg";
import { INDEX_LETTERS, getIndexKey } from "@/lib/hangulIndex";
import { getBrandCap } from "@/lib/brandCap";
import { useUserStore } from "@/stores/UserStore";
import { updateMonitoredBrands } from "@/lib/analytics";

type ApiCategory = { label: string; brands: string[] };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  // "signup"(기본): 첫 결제 직후 빈 상태에서 새로 선택.
  // "change": 설정 화면에서 이미 저장된 픽을 불러와 수정.
  mode?: "signup" | "change";
  // true면 mode="change"로 불러온 기존 픽(originalPicksRef)을 뺄 수 없게
  // 막는다 — 설정 페이지의 "브랜드 추가하기"(자리가 남았을 때, 언제든
  // 가능)처럼 순수 추가만 허용하고 싶을 때 쓴다. "변경하기"(월 1회 제한이
  // 걸리는 실제 교체)에서는 false로 둬서 자유롭게 빼고 바꿀 수 있게 한다.
  lockExistingPicks?: boolean;
};

export default function InterestBrandModal({
  isOpen,
  onClose,
  onComplete,
  mode = "signup",
  lockExistingPicks = false,
}: Props) {
  const email = useUserStore((s) => s.email);
  const brandList = useFilterStore((s) => s.brandList);
  const addBrand = useFilterStore((s) => s.addBrand);
  const removeBrand = useFilterStore((s) => s.removeBrand);
  const resetBrand = useFilterStore((s) => s.resetBrand);
  const setBrandList = useFilterStore((s) => s.setBrandList);
  const setInterestBrandPicks = useFilterStore((s) => s.setInterestBrandPicks);
  const setLastBrandPicksSavedAt = useFilterStore(
    (s) => s.setLastBrandPicksSavedAt,
  );
  const setBrandPicksEditing = useUIStore((s) => s.setBrandPicksEditing);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const currentPlan = toBillingPlan(getEffectivePlan(subscription));
  const isProPlan = currentPlan === "pro";
  const cap = getBrandCap(currentPlan);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  // "change" 모드에서 처음 불러온 픽. 저장 시 이 목록을 그대로 포함하는
  // 순수 추가(제거/교체 없음)인지 판단해 월 1회 변경 제한 소진 여부를 정한다.
  const originalPicksRef = useRef<string[]>([]);

  // 이 모달이 열려있는 동안(온보딩용 전역 인스턴스든, 설정 페이지의 "변경하기"
  // 로컬 인스턴스든) brandList를 편집 중임을 전역에 알려서, 다른 곳의 서버 픽
  // 동기화가 편집 중인 값을 덮어쓰지 않게 한다.
  useEffect(() => {
    setBrandPicksEditing(isOpen);
    return () => setBrandPicksEditing(false);
  }, [isOpen, setBrandPicksEditing]);

  // 대시보드 브랜드 필터(전역 상태)를 재사용하다 보니, 예전에 걸어둔 필터가
  // 남아있으면 온보딩이 이미 선택된 것처럼 보일 수 있어 모달을 열 때마다 초기화한다.
  // "change" 모드는 처음부터 다시 고르는 게 아니라 기존에 저장해둔 픽을 불러와
  // 수정하는 화면이라, 리셋 대신 서버에 저장된 현재 픽으로 채운다.
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "change") {
      GetBrandPicks()
        .then((picks) => {
          originalPicksRef.current = picks;
          setBrandList(picks);
        })
        .catch(() => resetBrand());
    } else {
      originalPicksRef.current = [];
      resetBrand();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await GetBrandList();
        if (ignore) return;
        const allCats: ApiCategory[] = Array.isArray(data?.categories)
          ? data.categories
          : [];
        // 무신사 입점 브랜드는 관심 브랜드와 무관하게 기본으로 제공되므로
        // 여기서 따로 고를 필요가 없어 탭에서 제외한다.
        const cats = allCats.filter((c) => !c.label.includes("무신사"));
        setCategories(cats);
        if (cats.length > 0) setActiveTab(cats[0].label);
      } catch (e: any) {
        if (ignore) return;
        setErr(e?.message || "브랜드 목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const sourceBrands = useMemo(() => {
    const cat = categories.find((c) => c.label === activeTab);
    const brands = cat?.brands ?? [];
    return [...brands].sort((a, b) => a.localeCompare(b, "ko"));
  }, [activeTab, categories]);

  const visibleBrands = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return k
      ? sourceBrands.filter((b) => b.toLowerCase().includes(k))
      : sourceBrands;
  }, [keyword, sourceBrands]);

  // 각 초성 그룹에서 처음 등장하는 브랜드에만 앵커를 달아 인덱스 클릭 시 스크롤 이동
  const anchorKeys = useMemo(() => {
    const seen = new Set<string>();
    const map = new Map<string, string>(); // brand -> letter
    visibleBrands.forEach((b) => {
      const key = getIndexKey(b);
      if (!seen.has(key)) {
        seen.add(key);
        map.set(b, key);
      }
    });
    return map;
  }, [visibleBrands]);

  const availableLetters = useMemo(
    () => new Set(Array.from(anchorKeys.values())),
    [anchorKeys],
  );

  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const jumpToLetter = (letter: string) => {
    if (!availableLetters.has(letter)) return;
    setActiveLetter(letter);
    const target = listRef.current?.querySelector(
      `[data-anchor-letter="${letter}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 스크롤 위치에 따라 현재 보이는 구간의 초성을 자동으로 활성화
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const containerTop = el.getBoundingClientRect().top;
    const anchors = Array.from(
      el.querySelectorAll<HTMLElement>("[data-anchor-letter]"),
    );
    let current: string | undefined;
    for (const node of anchors) {
      const top = node.getBoundingClientRect().top - containerTop;
      if (top <= 12) {
        current = node.dataset.anchorLetter;
      } else {
        break;
      }
    }
    if (current) setActiveLetter(current);
  }, []);

  useEffect(() => {
    handleScroll();
  }, [visibleBrands, handleScroll]);

  const isFull = brandList.length >= cap;
  const remaining = cap - brandList.length;

  const isLockedBrand = (brand: string) =>
    lockExistingPicks && originalPicksRef.current.includes(brand);

  const toggleBrand = (brand: string) => {
    if (brandList.includes(brand)) {
      if (isLockedBrand(brand)) return;
      removeBrand(brand);
    } else if (!isFull) {
      addBrand(brand);
    }
  };

  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const nextCycleLabel = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, []);

  const canSubmit = brandList.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setShowStartConfirm(true);
  };

  // 기존에 골라둔 브랜드를 그대로 두고 자리만 더 채운 경우(순수 추가)인지.
  const isPureAddition =
    mode === "change" &&
    originalPicksRef.current.every((b) => brandList.includes(b));
  // 이번 저장으로 상한(cap)을 다 채웠는지. 순수 추가라도 상한을 다 채우면
  // "다 골랐다"고 보고 이번 주기 변경 횟수를 소진한 것으로 친다 — 실제로
  // 빼거나 바꾼 경우도 당연히 소진한다. 자리가 남아있는 순수 추가만 언제든
  // 다시 할 수 있게 소진하지 않는다.
  const reachedCap = brandList.length >= cap;
  const consumesMonthlyChange = !isPureAddition || reachedCap;

  const handleConfirmStart = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await PutBrandPicks(brandList);
      setInterestBrandPicks(brandList);
      updateMonitoredBrands(email, brandList);
      if (consumesMonthlyChange) {
        setLastBrandPicksSavedAt(new Date().toISOString());
      }
      setShowStartConfirm(false);
      onComplete?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "브랜드 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const parentSelector = useCallback(
    () => document.getElementById("modal-root") as HTMLElement,
    [],
  );

  // react-modal은 포털로 렌더링되는데, 포털 안 클릭 이벤트는 실제 DOM이 아니라
  // React 컴포넌트 트리를 따라 버블링된다. 이 모달을 설정 페이지 안에서 로컬로
  // 띄우는 경우, 오버레이(배경) 클릭이든 내부 콘텐츠 클릭이든 계속 위로 올라가
  // 설정 모달의 배경 클릭(닫기) 핸들러까지 닿아버려서, 브랜드 칩을 누르거나
  // 오버레이를 눌러 이 모달을 닫을 때 설정 모달까지 같이 닫히는 문제가 있었다.
  // Modal 전체(오버레이 포함)를 감싸서 전파를 여기서 끊는다.
  return (
    <div className="contents" onClick={(e) => e.stopPropagation()}>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        ariaHideApp={false}
        parentSelector={parentSelector}
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
        className="box-border flex h-[740px] w-[1060px] gap-6 rounded-2xl border border-[#E4E4E4] bg-white p-9 shadow-[0_0_30px_0_rgba(0,0,0,0.04)] outline-none"
        shouldCloseOnOverlayClick
      >
        {/* 좌: 헤더 + 선택 현황 + 액션 버튼 */}
        <div className="flex h-full w-[460px] flex-shrink-0 flex-col gap-6">
          <div className="flex flex-col items-start w-full gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0B0E0F] px-3 py-1.5 text-[13px] text-white">
              {mode === "change" ? (
                "분석 브랜드 변경"
              ) : (
                <>
                  <span className="font-bold">
                    {isProPlan ? "PRO" : "BASIC"}
                  </span>{" "}
                  플랜 설정
                </>
              )}
            </span>
            <h1 className="text-[24px] font-semibold leading-[133%] tracking-[-0.48px] text-[#0B0E0F]">
              관심 브랜드를 최대 {cap}개까지 선택해주세요
            </h1>
            {mode === "change" ? (
              <p className="text-[15px] leading-[150%] text-[#6F7173]">
                이번 주기에 분석할 브랜드를 최대 {cap}개까지 골라주세요.
                <br />
                저장하면 다음 결제일{" "}
                <b className="font-semibold text-[#3D3F41]">{nextCycleLabel}</b>
                까지 유지돼요.
              </p>
            ) : (
              <p className="text-[15px] leading-[150%] text-[#6F7173]">
                선택한 브랜드를 기준으로 트렌드와 분석을 보여드려요.
                <br />
                선택한 브랜드를 다른 브랜드로 바꾸는 건 다음 결제일(
                <b className="font-semibold text-[#3D3F41]">{nextCycleLabel}</b>
                )부터 가능하고, 추가 브랜드 선택은 언제든 할 수 있어요.
              </p>
            )}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E4E4E4] p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0B0E0F] text-[12px] font-semibold text-white">
                  {brandList.length}
                </span>
                <span className="text-[14px] font-medium text-[#3D3F41]">
                  / {cap} 선택
                </span>
              </div>
              <span className="text-[12px] text-[#A1A3A5]">
                {isFull
                  ? "모두 선택했어요!"
                  : brandList.length > 0
                    ? `최대 ${remaining}개 더 선택할 수 있어요`
                    : "브랜드를 선택해주세요"}
              </span>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E4E4E4]">
              <div
                className="h-full rounded-full bg-[#0B0E0F] transition-all"
                style={{
                  width: `${(brandList.length / cap) * 100}%`,
                }}
              />
            </div>

            <div
              className={
                brandList.length === 0
                  ? "flex flex-1 flex-col items-center justify-center gap-3"
                  : "flex-1 mt-5 overflow-y-auto"
              }
            >
              {brandList.length === 0 ? (
                <>
                  <img src={pointIcon} alt="" className="h-11 w-11" />
                  <p className="text-center type-title-small text-tx-alt">
                    먼저, 우측패널에서
                    <br />
                    브랜드를 선택해주세요
                  </p>
                </>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {brandList.map((brand) => {
                    const locked = isLockedBrand(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => (locked ? undefined : removeBrand(brand))}
                        disabled={locked}
                        title={locked ? "이미 저장된 브랜드는 변경하기에서만 뺄 수 있어요" : undefined}
                        className={[
                          "inline-flex h-10 items-center gap-2 rounded-lg px-4 py-2 text-[16px] font-medium leading-[150%] tracking-[-0.08px]",
                          locked
                            ? "cursor-default bg-[#3D3F41] text-white"
                            : "bg-[#0B0E0F] text-white",
                        ].join(" ")}
                      >
                        <span>{brand}</span>
                        {!locked && (
                          <Icon icon="mdi:close" className="flex-shrink-0 w-4 h-4" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center flex-shrink-0 w-full gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={[
                "flex h-[46px] w-full items-center justify-center gap-1 rounded-md px-3 py-2 type-title-medium transition-colors",
                canSubmit
                  ? "bg-[#0B0E0F] text-tx-inverse hover:bg-black"
                  : "bg-[#F4F4F5] text-[#A1A3A5] cursor-not-allowed",
              ].join(" ")}
            >
              {mode === "change"
                ? "이 구성으로 저장하기"
                : "이 브랜드로 FEDIT 시작하기"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="type-title-medium text-center text-[#56585A] hover:text-tx-neutral"
            >
              나중에 하기
            </button>
          </div>
        </div>

        {/* 우: 브랜드 탐색 */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <div className="flex items-center gap-2 rounded-xl border border-[#E4E4E4] px-4 py-3">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="브랜드를 검색하세요."
              className="flex-1 text-sm outline-none placeholder:text-[#A1A3A5]"
            />
            <Icon
              icon="mingcute:search-line"
              className="h-5 w-5 flex-shrink-0 text-[#A1A3A5]"
            />
          </div>

          <div className="mt-4 flex items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-[#E4E4E4]">
            {categories.map((c) => {
              const active = c.label === activeTab;
              return (
                <button
                  key={c.label}
                  onClick={() => setActiveTab(c.label)}
                  className={[
                    "pb-2.5 -mb-px shrink-0 text-[15px] font-semibold transition-colors",
                    active
                      ? "text-[#0B0E0F] border-b-2 border-[#0B0E0F]"
                      : "text-[#A1A3A5] border-b-2 border-transparent hover:text-[#3D3F41]",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[13px] text-[#A1A3A5]">
            {visibleBrands.length}개
          </p>

          <div className="relative flex-1 mt-2 overflow-hidden">
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto pr-10 [&::-webkit-scrollbar-thumb]:bg-white"
            >
              {loading ? (
                <div className="py-10 text-center text-sm text-[#A1A3A5]">
                  불러오는 중…
                </div>
              ) : err ? (
                <div className="py-10 text-sm text-center text-red-500">
                  {err}
                </div>
              ) : visibleBrands.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#A1A3A5]">
                  검색 결과가 없어요.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {visibleBrands.map((brand) => {
                    const selected = brandList.includes(brand);
                    const locked = selected && isLockedBrand(brand);
                    const letter = anchorKeys.get(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        data-anchor-letter={letter ?? undefined}
                        onClick={() => toggleBrand(brand)}
                        disabled={(!selected && isFull) || locked}
                        title={locked ? "이미 저장된 브랜드는 변경하기에서만 뺄 수 있어요" : undefined}
                        className={[
                          "flex items-center justify-center gap-2 rounded-md px-4 py-2 type-body-medium transition-colors",
                          selected
                            ? "bg-[#0B0E0F] text-white"
                            : "border border-line-alt bg-fill-bg-strong text-tx-neutral hover:border-[#0B0E0F]",
                          !selected && isFull
                            ? "cursor-not-allowed opacity-40"
                            : "",
                          locked ? "cursor-default" : "",
                        ].join(" ")}
                      >
                        {locked && (
                          <Icon icon="ph:check-bold" className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span className="truncate">{brand}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 자모 인덱스 — 스크롤바가 글자보다 오른쪽에 오도록 리스트 위에 오버레이로 배치 */}
            <div className="absolute inset-y-0 flex flex-col items-center w-6 gap-1 py-1 pointer-events-none right-4">
              {INDEX_LETTERS.map((letter) => {
                const available = availableLetters.has(letter);
                const active = activeLetter === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => jumpToLetter(letter)}
                    disabled={!available}
                    className={[
                      "pointer-events-auto flex h-6 w-6 items-center justify-center rounded-pill p-1 text-xs transition-colors",
                      active
                        ? "bg-[var(--color-fill-normal-interaction-pressed)] font-semibold text-tx-strong"
                        : available
                          ? "text-[#A1A3A5] hover:text-[#3D3F41]"
                          : "text-[#E4E4E4]",
                    ].join(" ")}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {showStartConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
            <div className="flex w-[480px] flex-col items-center gap-5 rounded-2xl bg-white p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFFBF3]">
                <Icon
                  icon="ph:storefront-bold"
                  className="w-5 h-5 text-tx-strong"
                />
              </div>
              <h2 className="text-center text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-tx-strong">
                {mode === "change"
                  ? `이 ${brandList.length}개 브랜드로 변경할까요?`
                  : `이 ${brandList.length}개 브랜드로 분석을 시작할까요?`}
              </h2>
              <div className="w-full rounded-xl bg-fill-bg-strong p-4 text-[14px] leading-[150%] text-tx-neutral">
                {isPureAddition && !reachedCap ? (
                  <>
                    기존에 고른 브랜드는 그대로 두고 브랜드만 추가돼요. 남은
                    자리는 이후에도 언제든 채울 수 있어요.
                  </>
                ) : isPureAddition ? (
                  <>
                    이제 최대 개수를 다 채웠어요. <b className="font-semibold">{nextCycleLabel}</b>
                    까지 이 구성으로 분석하고, 브랜드 교체는 다음 결제일부터
                    가능해요.
                  </>
                ) : (
                  <>
                    <b className="font-semibold">{nextCycleLabel}</b>까지 이
                    구성으로 분석해요. 브랜드 교체는 다음 결제일부터, 추가
                    선택은 언제든 가능해요.
                  </>
                )}
              </div>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setShowStartConfirm(false)}
                  disabled={isSaving}
                  className="h-[46px] flex-1 rounded-md border border-[#E4E4E4] type-title-medium text-tx-neutral hover:bg-fill-bg-strong disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStart}
                  disabled={isSaving}
                  className="h-[46px] flex-1 rounded-md bg-fill-primary type-title-medium text-tx-inverse disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "저장 중..."
                    : mode === "change"
                      ? "변경하기"
                      : "분석 시작하기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
