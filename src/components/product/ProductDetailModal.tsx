import { useEffect } from "react";
import { useProductStore } from "@/stores/ProductStore";
import ProductDetailContent from "./ProductDetailContent";

export default function ProductDetailModal() {
  const { modalProductId, setModalProductId } = useProductStore((s) => s);

  useEffect(() => {
    if (!modalProductId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalProductId(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalProductId, setModalProductId]);

  useEffect(() => {
    if (modalProductId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalProductId]);

  if (!modalProductId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setModalProductId(null)}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl mx-4 p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ProductDetailContent
          itemcodeOverride={modalProductId}
          onClose={() => setModalProductId(null)}
          onItemClick={(id) => setModalProductId(id)}
        />
      </div>
    </div>
  );
}
