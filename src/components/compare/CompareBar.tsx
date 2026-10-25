import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { COMPARE_MAX, useCompareStore } from "@/stores/CompareStore";
import { useUIStore } from "@/stores/UIStore";
import { useProductStore } from "@/stores/ProductStore";

// 상품 분석 화면 하단의 "비교 담기" 바.
// - 얇은 바(높이 40px): 아직 아무것도 안 담았거나(기본), 펼친 바를 접었을 때.
//   오른쪽 위·아래 화살표(또는 바)를 눌러 펼치고 접는다.
// - 펼친 바(높이 80px): 담은 상품 카드(최대 4개) + 남은 칸("+ 담기") + 비교하기.
// "비교하기"는 2개 이상 담았을 때 상품 비교 화면(페이지)을 연다.

const BAR =
  "flex w-full flex-shrink-0 items-center border border-[#E4E4E4] bg-white shadow-[0_-2px_12px_0_rgba(0,0,0,0.08)]";

export default function CompareBar() {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const showNotice = useUIStore((s) => s.showNotice);
  const setSelectedProductId = useProductStore((s) => s.setSelectedProductId);
  const collapsed = useCompareStore((s) => s.barCollapsed);
  const setCollapsed = useCompareStore((s) => s.setBarCollapsed);
  // 빈 바는 기본으로 얇게 두고, 화살표로 펼칠 수 있다
  const emptyOpen = useCompareStore((s) => s.barEmptyOpen);
  const setEmptyOpen = useCompareStore((s) => s.setBarEmptyOpen);
  const openPage = useCompareStore((s) => s.openPage);

  // "비교에 추가되었습니다" 토스트 — 담은 직후 3초. 삭제하기로 방금 담은 상품을 뺀다
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // 새로 담으면 접혀 있어도 펼쳐서 담긴 걸 보여주고, 다 비우면 얇은 바로 돌아간다
  const prevCountRef = useRef(items.length);
  useEffect(() => {
    if (items.length > prevCountRef.current) {
      setCollapsed(false);
      setAddedToast(items[items.length - 1].itemcode);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setAddedToast(null), 3000);
    }
    if (items.length === 0 && prevCountRef.current > 0) setEmptyOpen(false);
    prevCountRef.current = items.length;
  }, [items, setCollapsed, setEmptyOpen]);

  // 2개 미만일 때 비교하기에 마우스를 올리거나 누르면 버튼 위에 안내를 잠깐(2.5초) 띄운다
  const [tipOpen, setTipOpen] = useState(false);
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTip = () => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
    setTipOpen(true);
    tipTimerRef.current = setTimeout(() => setTipOpen(false), 2500);
  };
  const hideTip = () => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
    setTipOpen(false);
  };
  useEffect(() => () => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
  }, []);

  const canCompare = items.length >= 2;
  const isThin = items.length === 0 ? !emptyOpen : collapsed;
  const expand = () => (items.length === 0 ? setEmptyOpen(true) : setCollapsed(false));
  const fold = () => (items.length === 0 ? setEmptyOpen(false) : setCollapsed(true));

  // 비교하기 — 얇은 바: 120×28(Title(sb)/xsmall), 펼친 바: 너비 116·패딩 8px 12px(Body(md)/medium).
  // 두 바 모두 2개 미만이면 회색 비활성(눌러도 넘어가지 않고, 올리면 위 안내).
  // 비활성 버튼은 마우스 이벤트를 받지 않아서 감싼 div에서 호버를 잡는다.
  const compareButton = (size: "thin" | "full") => {
    const active = canCompare;
    return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => !canCompare && showTip()}
      onMouseLeave={hideTip}
    >
    {tipOpen && !canCompare && (
      // 툴팁 — Alpha/black75 배경, Body(md)/xsmall, 최대 300px·5줄, 아래 꼬리
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 flex-col items-center"
      >
        <span className="line-clamp-5 w-max max-w-[300px] overflow-hidden rounded-lg bg-black/75 px-2 py-1 text-center text-[12px] font-medium leading-[1.33] text-white">
          2개부터 비교할 수 있어요
        </span>
        <span className="h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-black/75" />
      </div>
    )}
    <button
      type="button"
      disabled={!active}
      onClick={(e) => {
        e.stopPropagation();
        openPage();
      }}
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
    </div>
    );
  };

  // 전체 삭제 — 담은 게 있을 때만, 비교하기 왼쪽 16px. Body(md)/small·밑줄, Text/Normal/Normal
  const clearButton =
    items.length > 0 ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          clear();
        }}
        className="shrink-0 text-[14px] font-medium leading-[1.43] tracking-[-0.07px] text-tx-default underline [text-decoration-skip-ink:none] [text-underline-position:from-font]"
      >
        전체 삭제
      </button>
    ) : null;

  // Title(sb)/small — 14px·600·143%·-0.07px, #242628
  const title = (
    <span className="text-[14px] font-semibold leading-[1.43] tracking-[-0.07px] text-[#242628]">비교 담기</span>
  );

  return (
    <div className="relative flex-shrink-0 w-full">
      {addedToast && (
        // 바 바로 위 13px 가운데. Overlay/Dim-Strong 배경, Title(sb)/medium
        <div
          role="status"
          className="absolute bottom-full left-1/2 z-30 mb-[13px] flex min-h-14 -translate-x-1/2 items-center justify-center gap-3 whitespace-nowrap rounded-xl bg-dim-strong p-2 pl-4 text-[16px] font-semibold leading-[1.5] tracking-[-0.08px] text-tx-inverse"
        >
          <Icon icon="ph:check-bold" className="w-6 h-6 shrink-0" />
          비교에 추가되었습니다
          <button
            type="button"
            onClick={() => {
              remove(addedToast);
              setAddedToast(null);
            }}
            className="flex items-center justify-center rounded-lg bg-white/25 p-2 text-[16px] font-semibold leading-[1.5] tracking-[-0.08px] text-[#CCFCA9] hover:bg-white/35"
          >
            삭제하기
          </button>
        </div>
      )}
      {isThin ? (
        <div
          role="button"
          tabIndex={0}
          aria-expanded={false}
          onClick={expand}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && expand()}
          className={`${BAR} h-10 cursor-pointer justify-between pl-6 pr-3`}
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
          {/* 전체 삭제 ↔ 비교하기 16px, 비교하기 ↔ 화살표 8px, 화살표 ↔ 오른쪽 끝 12px */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              {clearButton}
              {compareButton("thin")}
            </div>
            {/* 펼치기 — 바 전체를 눌러도 펼쳐진다 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                expand();
              }}
              aria-label="비교 바 펼치기"
              className="grid w-6 h-6 place-items-center text-[#6F7173] hover:text-[#242628]"
            >
              <Icon icon="ph:caret-up" className="w-5 h-5" />
            </button>
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

          <div className="flex items-center flex-shrink-0 gap-2">
            <div className="flex items-center gap-4">
              {clearButton}
              {compareButton("full")}
            </div>
            <button
              type="button"
              onClick={fold}
              aria-label="비교 바 접기"
              className="grid w-6 h-6 place-items-center text-[#6F7173] hover:text-[#242628]"
            >
              <Icon icon="ph:caret-down" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
