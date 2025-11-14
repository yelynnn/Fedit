import { Icon } from "@iconify/react";
import Modal from "react-modal";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { GetBrandList } from "@/apis/AnalysisAPI";

type ApiCategory = { label: string; brands: string[] };
type TabKey = "selected" | "favorite" | string;
type Props = { isOpen: boolean; onClose: () => void; onSubmit?: () => void };

export default function BrandFilterModal({ isOpen, onClose, onSubmit }: Props) {
  const brandList = useFilterStore((s) => s.brandList);
  const addBrand = useFilterStore((s) => s.addBrand);
  const resetBrand = useFilterStore((s) => s.resetBrand);
  const removeBrand = useFilterStore((s) => s.removeBrand);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("selected");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
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
      { key: "favorite", label: "즐겨찾기 (준비중)" },
      ...categories.map((c) => ({ key: c.label, label: `${c.label}` })),
    ],
    [categories]
  );

  const sourceBrands = useMemo<string[]>(() => {
    if (activeTab === "selected") return brandList;
    if (activeTab === "favorite") return [];
    const cat = categories.find((c) => c.label === activeTab);
    return cat?.brands ?? [];
  }, [activeTab, brandList, categories]);

  const visibleBrands = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return k
      ? sourceBrands.filter((b) => b.toLowerCase().includes(k))
      : sourceBrands;
  }, [keyword, sourceBrands]);

  const allVisibleChecked = useMemo(
    () =>
      visibleBrands.length > 0 &&
      visibleBrands.every((b) => brandList.includes(b)),
    [visibleBrands, brandList]
  );

  const toggleAllVisible = () => {
    if (allVisibleChecked) {
      visibleBrands.forEach((b) => brandList.includes(b) && removeBrand(b));
    } else {
      visibleBrands.forEach((b) => !brandList.includes(b) && addBrand(b));
    }
  };

  const toggleOne = (brand: string) => {
    if (brandList.includes(brand)) removeBrand(brand);
    else addBrand(brand);
  };

  const parentSelector = useCallback(
    () => document.getElementById("modal-root") as HTMLElement,
    []
  );

  const Chip = ({
    brand,
    checked,
    onClick,
  }: {
    brand: string;
    checked?: boolean;
    onClick?: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={
        checked
          ? "px-1 h-8 rounded-lg border-1 border-[#3D3F41] bg-white text-[#3D3F41] flex items-center justify-center text-xs"
          : "px-1 h-8 rounded-lg border border-[#ECEEF0] bg-[#F9FAFB] text-[#888A8C] flex items-center justify-center text-xs hover:border-[#D0D3D6]"
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
      className="box-border flex flex-col py-4 bg-white shadow-xl outline-none w-125 h-138 rounded-xl"
      shouldCloseOnOverlayClick
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h2 className="text-[20px] font-semibold text-[#3D3F41]">
          브랜드 필터
        </h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
          <Icon icon="fontisto:close-a" width={18} className="text-[#888A8C]" />
        </button>
      </div>

      <div className="px-6 pb-3 my-2">
        <div className="flex items-center gap-2 px-3 py-2 border border-[#E4E4E4] rounded-lg bg-white">
          <Icon
            icon="mingcute:search-line"
            className="w-4 h-4 text-[#888A8C]"
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="브랜드를 입력하세요."
            className="flex-1 text-sm outline-none placeholder:text-[#B0B0B0] bg-transparent"
          />
        </div>
      </div>

      <div className="relative px-6">
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
            className="flex overflow-x-auto whitespace-nowrap items-center gap-6 text-base font-semibold border-b border-[#EDEEEF] scroll-smooth"
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
                      ? "text-[#242628] border-b-3 border-[#242628]"
                      : "text-[#888A8C] border-b-1 border-transparent hover:text-[#4B4B4B]",
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
          border border-[#E4E4E4] z-10"
            >
              <Icon
                icon="grommet-icons:form-previous"
                className="w-5 h-5 text-[#3D3F41]"
              />
            </button>
          )}

          {isHovering && hoverSide === "right" && showRight && (
            <button
              onClick={scrollRightFn}
              className="absolute right-0 top-[calc(50%-2px)] -translate-y-1/2 
          px-2 py-2 rounded-lg bg-white shadow-[0_4px_8px_rgba(0,0,0,0.10)]
          border border-[#E4E4E4] z-10"
            >
              <Icon
                icon="grommet-icons:form-next"
                className="w-5 h-5 text-[#3D3F41]"
              />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pt-3 pb-1 text-sm">
        <div className="text-[#888A8C] font-semibold">{brandList.length}개</div>
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#3D3F41]"
            checked={allVisibleChecked}
            onChange={toggleAllVisible}
            disabled={visibleBrands.length === 0}
          />
          <span className="text-[#888A8C]">브랜드 전체 선택하기</span>
        </label>
      </div>

      <div className="flex-1 px-6 py-3 overflow-y-auto">
        {loading ? (
          <div className="text-sm text-[#888A8C] py-8 text-center">
            불러오는 중…
          </div>
        ) : err ? (
          <div className="py-8 text-sm text-center text-red-500">{err}</div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            }}
          >
            {visibleBrands.map((brand) => {
              const checked = brandList.includes(brand);
              return (
                <Chip
                  key={brand}
                  brand={brand}
                  checked={checked}
                  onClick={() => toggleOne(brand)}
                />
              );
            })}
            {visibleBrands.length === 0 && (
              <div className="text-sm text-[#888A8C] py-8 text-center col-span-full">
                {activeTab === "favorite"
                  ? "즐겨찾기한 브랜드가 없어요."
                  : activeTab === "selected"
                  ? "선택된 브랜드가 없어요."
                  : "검색 결과가 없어요."}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6">
        <button
          onClick={onSubmit}
          className="w-full h-10 rounded-lg bg-[#242628] text-white text-sm font-semibold"
        >
          해당 브랜드 데이터 보기
        </button>
        <button
          onClick={() => {
            resetBrand();
          }}
          className="mt-1 w-full h-10 rounded-lg text-[#888A8C] text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <Icon icon="ph:arrow-counter-clockwise" />
          선택 초기화하기
        </button>
      </div>
    </Modal>
  );
}
