import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";
import BrandFilterModal from "./BrandFilterModal";
import { useFilterStore } from "@/stores/FilterStore";
import { useProductStore } from "@/stores/ProductStore";
import type { ApiDetail } from "@/types/Product";

type Props = { isProductTab: boolean };

const xlsxCols = [
  { header: "브랜드", key: "brand", width: 14 },
  { header: "이미지", key: "__img", width: 22 },
  { header: "상품명", key: "product_name", width: 28 },
  { header: "카테고리", key: "category", width: 18 },
  { header: "성별", key: "gender", width: 8 },
  { header: "게시일", key: "release_date", width: 12 },
  { header: "현재가", key: "current_price", width: 12 },
  { header: "정가", key: "regular_price", width: 12 },
  { header: "할인율", key: "discount_rate", width: 10 },
  { header: "색상", key: "colors", width: 12 },
  { header: "소재", key: "material", width: 16 },
  { header: "디테일", key: "details", width: 40 },
  { header: "AI BETA", key: "ai_description", width: 40 },
  { header: "평점", key: "rating", width: 8 },
  { header: "리뷰 수", key: "reviews", width: 10 },
  { header: "상품 상세 주소", key: "product_detail_url", width: 50 },
];

const colCharsToPx = (w?: number) => Math.floor((w ?? 8.43) * 7 + 5);
const pxToPt = (px: number) => (px * 72) / 96;
const getImgSize = (dataUrl: string) =>
  new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = dataUrl;
  });
const yymmdd = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
};

function BrandTab({ isProductTab }: Props) {
  const [isBrandOpen, setBrandOpen] = useState(false);
  const { brandList } = useFilterStore((s) => s);
  const { resultLists } = useProductStore((s) => s);

  useEffect(() => {
    const id = "brandtab-hide-scrollbar";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `.x-scroll-hide::-webkit-scrollbar{display:none;}`;
      document.head.appendChild(style);
    }
  }, []);

  async function downloadXlsxWithImages(rows: ApiDetail[]) {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Products");
    ws.columns = xlsxCols as any;

    xlsxCols.forEach((c, i) => {
      const idx = i + 1;
      if (
        ["details", "ai_description", "product_detail_url"].includes(
          String(c.key)
        )
      ) {
        ws.getColumn(idx).alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "left",
        };
      } else {
        ws.getColumn(idx).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      }
    });

    const dataKeys = xlsxCols.map((c) => c.key).filter((k) => k !== "__img");
    rows.forEach((p) => {
      const r: Record<string, any> = {};
      dataKeys.forEach((k) => {
        if (k === "category")
          r[k] =
            p.categories?.[0]?.main_category ??
            p.categories?.[0]?.category ??
            "";
        else if (k === "colors")
          r[k] = Array.isArray(p.colors) ? p.colors.join("/") : p.colors ?? "";
        else r[k] = (p as any)[k] ?? "";
      });
      ws.addRow(r);
    });

    const imgCol = xlsxCols.findIndex((c) => c.key === "__img");
    const imgColWidthChars = ws.getColumn(imgCol + 1).width as number;
    const baseCellHeightPx = colCharsToPx(imgColWidthChars);

    for (let i = 0; i < rows.length; i++) {
      const url = rows[i].front_image_url;
      if (!url) continue;
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.readAsDataURL(blob);
        });
        const { w: iw, h: ih } = await getImgSize(dataUrl);
        if (!iw || !ih) continue;
        const base64 = (dataUrl.split(",")[1] || "").trim();
        if (!base64) continue;
        const ext: "png" | "jpeg" = /\.png(\?|$)/i.test(url) ? "png" : "jpeg";
        const imgId = wb.addImage({ base64, extension: ext });

        const rowIndex = i + 2;
        ws.getRow(rowIndex).height = pxToPt(baseCellHeightPx);

        const cellWpx = colCharsToPx(ws.getColumn(imgCol + 1).width);
        const cellHpx = baseCellHeightPx;
        const scale = Math.min(cellWpx / iw, cellHpx / ih);
        const w = Math.round(iw * scale);
        const h = Math.round(ih * scale);
        const offXFrac = (cellWpx - w) / cellWpx / 2;
        const offYFrac = (cellHpx - h) / cellHpx / 2;

        ws.addImage(imgId, {
          tl: { col: imgCol + offXFrac, row: rowIndex - 1 + offYFrac },
          ext: { width: w, height: h },
          editAs: "oneCell",
        });
      } catch {
        continue;
      }
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `FEDIT_${yymmdd()}.xlsx`);
  }

  return (
    <section className="flex justify-between h-14 bg-[#ECEEF0] px-12 py-2 gap-2 relative">
      <div className="flex items-center flex-1 min-w-0 gap-2">
        <button
          type="button"
          onClick={() => setBrandOpen((prev) => !prev)}
          className="text-[#888A8C] flex items-center h-10 gap-1 p-2 text-sm font-semibold bg-white rounded-lg w-18 border border-[#E4E4E4] cursor-pointer select-none shrink-0"
        >
          <p>브랜드</p>
          <Icon
            icon="mingcute:down-fill"
            color="#888A8C"
            className={`w-3 transition-transform duration-300 ${
              isBrandOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          className="flex-1 min-w-0 overflow-x-auto x-scroll-hide whitespace-nowrap"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex gap-2">
            {brandList.map((brand) => (
              <button
                key={brand}
                type="button"
                className="font-semibold inline-flex px-3 h-10 rounded-lg border-1 border-[#3D3F41] bg-white text-[#3D3F41] items-center justify-center text-sm shrink-0"
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isProductTab && (
        <button
          onClick={() => downloadXlsxWithImages(resultLists as ApiDetail[])}
          className="text-white flex items-center h-10 gap-1 py-2 px-2 text-sm font-semibold bg-[#242628] rounded-lg w-32 cursor-pointer select-none shrink-0"
        >
          <Icon icon="ci:download" className="w-6" />
          <p>엑셀 다운로드</p>
        </button>
      )}

      <BrandFilterModal
        isOpen={isBrandOpen}
        onClose={() => setBrandOpen(false)}
        onSubmit={() => {
          setBrandOpen(false);
        }}
      />
    </section>
  );
}

export default BrandTab;
