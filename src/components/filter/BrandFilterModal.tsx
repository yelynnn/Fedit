import { Icon } from "@iconify/react";
import Modal from "react-modal";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from "@/stores/SubscriptionStore";
import { GetBrandList, PostBrandApply } from "@/apis/AnalysisAPI";
import { INDEX_LETTERS, getIndexKey } from "@/lib/hangulIndex";
import cancelIcon from "@/assets/etc/cancel.svg";

type ApiCategory = { label: string; brands: string[] };
type TabKey = "selected" | string;
type Props = { isOpen: boolean; onClose: () => void; onSubmit?: () => void };

// 무신사/29cm는 입점 브랜드가 100개 넘어서, 이 탭에서 "전체 선택"하면
// 브랜드명을 하나하나 담는 대신 플랫폼 코드 하나(selectedPlatforms)로
// 보낸다 — 개별 브랜드명을 다 나열하면 상품 목록 요청 헤더가 너무 커진다.
const PLATFORM_LABEL_TO_CODE: Record<string, string> = {
  무신사: "musinsa",
  "29cm": "29cm",
};

export default function BrandFilterModal({ isOpen, onClose, onSubmit }: Props) {
  const brandList = useFilterStore((s) => s.brandList);
  const platformList = useFilterStore((s) => s.platformList);
  const setPlatformList = useFilterStore((s) => s.setPlatformList);
  const resetPlatform = useFilterStore((s) => s.resetPlatform);
  const interestBrandPicks = useFilterStore((s) => s.interestBrandPicks);
  const addBrand = useFilterStore((s) => s.addBrand);
  const resetBrand = useFilterStore((s) => s.resetBrand);
  const removeBrand = useFilterStore((s) => s.removeBrand);
  const { subscription } = useSubscriptionStore((s) => s);
  const currentPlan = toBillingPlan(getEffectivePlan(subscription));
  const isBasic = currentPlan === "basic";
  const isFree = currentPlan === "free";
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("selected");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isApplyingBrand, setIsApplyingBrand] = useState(false);
  const [showApplyToast, setShowApplyToast] = useState(false);
  const applyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;

    const canScrollLeft = el.scrollLeft > 0;
    const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

    setShowLeft(canScrollLeft);
    setShowRight(canScrollRight);
  };

  const scrollLeftFn = () => {
    scrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
    setTimeout(updateScrollButtons, 250);
  };

  const scrollRightFn = () => {
    scrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });
    setTimeout(updateScrollButtons, 250);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = rect.width / 2;
    if (x < half) setHoverSide("left");
    else setHoverSide("right");
  };

  useEffect(() => {
    let ignore = false;
    const fetch = async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await GetBrandList();
        if (ignore) return;
        const cats = Array.isArray(data?.categories) ? data.categories : [];
        setCategories(cats);
        if (cats.length > 0) setActiveTab(cats[0].label);
      } catch (e: any) {
        if (ignore) return;
        setErr(e?.message || "브랜드 목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetch();
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const tabItems = useMemo<{ key: TabKey; label: string }[]>(
    () => [
      { key: "selected", label: "선택된 브랜드" },
      ...categories.map((c) => ({ key: c.label, label: `${c.label}` })),
    ],
    [categories],
  );

  const sourceBrands = useMemo<string[]>(() => {
    if (activeTab === "selected") return brandList;
    const cat = categories.find((c) => c.label === activeTab);
    return cat?.brands ?? [];
  }, [activeTab, brandList, categories]);

  const activePlatformCode = PLATFORM_LABEL_TO_CODE[activeTab];
  const isPlatformFullySelected =
    !!activePlatformCode && platformList.includes(activePlatformCode);
  const platformBrandCount = (code: string) =>
    categories.find((c) => PLATFORM_LABEL_TO_CODE[c.label] === code)?.brands
      .length ?? 0;
  const totalSelectedCount =
    brandList.length +
    platformList.reduce((sum, code) => sum + platformBrandCount(code), 0);

  // Basic 플랜은 관심 브랜드 10개 + 무신사 입점 브랜드만, 무료 플랜은 무신사
  // 입점 브랜드만 이용 가능하므로, 그 외 카테고리 탭에서는 이미 선택된(=관심
  // 브랜드로 고른) 것 외에는 새로 추가하지 못하도록 막는다. 무료 플랜은
  // interestBrandPicks가 항상 비어 있어 아래 isBrandDisabled에서 자연히
  // 전부 잠긴다. "선택된 브랜드" 탭과 무신사 탭은 예외.
  const isRestrictedTab =
    (isBasic || isFree) &&
    activeTab !== "selected" &&
    !activeTab.includes("무신사");

  const visibleBrands = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const filtered = k
      ? sourceBrands.filter((b) => b.toLowerCase().includes(k))
      : sourceBrands;
    if (!isRestrictedTab) return filtered;
    // 제한된 탭에서는 선택 가능한(관심 브랜드) 칩을 앞쪽으로 모아 보여준다.
    const selectable = filtered.filter((b) => interestBrandPicks.includes(b));
    const locked = filtered.filter((b) => !interestBrandPicks.includes(b));
    return [...selectable, ...locked];
  }, [keyword, sourceBrands, isRestrictedTab, interestBrandPicks]);

  // 우측 초성 인덱스 — 각 초성 그룹에서 처음 등장하는 브랜드에만 앵커를 달아
  // 인덱스 클릭 시 스크롤 이동, 스크롤 위치에 따라 현재 구간 자동 활성화
  const brandListScrollRef = useRef<HTMLDivElement>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

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
    const target = brandListScrollRef.current?.querySelector(
      `[data-anchor-letter="${letter}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBrandListScroll = useCallback(() => {
    const el = brandListScrollRef.current;
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
    handleBrandListScroll();
  }, [visibleBrands, handleBrandListScroll]);

  // 허용 여부는 지금 필터링 중인 brandList가 아니라, 저장된 관심 브랜드
  // 10개(interestBrandPicks) 기준으로 판단해야 한다. brandList로 판단하면
  // 10개 중 일부만 보려고 체크를 풀었을 때 그 브랜드가 잠겨서 다시 못 고르게 된다.
  const isBrandDisabled = (brand: string) =>
    isRestrictedTab && !interestBrandPicks.includes(brand);

  const allVisibleChecked = useMemo(() => {
    if (isPlatformFullySelected) return true;
    return (
      visibleBrands.length > 0 &&
      visibleBrands.every((b) => brandList.includes(b))
    );
  }, [visibleBrands, brandList, isPlatformFullySelected]);

  const toggleAllVisible = () => {
    // 무신사/29cm 탭에서 검색 중이 아니면 "전체 선택"을 플랫폼 단위로
    // 처리한다 — 브랜드 100개 넘게 개별로 담으면 상품 목록 요청 헤더가
    // 너무 커진다.
    if (activePlatformCode && keyword.trim() === "") {
      if (isPlatformFullySelected) {
        setPlatformList(platformList.filter((p) => p !== activePlatformCode));
      } else {
        sourceBrands.forEach((b) => brandList.includes(b) && removeBrand(b));
        setPlatformList([...platformList, activePlatformCode]);
      }
      return;
    }
    if (allVisibleChecked) {
      visibleBrands.forEach((b) => brandList.includes(b) && removeBrand(b));
    } else {
      visibleBrands.forEach(
        (b) => !brandList.includes(b) && !isBrandDisabled(b) && addBrand(b),
      );
    }
  };

  const toggleOne = (brand: string) => {
    if (isBrandDisabled(brand)) return;
    if (isPlatformFullySelected && activePlatformCode) {
      // 플랫폼 통째로 선택된 상태에서 하나만 해제 — 플랫폼 선택을 풀고
      // 나머지 브랜드들은 개별로 다시 채워 넣는다.
      setPlatformList(platformList.filter((p) => p !== activePlatformCode));
      sourceBrands.forEach((b) => {
        if (b !== brand) addBrand(b);
      });
      return;
    }
    if (brandList.includes(brand)) removeBrand(brand);
    else addBrand(brand);
  };

  const parentSelector = useCallback(
    () => document.getElementById("modal-root") as HTMLElement,
    [],
  );

  useEffect(() => {
    return () => {
      if (applyToastTimerRef.current) clearTimeout(applyToastTimerRef.current);
    };
  }, []);

  const handleApplyBrand = async () => {
    const brand = keyword.trim();
    if (!brand || isApplyingBrand) return;
    setIsApplyingBrand(true);
    try {
      await PostBrandApply(brand);
      if (applyToastTimerRef.current) clearTimeout(applyToastTimerRef.current);
      setShowApplyToast(true);
      applyToastTimerRef.current = setTimeout(() => setShowApplyToast(false), 3000);
    } catch (error: any) {
      alert(error?.message || "입점 신청에 실패했습니다.");
    } finally {
      setIsApplyingBrand(false);
    }
  };

  const Chip = ({
    brand,
    checked,
    disabled,
    anchorLetter,
    onClick,
  }: {
    brand: string;
    checked?: boolean;
    disabled?: boolean;
    anchorLetter?: string;
    onClick?: () => void;
  }) => (
    <button
      type="button"
      data-anchor-letter={anchorLetter ?? undefined}
      onClick={onClick}
      disabled={disabled}
      title={
        disabled
          ? isFree
            ? "무료 플랜은 무신사 입점 브랜드만 이용할 수 있어요"
            : "관심 브랜드 10개 또는 무신사 입점 브랜드만 이용 가능해요"
          : undefined
      }
      className={
        checked
          ? "inline-flex items-center justify-center gap-2 rounded-md bg-fill-primary-hover px-4 py-2 type-body-medium text-tx-inverse"
          : disabled
            ? "inline-flex items-center justify-center gap-2 rounded-md border border-line-alt bg-fill-bg-strong px-4 py-2 type-body-medium text-tx-neutral opacity-40 cursor-not-allowed"
            : "inline-flex items-center justify-center gap-2 rounded-md border border-line-alt bg-fill-bg-strong px-4 py-2 type-body-medium text-tx-neutral hover:bg-fill-hover active:bg-fill-hover"
      }
    >
      {brand}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      className="box-border flex h-[740px] w-[720px] flex-col items-stretch gap-4 rounded-xl border border-line-alt bg-white p-6 shadow-[0_0_30px_0_rgba(0,0,0,0.04)] outline-none"
      shouldCloseOnOverlayClick
    >
      <div className="flex items-center justify-between">
        <h2 className="type-title-xlarge text-tx-strong">브랜드 필터</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
          <img src={cancelIcon} alt="" />
        </button>
      </div>

      <div className="flex items-center justify-between h-12 gap-2 px-3 bg-white border rounded-md border-line-alt">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="브랜드를 입력하세요."
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-icon-alt"
        />
        <Icon
          icon="mingcute:search-line"
          className="flex-shrink-0 w-4 h-4 text-icon-neutral"
        />
      </div>

      {keyword.trim() !== "" && visibleBrands.length === 0 && (
        <div className="flex items-center justify-between w-full gap-4 p-3 rounded-lg bg-fill-bg-strong">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-icon-neutral">
              검색 결과
            </span>
            <span className="text-sm font-medium text-tx-neutral">
              해당 브랜드가 없어요.
            </span>
          </div>
          <button
            type="button"
            onClick={handleApplyBrand}
            disabled={isApplyingBrand}
            className="self-end flex-shrink-0 flex items-center gap-1.5 px-2 py-1 bg-white border border-line-divider rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon
              icon="solar:shop-2-linear"
              className="w-4 h-4 text-tx-neutral"
            />
            <span className="text-xs font-semibold text-tx-neutral">
              {isApplyingBrand ? "신청 중..." : "브랜드 입점 신청하기"}
            </span>
          </button>
        </div>
      )}

      <div className="relative">
        <div
          className="relative"
          onMouseEnter={() => {
            setIsHovering(true);
            updateScrollButtons();
          }}
          onMouseLeave={() => {
            setIsHovering(false);
            setHoverSide(null);
          }}
          onMouseMove={onMouseMove}
        >
          <div
            ref={scrollRef}
            className="flex items-center gap-6 overflow-x-auto text-base font-semibold border-b whitespace-nowrap border-line-divider scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onScroll={updateScrollButtons}
          >
            {tabItems.map(({ key, label }) => {
              const active = key === activeTab;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={[
                    "pb-1 -mb-px shrink-0",
                    active
                      ? "text-tx-default border-b-3 border-fill-primary"
                      : "text-icon-neutral border-b-1 border-transparent hover:text-tx-neutral",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {isHovering && hoverSide === "left" && showLeft && (
            <button
              onClick={scrollLeftFn}
              className="absolute left-0 top-[calc(50%-2px)] -translate-y-1/2
          px-2 py-2 rounded-lg bg-white shadow-[0_4px_8px_rgba(0,0,0,0.10)]
          border border-line-alt z-10"
            >
              <Icon
                icon="grommet-icons:form-previous"
                className="w-5 h-5 text-tx-neutral"
              />
            </button>
          )}

          {isHovering && hoverSide === "right" && showRight && (
            <button
              onClick={scrollRightFn}
              className="absolute right-0 top-[calc(50%-2px)] -translate-y-1/2
          px-2 py-2 rounded-lg bg-white shadow-[0_4px_8px_rgba(0,0,0,0.10)]
          border border-line-alt z-10"
            >
              <Icon
                icon="grommet-icons:form-next"
                className="w-5 h-5 text-tx-neutral"
              />
            </button>
          )}
        </div>
      </div>

      {isRestrictedTab && (
        <p className="flex items-center gap-1 text-xs text-icon-alt">
          <Icon icon="ph:info" className="w-3.5 h-3.5 flex-shrink-0" />
          {isFree
            ? "무료 플랜은 무신사 입점 브랜드만 이용할 수 있어요. 더 많은 브랜드를 보려면 요금제를 업그레이드해주세요."
            : "Basic 플랜은 관심 브랜드 10개와 무신사 입점 브랜드만 이용할 수 있어요."}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold text-icon-neutral">
          {totalSelectedCount}개
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-tx-neutral"
            checked={allVisibleChecked}
            onChange={toggleAllVisible}
            disabled={visibleBrands.length === 0 || isRestrictedTab}
          />
          <span className="text-icon-neutral">브랜드 전체 선택하기</span>
        </label>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="py-8 text-sm text-center text-icon-neutral">
            불러오는 중…
          </div>
        ) : err ? (
          <div className="py-8 text-sm text-center text-red-500">{err}</div>
        ) : (
          <>
            <div
              ref={brandListScrollRef}
              onScroll={handleBrandListScroll}
              className="h-full pr-8 overflow-y-auto"
            >
              <div className="flex flex-wrap gap-2">
                {activeTab === "selected" &&
                  platformList.map((code) => {
                    const label = Object.keys(PLATFORM_LABEL_TO_CODE).find(
                      (l) => PLATFORM_LABEL_TO_CODE[l] === code,
                    );
                    return (
                      <button
                        key={`platform-${code}`}
                        type="button"
                        onClick={() =>
                          setPlatformList(
                            platformList.filter((p) => p !== code),
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-fill-primary-hover px-4 py-2 type-body-medium text-tx-inverse"
                      >
                        {label} 전체 ({platformBrandCount(code)})
                      </button>
                    );
                  })}
                {visibleBrands.map((brand) => {
                  const checked = isPlatformFullySelected || brandList.includes(brand);
                  return (
                    <Chip
                      key={brand}
                      brand={brand}
                      checked={checked}
                      disabled={isBrandDisabled(brand)}
                      anchorLetter={anchorKeys.get(brand)}
                      onClick={() => toggleOne(brand)}
                    />
                  );
                })}
                {visibleBrands.length === 0 && platformList.length === 0 && (
                  <div className="w-full py-8 text-sm text-center text-icon-neutral">
                    {activeTab === "selected"
                      ? "선택된 브랜드가 없어요."
                      : "검색 결과가 없어요."}
                  </div>
                )}
              </div>
            </div>

            {/* 자모 인덱스 — 스크롤바가 글자보다 오른쪽에 오도록 리스트 위에 오버레이로 배치 */}
            <div className="absolute inset-y-0 flex flex-col items-center w-6 gap-1 py-1 pointer-events-none right-2">
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
          </>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={totalSelectedCount === 0}
        className={
          totalSelectedCount === 0
            ? "h-[46px] w-full rounded-md border border-line-alt bg-white type-title-medium text-[#A1A3A5] cursor-not-allowed"
            : "h-[46px] w-full rounded-md bg-fill-primary type-title-medium text-tx-inverse hover:opacity-90"
        }
      >
        {totalSelectedCount}개의 브랜드 확인
      </button>
      <button
        onClick={() => {
          resetBrand();
          resetPlatform();
        }}
        className="flex h-[46px] w-full items-center justify-center gap-1 px-3 py-2 type-title-medium text-center text-[#56585A] hover:text-tx-neutral"
      >
        <Icon icon="ph:arrow-counter-clockwise" />
        선택 초기화하기
      </button>

      {showApplyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 rounded-2xl bg-tx-neutral px-4 py-3 text-white shadow-xl">
          <Icon icon="ph:check-circle-fill" className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-semibold whitespace-nowrap">
            입점 신청이 완료됐어요. 신청 후 3일 내로 반영해드릴게요.
          </span>
        </div>
      )}
    </Modal>
  );
}
