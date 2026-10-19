import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { COMPARE_MAX, useCompareStore } from "@/stores/CompareStore";
import { useUIStore } from "@/stores/UIStore";
import { useProductStore } from "@/stores/ProductStore";

// 상품 분석 화면 하단의 "비교 담기" 바.
// - 얇은 바(높이 40px): 아직 아무것도 안 담았거나, 펼친 바를 X로 접었을 때.
//   담은 게 있으면 바를 눌러 다시 펼친다.
// - 펼친 바(높이 80px): 담은 상품 카드(최대 4개) + 남은 칸("+ 담기") + 비교하기.
// "비교하기"는 2개 이상 담았을 때 상품 비교 화면(페이지)을 연다.

const BAR =
  "flex w-full flex-shrink-0 items-center border border-[#E4E4E4] bg-white shadow-[0_-2px_12px_0_rgba(0,0,0,0.08)]";

export default function CompareBar() {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const showNotice = useUIStore((s) => s.showNotice);
  const setSelectedProductId = useProductStore((s) => s.setSelectedProductId);
  const collapsed = useCompareStore((s) => s.barCollapsed);
  const setCollapsed = useCompareStore((s) => s.setBarCollapsed);
  // 빈 바에서 X를 누르면 숨긴다 — 상품을 담으면 다시 나타난다
  const dismissed = useCompareStore((s) => s.barDismissed);
  const setDismissed = useCompareStore((s) => s.setBarDismissed);
  const openPage = useCompareStore((s) => s.openPage);

  // 새로 담으면 접혀 있어도 펼쳐서 담긴 걸 보여준다
  const prevCountRef = useRef(items.length);
  useEffect(() => {
    if (items.length > prevCountRef.current) {
      setCollapsed(false);
      setDismissed(false);
    }
    prevCountRef.current = items.length;
  }, [items.length, setCollapsed, setDismissed]);

  if (dismissed && items.length === 0) return null;
  const canCompare = items.length >= 2;
  const isThin = items.length === 0 || collapsed;

  // 비교하기 — 얇은 바: 120×28(Title(sb)/xsmall), 2개 미만이면 회색 비활성.
  // 펼친 바: 너비 116·패딩 8px 12px(Body(md)/medium), 항상 #242628 — 2개
  // 미만에서 누르면 비교 대신 안내를 띄운다.
  const compareButton = (size: "thin" | "full") => {
    const active = size === "full" || canCompare;
    return (
    <button
      type="button"
      disabled={!active}
      onClick={(e) => {
        e.stopPropagation();
        if (!canCompare) {
          showNotice("2개 이상 담아야 비교할 수 있어요");
          return;
        }
        openPage();
      }}
      title={canCompare ? undefined : "2개 이상 담으면 비교할 수 있어요"}
      className={`flex shrink-0 items-center justify-center rounded-lg text-center transition-colors ${
        size === "thin"
          ? "h-7 w-[120px] gap-1 border px-2 py-1 text-[12px] font-semibold leading-[1.33]"
          : "w-[116px] gap-1.5 px-3 py-2 text-[16px] font-medium leading-[1.5] tracking-[-0.08px]"
      } ${
        active
          ? "border-[#242628] bg-[#242628] text-white hover:bg-black"
          : "cursor-not-allowed border-[#E4E4E4] bg-[#E4E4E4] text-[#A1A3A5]"
      }`}
    >
      비교하기
    </button>
    );
  };

  // Title(sb)/small — 14px·600·143%·-0.07px, #242628
  const title = (
    <span className="text-[14px] font-semibold leading-[1.43] tracking-[-0.07px] text-[#242628]">비교 담기</span>
  );

  return (
    <>
      {isThin ? (
        <div
          role={items.length > 0 ? "button" : undefined}
          tabIndex={items.length > 0 ? 0 : undefined}
          onClick={() => items.length > 0 && setCollapsed(false)}
          onKeyDown={(e) => items.length > 0 && (e.key === "Enter" || e.key === " ") && setCollapsed(false)}
          className={`${BAR} h-10 justify-between px-6 ${items.length > 0 ? "cursor-pointer" : ""}`}
        >
          {/* 접혔을 때(담은 게 있을 때)는 제목 옆에 담은 개수 */}
          <div className="flex items-center gap-1.5">
            {title}
            {items.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#242628] p-1 text-center text-[10px] font-medium leading-[1.33] text-white">
                {items.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {compareButton("thin")}
            {/* 담은 게 있으면 펼치기, 없으면 바 닫기 */}
            {items.length > 0 ? (
              <span className="grid w-6 h-6 place-items-center text-[#6F7173]">
                <Icon icon="ph:caret-up" className="w-5 h-5" />
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="비교 바 닫기"
                className="grid w-6 h-6 place-items-center text-[#6F7173] hover:text-[#242628]"
              >
                <Icon icon="ph:x" className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`${BAR} h-20 gap-3 pl-5 pr-3`}>
          <div className="flex-shrink-0 w-[64px]">
            {title}
            <p className="text-[12px] leading-[1.33] text-[#A1A3A5]">
              {items.length} / {COMPARE_MAX}
            </p>
          </div>

          {/* 담은 상품 카드 — 220×48, 카드 사이 12px */}
          <div className="flex items-center flex-1 min-w-0 gap-3 overflow-x-auto hide-scrollbar">
            {items.map(({ itemcode, brand, product_name, thumbnail }) => (
              <div
                key={itemcode}
                className="flex h-12 w-[220px] flex-shrink-0 items-center gap-2 rounded-lg border border-[#F6F8FA] bg-[#F9FAFB] px-2"
              >
                <div
                  className="w-8 h-8 rounded-lg shrink-0 bg-[lightgray] bg-center bg-cover bg-no-repeat"
                  style={thumbnail ? { backgroundImage: `url("${thumbnail}")` } : undefined}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[11px] leading-[1.33] text-[#8A8C8E]">{brand || "-"}</p>
                  <p title={product_name} className="truncate text-[13px] font-medium leading-[1.38] text-[#242628]">
                    {product_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(itemcode)}
                  aria-label="비교에서 빼기"
                  className="flex-shrink-0 text-[#A1A3A5] hover:text-[#242628]"
                >
                  <Icon icon="ph:x-circle-fill" className="w-5 h-5" />
                </button>
              </div>
            ))}
            {items.length < COMPARE_MAX && (
              <button
                type="button"
                // 상품 목록으로 돌아가서 다른 상품을 고르게 한다
                onClick={() => {
                  setSelectedProductId(null);
                  showNotice("상품을 열고 '비교 추가'를 누르면 담겨요.");
                }}
                // 120×48, 패딩 4px 8px, Title(sb)/xsmall, 배경 rgba(11,14,15,0.05)
                className="flex h-12 w-[120px] flex-shrink-0 items-center justify-center gap-1 rounded-lg bg-[rgba(11,14,15,0.05)] px-2 py-1 text-[12px] font-semibold leading-[1.33] text-[#3D3F41] hover:bg-[rgba(11,14,15,0.08)]"
              >
                + 담기
              </button>
            )}
          </div>

          <div className="flex items-center flex-shrink-0 gap-4">
            {compareButton("full")}
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="비교 바 접기"
              className="grid w-6 h-6 place-items-center text-[#6F7173] hover:text-[#242628]"
            >
              <Icon icon="ph:caret-down" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </>
  );
}
