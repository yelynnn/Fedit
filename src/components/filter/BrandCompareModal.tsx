import { useState, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import Modal from "react-modal";
import { useFilterStore } from "@/stores/FilterStore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (brands: string[]) => void;
  alreadyAdded?: string[];
};

export default function BrandCompareModal({
  isOpen,
  onClose,
  onSubmit,
  alreadyAdded = [],
}: Props) {
  const brandList = useFilterStore((s) => s.brandList);
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");

  const availableBrands = useMemo(
    () => brandList.filter((b) => !alreadyAdded.includes(b)),
    [brandList, alreadyAdded],
  );

  const visibleBrands = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return k
      ? availableBrands.filter((b) => b.toLowerCase().includes(k))
      : availableBrands;
  }, [keyword, availableBrands]);

  const toggleBrand = (brand: string) => {
    setSelected((prev) => {
      if (prev.includes(brand)) return prev.filter((b) => b !== brand);
      if (prev.length >= 2) return prev;
      return [...prev, brand];
    });
  };

  const handleClose = () => {
    setSelected([]);
    setKeyword("");
    onClose();
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onSubmit(selected);
    setSelected([]);
    setKeyword("");
    onClose();
  };

  const parentSelector = useCallback(
    () => document.getElementById("modal-root") as HTMLElement,
    [],
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      className="box-border flex flex-col py-4 bg-white shadow-xl outline-none w-125 h-128 rounded-xl"
      shouldCloseOnOverlayClick
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h2 className="text-[20px] font-semibold text-tx-neutral">
            브랜드 비교 선택
          </h2>
          <p className="text-xs text-icon-neutral mt-1">
            최대 2개 브랜드를 비교분석할 수 있습니다.
          </p>
        </div>
        <button onClick={handleClose} className="p-1 rounded hover:bg-gray-100">
          <Icon icon="fontisto:close-a" width={18} className="text-icon-neutral" />
        </button>
      </div>

      {/* 검색 */}
      <div className="px-6 pb-3 my-2">
        <div className="flex items-center gap-2 px-3 py-2 border border-line-alt rounded-lg bg-white">
          <Icon
            icon="mingcute:search-line"
            className="w-4 h-4 text-icon-neutral"
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="브랜드를 입력하세요."
            className="flex-1 text-sm outline-none placeholder:text-icon-alt bg-transparent"
          />
        </div>
      </div>

      {/* 선택 카운터 */}
      <div className="flex items-center justify-between px-6 pb-2">
        <span className="text-sm text-icon-neutral font-semibold">
          {availableBrands.length}개 브랜드
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                selected[i]
                  ? "bg-fill-primary text-white border-fill-primary"
                  : "bg-fill-bg-strong text-icon-alt border-line-divider"
              }`}
            >
              {selected[i] ? (
                <>
                  {selected[i]}
                  <button
                    onClick={() => toggleBrand(selected[i])}
                    className="ml-0.5 hover:opacity-70"
                  >
                    <Icon icon="fontisto:close-a" width={8} />
                  </button>
                </>
              ) : (
                `브랜드 ${i + 1}`
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 브랜드 목록 */}
      <div className="flex-1 px-6 py-3 overflow-y-auto">
        {brandList.length === 0 ? (
          <div className="text-sm text-icon-neutral py-8 text-center">
            선택된 브랜드가 없어요.
            <br />
            브랜드 필터에서 브랜드를 먼저 추가해주세요.
          </div>
        ) : visibleBrands.length === 0 ? (
          <div className="text-sm text-icon-neutral py-8 text-center">
            {keyword ? "검색 결과가 없어요." : "추가 가능한 브랜드가 없어요."}
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            }}
          >
            {visibleBrands.map((brand) => {
              const isChecked = selected.includes(brand);
              const isDisabled = !isChecked && selected.length >= 2;
              return (
                <button
                  key={brand}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleBrand(brand)}
                  className={`px-1 h-8 rounded-lg border text-xs transition-colors ${
                    isChecked
                      ? "border-tx-neutral bg-white text-tx-neutral font-semibold"
                      : isDisabled
                        ? "border-line-divider bg-fill-bg-strong text-[#C8CACB] cursor-not-allowed"
                        : "border-line-divider bg-fill-bg-strong text-icon-neutral hover:border-line-neutral"
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="px-6">
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className={`w-full h-10 rounded-lg text-sm font-semibold transition-colors ${
            selected.length > 0
              ? "bg-fill-primary text-white"
              : "bg-surface-base text-icon-alt cursor-not-allowed"
          }`}
        >
          {selected.length > 0
            ? `${selected.length}개 브랜드 비교하기`
            : "브랜드를 선택해주세요"}
        </button>
        <button
          onClick={() => setSelected([])}
          className="mt-1 w-full h-10 rounded-lg text-icon-neutral text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <Icon icon="ph:arrow-counter-clockwise" />
          선택 초기화하기
        </button>
      </div>
    </Modal>
  );
}
