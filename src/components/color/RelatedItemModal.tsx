import { Icon } from "@iconify/react";

interface RelatedItem {
  itemcode: string;
  front_image_url: string;
}

interface RelatedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: RelatedItem[];
  onItemClick: (itemcode: string) => void;
}

export default function RelatedItemModal({
  isOpen,
  onClose,
  items,
  onItemClick,
}: RelatedItemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center p-4">
      {/* 배경 가림막 */}
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-[2px] cursor-default"
        onClick={onClose}
      />

      {/* 모달 본체 */}
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-[#ECEEF0]">
        {/* 헤더 영역 - 문구 고정 */}
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-[#242628]">
            해당 컬러 기반 아이템 확인하기
          </h2>
          <button
            onClick={onClose}
            className="text-[#91929D] hover:text-black transition-colors"
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-[#56585A] mb-8">
          색상 데이터를 기반으로 연관 상품을 제공합니다.
        </p>

        {/* 상품 이미지 리스트 영역 (스크롤바 숨김) */}
        <div 
          className="grid grid-cols-3 gap-3 overflow-y-auto min-h-[450px] max-h-[550px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, idx) => (
            <button
              key={`${item.itemcode}-${idx}`}
              onClick={() => onItemClick(item.itemcode)}
              className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F9FAFB] hover:opacity-80 transition-opacity border border-[#F2F4F6]"
            >
              <img
                src={item.front_image_url}
                alt="related ㄴitem"
                className="object-cover w-full h-full"
              />
            </button>
          ))}
          
          {/* 데이터 없을 때 */}
          {items.length === 0 && (
            <div className="col-span-3 flex h-[450px] flex-col items-center justify-center text-gray-400">
              <Icon icon="ph:info-light" className="mb-2 text-4xl" />
              <p className="text-sm">연관 상품이 존재하지 않습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}