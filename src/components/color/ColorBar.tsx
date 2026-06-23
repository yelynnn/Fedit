import { useState } from "react";
import { GetColorRelatedProducts, type ColorProductItem } from "@/apis/ColorAPI";
import RelatedItemModal from "./RelatedItemModal";

interface ColorData {
  name: string;
  size: number;
  fill: string;
}

interface ColorBarProps {
  title?: string;
  brand?: string;
  data?: ColorData[];
  onClose?: () => void;
}

export default function ColorBar({ title, brand, data, onClose }: ColorBarProps) {
  const chartData = data && data.length > 0 ? data : [];
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<ColorProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRelatedItemClick = async (colorHex: string) => {
    const targetBrand = brand ?? title ?? "";
    if (!targetBrand || !colorHex) return;

    setModalItems([]);
    setModalOpen(true);
    setIsLoading(true);
    try {
      const items = await GetColorRelatedProducts({
        brand: targetBrand,
        color_hex: colorHex,
      });
      setModalItems(items);
    } catch {
      setModalItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full p-4 overflow-hidden bg-[#F9FAFB] rounded-xl">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {chartData.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="relative flex items-center justify-between h-12 px-3 bg-white border border-[#E4E4E4] rounded-2xl overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 h-full bg-[#F1F9E5] transition-all duration-500 ease-out"
                style={{ width: `${item.size}%`, zIndex: 0 }}
              />

              <div className="relative z-10 flex items-center gap-4">
                <div
                  className="w-5 h-5 border border-gray-100 rounded-full shadow-sm"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm font-bold text-[#242628]">
                  {item.name}
                </span>
              </div>

              <div className="relative z-10 flex items-center gap-4">
                <span className="text-sm font-semibold text-[#242628]">
                  {item.size}%
                </span>

                <button
                  onClick={() => handleRelatedItemClick(item.fill)}
                  className="px-2 py-1 bg-[#F6F8FA] rounded-lg text-xs font-bold text-[#555] hover:bg-gray-50 transition-all"
                >
                  관련 아이템
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RelatedItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        items={modalItems}
        isLoading={isLoading}
      />
    </>
  );
}
