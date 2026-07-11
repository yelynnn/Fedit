import { useState } from "react";
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
        <div className="grid grid-cols-3 gap-3 overflow-y-auto min-h-[450px] max-h-[550px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
      </div>
    </div>
  );
}
