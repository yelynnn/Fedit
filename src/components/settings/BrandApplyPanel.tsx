import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GetBrandList, PostBrandApply } from "@/apis/AnalysisAPI";
import { INDEX_LETTERS, getIndexKey } from "@/lib/hangulIndex";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from "@/stores/SubscriptionStore";

type ApiCategory = { label: string; brands: string[] };

// 설정 > 고객 지원 > 브랜드 입점 신청. BrandFilterModal의 브랜드 탐색(탭 +
// 검색 + 초성 인덱스) UI를 재사용하되, 여기서는 필터로 쓰려는 게 아니라
// "이미 있는 브랜드인지 둘러보고, 없으면 입점 신청"이 목적이라 브랜드
// 선택/토글 기능은 빼고 조회 전용으로 둔다.
export default function BrandApplyPanel() {
  const { subscription } = useSubscriptionStore((s) => s);
  const isFree = toBillingPlan(getEffectivePlan(subscription)) === "free";
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await GetBrandList();
        if (ignore) return;
        const cats: ApiCategory[] = Array.isArray(data?.categories)
          ? data.categories
          : [];
        setCategories(cats);
        if (cats.length > 0) setActiveTab(cats[0].label);
      } catch (e: any) {
        if (!ignore) setErr(e?.message || "브랜드 목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const sourceBrands = useMemo(() => {
    const cat = categories.find((c) => c.label === activeTab);
    return cat?.brands ?? [];
  }, [activeTab, categories]);

  const visibleBrands = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return k
      ? sourceBrands.filter((b) => b.toLowerCase().includes(k))
      : sourceBrands;
  }, [keyword, sourceBrands]);

  const anchorKeys = useMemo(() => {
    const seen = new Set<string>();
    const map = new Map<string, string>();
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

  const jumpToLetter = (letter: string) => {
    if (!availableLetters.has(letter)) return;
    setActiveLetter(letter);
    const target = listRef.current?.querySelector(
      `[data-anchor-letter="${letter}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const containerTop = el.getBoundingClientRect().top;
    const anchors = Array.from(
      el.querySelectorAll<HTMLElement>("[data-anchor-letter]"),
    );
    let current: string | undefined;
    for (const node of anchors) {
      const top = node.getBoundingClientRect().top - containerTop;
      if (top <= 12) current = node.dataset.anchorLetter;
      else break;
    }
    if (current) setActiveLetter(current);
  };

  useEffect(() => {
    handleScroll();
  }, [visibleBrands]);

  const handleApplyClick = () => {
    if (!keyword.trim() || isApplying) return;
    if (isFree) {
      alert("무료 플랜에서는 제공하지 않는 기능이에요. 요금제를 업그레이드하면 이용할 수 있어요.");
      return;
    }
    setShowApplyConfirm(true);
  };

  const handleConfirmApply = async () => {
    const brand = keyword.trim();
    if (!brand || isApplying) return;
    setIsApplying(true);
    try {
      await PostBrandApply(brand);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setShowToast(true);
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
      setKeyword("");
      setShowApplyConfirm(false);
    } catch (e: any) {
      alert(e?.message || "신청에 실패했습니다.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-[680px]">
      <h1 className="text-2xl font-semibold text-[#0B0E0F]">
        브랜드 분석 신청
      </h1>
      <p className="mt-1 mb-6 text-base font-medium text-[#6F7173]">
        찾으시는 브랜드가 없다면 검색 후 신청해보세요.
      </p>

      <div className="flex items-center gap-2 px-4 py-3 border rounded-xl border-line-alt">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="브랜드를 검색하세요."
          className="flex-1 text-sm outline-none placeholder:text-icon-alt"
        />
        <Icon
          icon="mingcute:search-line"
          className="flex-shrink-0 w-4 h-4 text-icon-alt"
        />
      </div>

      {loading ? (
        <div className="py-10 text-sm text-center text-icon-neutral">
          불러오는 중…
        </div>
      ) : err ? (
        <div className="py-10 text-sm text-center text-red-500">{err}</div>
      ) : (
        <>
          <div className="flex items-center gap-6 mt-4 overflow-x-auto border-b whitespace-nowrap border-line-divider">
            {categories.map((c) => {
              const active = c.label === activeTab;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    setActiveTab(c.label);
                    setKeyword("");
                  }}
                  className={[
                    "-mb-px shrink-0 pb-2.5 text-[15px] font-semibold transition-colors",
                    active
                      ? "border-b-2 border-tx-strong text-tx-strong"
                      : "border-b-2 border-transparent text-icon-neutral hover:text-tx-neutral",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[13px] text-icon-alt">
            {visibleBrands.length}개
          </p>

          {keyword.trim() !== "" && visibleBrands.length === 0 ? (
            <div className="flex items-center justify-between gap-4 p-4 mt-4 rounded-lg bg-fill-bg-strong">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-icon-neutral">
                  검색 결과
                </span>
                <span className="text-sm font-medium text-tx-neutral">
                  "{keyword.trim()}" 브랜드가 없어요.
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyClick}
                disabled={isApplying}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-line-divider bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon
                  icon="solar:shop-2-linear"
                  className="w-4 h-4 text-tx-neutral"
                />
                <span className="text-xs font-semibold text-tx-neutral">
                  {isApplying ? "신청 중..." : "신규 브랜드 신청하기"}
                </span>
              </button>
            </div>
          ) : (
            <div className="relative mt-2 h-[360px]">
              <div
                ref={listRef}
                onScroll={handleScroll}
                className="h-full pr-8 overflow-y-auto"
              >
                <div className="flex flex-wrap gap-2">
                  {visibleBrands.map((brand) => (
                    <div
                      key={brand}
                      data-anchor-letter={anchorKeys.get(brand)}
                      className="inline-flex items-center justify-center max-w-full px-4 py-2 truncate border rounded-md border-line-alt bg-fill-bg-strong type-body-medium text-tx-neutral"
                    >
                      {brand}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute inset-y-0 right-0 flex flex-col items-center w-6 gap-1 py-1 pointer-events-none">
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
                        "pointer-events-auto flex h-6 w-6 items-center justify-center rounded-pill p-1 text-[11px] transition-colors",
                        active
                          ? "bg-[var(--color-fill-normal-interaction-pressed)] font-semibold text-tx-strong"
                          : available
                            ? "text-icon-alt hover:text-tx-neutral"
                            : "text-line-alt",
                      ].join(" ")}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showApplyConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="flex w-[480px] flex-col items-center gap-5 rounded-2xl bg-white p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFFBF3]">
              <Icon
                icon="solar:shop-2-linear"
                className="w-5 h-5 text-tx-strong"
              />
            </div>
            <h2 className="text-center text-[18px] font-semibold leading-[144%] tracking-[-0.09px] text-tx-strong">
              "{keyword.trim()}" 브랜드를 입점 신청할까요?
            </h2>
            <div className="w-full rounded-xl bg-fill-bg-strong p-4 text-[14px] leading-[150%] text-tx-neutral">
              입력하신 브랜드명이 맞는지 다시 한번 확인해주세요. 신청 후에는
              취소할 수 없고, 신청일로부터 3일 내로 반영해드릴게요.
            </div>
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => setShowApplyConfirm(false)}
                disabled={isApplying}
                className="h-[46px] flex-1 rounded-md border border-[#E4E4E4] type-title-medium text-tx-neutral hover:bg-fill-bg-strong disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                disabled={isApplying}
                className="h-[46px] flex-1 rounded-md bg-fill-primary type-title-medium text-tx-inverse disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApplying ? "신청 중..." : "신청하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-tx-neutral px-4 py-3 text-white shadow-xl">
          <Icon icon="ph:check-circle-fill" className="flex-shrink-0 w-4 h-4" />
          <span className="text-sm font-semibold whitespace-nowrap">
            신규 브랜드 신청이 완료됐어요. 신청 후 3일 내로 반영해드릴게요.
          </span>
        </div>
      )}
    </div>
  );
}
