import { Icon } from "@iconify/react";
import Modal from "react-modal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { GetBrandList } from "@/apis/AnalysisAPI";

const REQUIRED_COUNT = 10;

// 초성 인덱스에 쓰이는 14개 기본 자음(쌍자음은 기본 자음으로 합산)
const INDEX_LETTERS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const CHO_LIST = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const DOUBLE_TO_BASE: Record<string, string> = {
  ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ",
};

function getIndexKey(name: string): string {
  const code = name.trim().charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const cho = CHO_LIST[Math.floor((code - 0xac00) / (21 * 28))];
    return DOUBLE_TO_BASE[cho] ?? cho;
  }
  return "#";
}

type ApiCategory = { label: string; brands: string[] };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

export default function InterestBrandModal({ isOpen, onClose, onComplete }: Props) {
  const brandList = useFilterStore((s) => s.brandList);
  const addBrand = useFilterStore((s) => s.addBrand);
  const removeBrand = useFilterStore((s) => s.removeBrand);
  const resetBrand = useFilterStore((s) => s.resetBrand);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // 대시보드 브랜드 필터(전역 상태)를 재사용하다 보니, 예전에 걸어둔 필터가
  // 남아있으면 온보딩이 이미 선택된 것처럼 보일 수 있어 모달을 열 때마다 초기화한다.
  useEffect(() => {
    if (isOpen) resetBrand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await GetBrandList();
        if (ignore) return;
        const cats: ApiCategory[] = Array.isArray(data?.categories) ? data.categories : [];
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
    return k ? sourceBrands.filter((b) => b.toLowerCase().includes(k)) : sourceBrands;
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

  const isFull = brandList.length >= REQUIRED_COUNT;
  const remaining = REQUIRED_COUNT - brandList.length;

  const toggleBrand = (brand: string) => {
    if (brandList.includes(brand)) {
      removeBrand(brand);
    } else if (!isFull) {
      addBrand(brand);
    }
  };

  const handleSubmit = () => {
    if (brandList.length !== REQUIRED_COUNT) return;
    onComplete?.();
    onClose();
  };

  const parentSelector = useCallback(
    () => document.getElementById("modal-root") as HTMLElement,
    [],
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      className="box-border flex w-[1060px] h-[740px] flex-col items-center gap-6 rounded-2xl border border-[#E4E4E4] bg-white p-9 shadow-[0_0_30px_0_rgba(0,0,0,0.04)] outline-none"
      shouldCloseOnOverlayClick
    >
      {/* 헤더 */}
      <div className="flex w-full flex-col items-start gap-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#0B0E0F] px-3 py-1.5 text-[13px] text-white">
          <span className="font-bold">BASIC</span> 플랜 설정
        </span>
        <h1 className="text-[24px] font-semibold leading-[133%] tracking-[-0.48px] text-[#0B0E0F]">
          관심 브랜드 10개를 선택해주세요
        </h1>
        <p className="text-[15px] leading-[150%] text-[#6F7173]">
          선택한 10개 브랜드를 기준으로 트렌드와 분석을 보여드려요.
          <br />
          브랜드는 가입 후 <b className="font-semibold text-[#3D3F41]">월 1회</b> 변경할 수 있어요.
        </p>
      </div>

      {/* 본문: 좌 선택 현황 / 우 브랜드 탐색 */}
      <div className="flex w-full flex-1 gap-6 overflow-hidden">
        {/* 좌: 선택 현황 */}
        <div className="flex h-full w-[400px] flex-shrink-0 flex-col rounded-2xl border border-[#E4E4E4] p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0B0E0F] text-[12px] font-semibold text-white">
                {brandList.length}
              </span>
              <span className="text-[14px] font-medium text-[#3D3F41]">
                / {REQUIRED_COUNT} 선택
              </span>
            </div>
            <span className="text-[12px] text-[#A1A3A5]">
              {isFull
                ? "모두 선택했어요!"
                : `${remaining}개 더 선택하면 시작할 수 있어요!`}
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E4E4E4]">
            <div
              className="h-full rounded-full bg-[#0B0E0F] transition-all"
              style={{ width: `${(brandList.length / REQUIRED_COUNT) * 100}%` }}
            />
          </div>

          <div className="mt-5 flex-1 overflow-y-auto">
            {brandList.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-[#A1A3A5]">
                오른쪽에서 관심 브랜드를 선택해주세요.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {brandList.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => removeBrand(brand)}
                    className="flex h-10 w-[143px] items-center justify-center gap-2 rounded-lg bg-[#0B0E0F] px-4 py-2 text-[16px] font-medium leading-[150%] tracking-[-0.08px] text-white"
                  >
                    <span className="truncate">{brand}</span>
                    <Icon icon="mdi:close" className="h-4 w-4 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우: 브랜드 탐색 */}
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 rounded-xl border border-[#E4E4E4] px-4 py-3">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="브랜드를 검색하세요."
              className="flex-1 text-sm outline-none placeholder:text-[#A1A3A5]"
            />
            <Icon icon="mingcute:search-line" className="h-5 w-5 flex-shrink-0 text-[#A1A3A5]" />
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

          <p className="mt-3 text-[13px] text-[#A1A3A5]">{visibleBrands.length}개</p>

          <div className="mt-2 flex flex-1 gap-2 overflow-hidden">
            <div ref={listRef} className="flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="py-10 text-center text-sm text-[#A1A3A5]">불러오는 중…</div>
              ) : err ? (
                <div className="py-10 text-center text-sm text-red-500">{err}</div>
              ) : visibleBrands.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#A1A3A5]">검색 결과가 없어요.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {visibleBrands.map((brand) => {
                    const selected = brandList.includes(brand);
                    const letter = anchorKeys.get(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        data-anchor-letter={letter ?? undefined}
                        onClick={() => toggleBrand(brand)}
                        disabled={!selected && isFull}
                        className={[
                          "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[16px] font-medium leading-[150%] tracking-[-0.08px] transition-colors",
                          selected
                            ? "bg-[#0B0E0F] text-white"
                            : "border border-[#E4E4E4] text-[#3D3F41] hover:border-[#0B0E0F]",
                          !selected && isFull ? "cursor-not-allowed opacity-40" : "",
                        ].join(" ")}
                      >
                        <span className="truncate">{brand}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 자모 인덱스 */}
            <div className="flex w-5 flex-shrink-0 flex-col items-center gap-1 py-1">
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
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px] transition-colors",
                      active
                        ? "bg-[#0B0E0F] font-semibold text-white"
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
      </div>

      {/* 시작하기 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isFull}
        className={[
          "w-full flex-shrink-0 rounded-xl py-4 text-[16px] font-semibold transition-colors",
          isFull
            ? "bg-[#0B0E0F] text-white hover:bg-black"
            : "bg-[#F4F4F5] text-[#A1A3A5] cursor-not-allowed",
        ].join(" ")}
      >
        이 브랜드로 FEDIT 시작하기
      </button>
    </Modal>
  );
}
