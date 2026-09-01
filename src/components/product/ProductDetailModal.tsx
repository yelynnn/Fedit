import { useEffect } from "react";
import { useProductStore } from "@/stores/ProductStore";
import ProductDetailContent from "./ProductDetailContent";

export default function ProductDetailModal() {
  const { modalProductId, setModalProductId, modalTrendSnapshot, setModalTrendSnapshot } =
    useProductStore((s) => s);
  const isOpen = !!modalProductId || !!modalTrendSnapshot;

  const close = () => {
    setModalProductId(null);
    setModalTrendSnapshot(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl mx-4 p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {modalTrendSnapshot ? (
          <ProductDetailContent
            previewSnapshot={modalTrendSnapshot}
            onClose={close}
          />
        ) : (
          <ProductDetailContent
            itemcodeOverride={modalProductId ?? undefined}
            onClose={close}
            onItemClick={(id) => setModalProductId(id)}
          />
        )}
      </div>
    </div>
  );
}
