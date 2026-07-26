import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { useSubscriptionStore } from "@/stores/SubscriptionStore";
import {
  useExcelDownloadStore,
  getExcelDownloadRemaining,
  EXCEL_MONTHLY_LIMIT,
} from "@/stores/ExcelDownloadStore";
import useFilteredData from "@/lib/filteredData";
import { GetProductList } from "@/apis/AnalysisAPI";
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
  const { brandList } = useFilterStore((s) => s);
  const currentPlan = useSubscriptionStore(
    (s) => s.subscription?.plan ?? "free",
  );
  const excelDownloadState = useExcelDownloadStore((s) => s);
  const excelRemaining = getExcelDownloadRemaining(excelDownloadState);
  const {
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
  } = useFilteredData();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const id = "brandtab-hide-scrollbar";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `.x-scroll-hide::-webkit-scrollbar{display:none;}`;
      document.head.appendChild(style);
    }
  }, []);

  async function downloadXlsxWithImages(rows: ApiDetail[], brandLabel?: string) {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Products");
    ws.columns = xlsxCols as any;

    xlsxCols.forEach((c, i) => {
      const idx = i + 1;
      if (
        ["details", "ai_description", "product_detail_url"].includes(
          String(c.key),
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
          r[k] = Array.isArray(p.vlm?.color) ? p.vlm.color.join("/") : "";
        else if (k === "material")
          r[k] = p.vlm?.material ?? "";
        else if (k === "details")
          r[k] = Array.isArray(p.vlm?.detail) ? p.vlm.detail.join(", ") : "";
        else r[k] = (p as any)[k] ?? "";
      });
      ws.addRow(r);
    });

    const imgCol = xlsxCols.findIndex((c) => c.key === "__img");
    const imgColWidthChars = ws.getColumn(imgCol + 1).width as number;
    const baseCellHeightPx = colCharsToPx(imgColWidthChars);

    for (let i = 0; i < rows.length; i++) {
      const url = rows[i].thumbnail || rows[i].front_image_url;
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
    const namePart = brandLabel ? `_${brandLabel}` : "";
    saveAs(blob, `FEDIT${namePart}_${yymmdd()}.xlsx`);
  }

  // 브랜드 하나만 지정해 전체 페이지를 끝까지 순회하며 모은다. 화면에 이미
  // 로드된 resultLists는 여러 브랜드가 섞여 있고 무한 스크롤로 일부만 불러온
  // 상태일 수 있어, 엑셀에는 항상 해당 브랜드의 전체 데이터를 새로 받아 담는다.
  async function fetchAllProductsForBrand(
    brand: string | null,
  ): Promise<ApiDetail[]> {
    const items: ApiDetail[] = [];
    let cursor: string | null = null;
    do {
      const data = await GetProductList({
        brandList: brand ? [brand] : [],
        selectedColors,
        selectedGenders,
        selectedCategories,
        selectedDetails,
        selectedPatterns,
        selectedSeasons,
        cursor,
      });
      const pageItems = Array.isArray(data?.items) ? data.items : [];
      items.push(...pageItems);
      cursor = data?.nextCursor || null;
    } while (cursor);
    return items;
  }

  const isFree = currentPlan === "free";
  const isBasicLimitReached = currentPlan === "basic" && excelRemaining <= 0;
  const isDownloadDisabled = isFree || isBasicLimitReached || isDownloading;

  const handleDownloadClick = async () => {
    if (isDownloadDisabled) {
      if (isBasicLimitReached) {
        alert(
          `이번 달 엑셀 다운로드 횟수(월 ${EXCEL_MONTHLY_LIMIT}회)를 모두 사용했어요. 다음 달에 다시 이용해주세요.`,
        );
      }
      return;
    }

    // 브랜드가 여러 개 선택돼 있어도 한 번에 한 브랜드씩만 요청해서 브랜드별로
    // 파일을 나눠 받는다. 선택된 브랜드가 없으면(기본 무신사 데이터) 한 번만 받는다.
    const targets = brandList.length > 0 ? brandList : [null];

    setIsDownloading(true);
    setDownloadProgress({ done: 0, total: targets.length });
    try {
      for (let i = 0; i < targets.length; i++) {
        const brand = targets[i];
        const rows = await fetchAllProductsForBrand(brand);
        if (rows.length > 0) {
          await downloadXlsxWithImages(rows, brand ?? undefined);
        }
        setDownloadProgress({ done: i + 1, total: targets.length });
      }
      if (currentPlan === "basic") {
        useExcelDownloadStore.getState().commitDownload();
      }
    } catch {
      alert("엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  return (
    <section className="flex justify-between h-14 bg-surface-base px-12 py-2 gap-2 relative pl-32">
      <div className="flex items-center flex-1 min-w-0 gap-2">
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
                className="font-semibold inline-flex px-3 h-10 rounded-lg  bg-fill-primary text-white items-center justify-center text-sm shrink-0"
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isProductTab && (
        <button
          onClick={handleDownloadClick}
          disabled={isDownloadDisabled}
          title={
            isFree
              ? "무료 요금제는 엑셀 다운로드를 이용할 수 없어요. 요금제를 업그레이드해주세요."
              : isBasicLimitReached
                ? `이번 달 엑셀 다운로드 횟수(월 ${EXCEL_MONTHLY_LIMIT}회)를 모두 사용했어요.`
                : undefined
          }
          className={[
            "flex h-10 shrink-0 select-none items-center justify-center gap-1 rounded-lg border border-line-alt bg-white px-3 py-2 text-base font-semibold text-tx-neutral",
            isDownloadDisabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-pointer",
          ].join(" ")}
        >
          <Icon
            icon={isDownloading ? "svg-spinners:180-ring" : "ci:download"}
            className="w-5"
          />
          <p>
            {isDownloading
              ? `다운로드 중… (${downloadProgress?.done ?? 0}/${downloadProgress?.total ?? 0})`
              : currentPlan === "basic"
                ? `엑셀 다운로드 (${excelRemaining}/${EXCEL_MONTHLY_LIMIT})`
                : "엑셀 다운로드"}
          </p>
        </button>
      )}
    </section>
  );
}

export default BrandTab;
