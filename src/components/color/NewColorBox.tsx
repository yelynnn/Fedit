import type { BrandColorBlock } from "@/types/Filter";
import ProductDetailBox from "./ProductDetailBox";
import { useEffect, useMemo, useState } from "react";
import { GetColorProduct } from "@/apis/AnalysisAPI";

type ColorChildrenAndProducts = {
  children: { color: string; name: string }[];
  products: {
    itemcode: string;
    product_name: string;
    color_text: string;
    color: string;
    material: string;
    product_image_url: string;
  }[];
};

const toStr = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const lower = (v: unknown) => toStr(v).toLowerCase();
const expandShortHex = (hex: string) => {
  const h = hex.replace("#", "");
  if (h.length === 3)
    return `#${h
      .split("")
      .map((ch) => ch + ch)
      .join("")}`;
  return hex.startsWith("#") ? hex : `#${h}`;
};
const normHex = (v: unknown) => {
  const s = lower(v);
  if (!s) return "";
  return expandShortHex(s);
};

type Props = { block: BrandColorBlock };

function NewColorBox({ block }: Props) {
  const firstHex = useMemo(
    () => normHex(block?.colors?.[0]?.color),
    [block?.colors]
  );
  const [selectedHex, setSelectedHex] = useState<string>(firstHex);
  const [children, setChildren] = useState<{ color: string; name: string }[]>(
    []
  );
  const [products, setProducts] = useState<
    ColorChildrenAndProducts["products"]
  >([]);

  useEffect(() => {
    if (!block?.brand || !selectedHex) return;
    const fetchData = async () => {
      try {
        const res = await GetColorProduct({
          brand: block.brand,
          parent_color_hex: selectedHex,
        });
        setChildren(res?.children ?? []);
        setProducts(res?.products ?? []);
        console.log(res?.products);
      } catch {
        setChildren([]);
        setProducts([]);
      }
    };
    fetchData();
  }, [block?.brand, selectedHex]);

  return (
    <div className="w-109 h-134">
      <p className="mb-3 font-semibold text-[#3D3F41]">{block.brand}</p>

      <article className="flex gap-2">
        <section className="overflow-hidden rounded-lg h-125 w-18">
          <div className="relative flex flex-col w-full h-full gap-2">
            {(block.colors ?? []).map((c, idx) => {
              const isSelected = normHex(c.color) === selectedHex;
              return (
                <div
                  key={`${c.name ?? "color"}-${
                    normHex(c.color) || "nocolor"
                  }-${idx}`}
                  className="w-full border rounded-lg"
                  style={{
                    height: `${Math.max(0, Math.min(100, c.value))}%`,
                    backgroundColor: c.color,
                    border: isSelected
                      ? "2px solid var(--Line-Primary-Normal, #56585A)"
                      : "1px solid #E4E4E4",
                    boxShadow: isSelected
                      ? "0 0 4px 0 rgba(0,0,0,0.25)"
                      : "none",
                  }}
                  title={`${c.name} · ${c.value}%`}
                  onClick={() => setSelectedHex(normHex(c.color))}
                />
              );
            })}
          </div>
        </section>

        <section className="h-125 w-88 rounded-lg border border-[#E4E4E4] bg-white px-3 py-4 flex flex-col">
          <div className="flex w-full mb-3 overflow-hidden rounded-lg h-9">
            {children.map((c, idx) => (
              <div
                key={`${c.name ?? "noname"}-${c.color ?? "nocolor"}-${idx}`}
                className="flex-1 h-full"
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {products.map((p, idx) => (
              <ProductDetailBox
                key={`${p.itemcode ?? "noid"}-${
                  p.product_image_url ?? "noimg"
                }-${idx}`}
                {...p}
              />
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}

export default NewColorBox;
