import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import ProductDetailContent from "@/components/product/ProductDetailContent";

interface RelatedItem {
  itemcode: string;
  thumbnail: string;
}

interface RelatedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: RelatedItem[];
  isLoading?: boolean;
}

export default function RelatedItemModal({
  isOpen,
  onClose,
  items,
  isLoading = false,
}: RelatedItemModalProps) {
  const [selectedItemcode, setSelectedItemcode] = useState<string | null>(null);

  // 세로 스크롤 hover 화살표 — ProductDetailContent의 연관 상품 가로 스크롤
  // 버튼과 같은 패턴을 세로로 뒤집은 것.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [hoverSide, setHoverSide] = useState<"top" | "bottom" | null>(null);
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowUp(el.scrollTop > 0);
    setShowDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  const scrollUp = () => {
    scrollRef.current?.scrollBy({ top: -300, behavior: "smooth" });
    setTimeout(updateScrollButtons, 250);
  };

  const scrollDown = () => {
    scrollRef.current?.scrollBy({ top: 300, behavior: "smooth" });
    setTimeout(updateScrollButtons, 250);
  };

  const onScrollAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const half = rect.height / 2;
    setHoverSide(e.clientY - rect.top < half ? "top" : "bottom");
  };

  useEffect(() => {
    updateScrollButtons();
  }, [items]);

  if (!isOpen) return null;

  if (selectedItemcode) {
    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-default"
          onClick={() => setSelectedItemcode(null)}
        />
        <div className="relative w-full max-w-[900px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-line-divider [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <ProductDetailContent
            itemcodeOverride={selectedItemcode}
            onClose={() => setSelectedItemcode(null)}
            onItemClick={(code) => setSelectedItemcode(code)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* 배경 가림막 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-default"
        onClick={onClose}
      />

      {/* 모달 본체 */}
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-line-divider">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-semibold text-tx-default">
            해당 컬러 기반 아이템 확인하기
          </h2>
          <button
            onClick={onClose}
            className="text-tx-assistive hover:text-black transition-colors"
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-tx-alt mb-8">
          색상 데이터를 기반으로 연관 상품을 제공합니다.
        </p>

        {/* 상품 이미지 리스트 */}
        <div
          className="relative"
          onMouseEnter={() => {
            setHovering(true);
            updateScrollButtons();
          }}
          onMouseLeave={() => {
            setHovering(false);
            setHoverSide(null);
          }}
          onMouseMove={onScrollAreaMouseMove}
        >
          <div
            ref={scrollRef}
            onScroll={updateScrollButtons}
            className="grid content-start grid-cols-3 gap-3 overflow-y-auto min-h-[450px] max-h-[550px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {isLoading ? (
              <div className="col-span-3 flex h-[450px] flex-col items-center justify-center text-gray-400">
                <Icon icon="ph:spinner" className="mb-2 text-4xl animate-spin" />
                <p className="text-sm">상품을 불러오는 중입니다...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-3 flex h-[450px] flex-col items-center justify-center text-gray-400">
                <Icon icon="ph:info-light" className="mb-2 text-4xl" />
                <p className="text-sm">연관 상품이 존재하지 않습니다.</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <button
                  key={`${item.itemcode}-${idx}`}
                  onClick={() => setSelectedItemcode(item.itemcode)}
                  className="relative aspect-square w-full overflow-hidden rounded-xl bg-fill-bg-strong hover:opacity-80 transition-opacity border border-surface-base"
                >
                  <img
                    src={item.thumbnail}
                    alt="related item"
                    className="object-cover w-full h-full"
                  />
                </button>
              ))
            )}
          </div>

          {hovering && hoverSide === "top" && showUp && (
            <button
              onClick={scrollUp}
              className="absolute left-1/2 top-0 -translate-x-1/2 px-2 py-2 rounded-lg bg-white shadow-[0_4px_8px_rgba(0,0,0,0.10)] border border-line-alt z-10"
            >
              <Icon
                icon="grommet-icons:form-previous"
                className="w-5 h-5 rotate-90 text-tx-neutral"
              />
            </button>
          )}

          {hovering && hoverSide === "bottom" && showDown && (
            <button
              onClick={scrollDown}
              className="absolute left-1/2 bottom-0 -translate-x-1/2 px-2 py-2 rounded-lg bg-white shadow-[0_4px_8px_rgba(0,0,0,0.10)] border border-line-alt z-10"
            >
              <Icon
                icon="grommet-icons:form-next"
                className="w-5 h-5 rotate-90 text-tx-neutral"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
