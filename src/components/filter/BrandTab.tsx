import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from "@/stores/SubscriptionStore";
import {
  useExcelDownloadStore,
  getExcelDownloadRemaining,
  EXCEL_MONTHLY_LIMIT,
} from "@/stores/ExcelDownloadStore";
import useFilteredData from "@/lib/filteredData";
import { GetProductList } from "@/apis/AnalysisAPI";
import DateNavNotice from "@/components/main/DateNavNotice";
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
  { header: "기장", key: "length", width: 12 },
  { header: "소매 길이", key: "sleeve", width: 12 },
  { header: "넥라인", key: "neckline", width: 12 },
  { header: "핏", key: "fit", width: 12 },
  { header: "패턴", key: "pattern", width: 14 },
  { header: "디테일", key: "details", width: 40 },
  { header: "AI BETA", key: "ai_description", width: 40 },
  { header: "평점", key: "rating", width: 8 },
  { header: "리뷰 수", key: "reviews", width: 10 },
  { header: "누적 판매", key: "sales", width: 12 },
  { header: "조회수", key: "views", width: 12 },
  { header: "상품 상세 주소", key: "product_detail_url", width: 50 },
];

// ProductBox/ProductDetailContent와 동일한 규칙(₩ + 천단위 콤마)으로 맞춘다.
const formatPrice = (price?: string | number | null) => {
  if (price === null || price === undefined || price === "") return "";
  if (typeof price === "string" && /[₩$€¥]/.test(price)) return price;
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!isFinite(n)) return String(price);
  return `₩${Math.floor(n).toLocaleString("ko-KR")}`;
};

const colCharsToPx = (w?: number) => Math.floor((w ?? 8.43) * 7 + 5);
const pxToPt = (px: number) => (px * 72) / 96;

// 썸네일 CDN이 webp/gif 등 다양한 포맷으로 내려주는 경우가 많은데, 확장자만
// 보고 무조건 png/jpeg로 단정해 심으면 엑셀이 실제 바이트와 라벨이 안 맞아
// 이미지를 못 그리는 경우가 있었다. 캔버스로 한 번 그려서 항상 png로
// 통일해 심으면 원본 포맷과 무관하게 엑셀에서 정상적으로 보인다.
const toPngDataUrl = (dataUrl: string) =>
  new Promise<{ pngDataUrl: string; w: number; h: number }>(
    (resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          reject(new Error("이미지 크기를 읽지 못함"));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("캔버스를 생성하지 못함"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          resolve({ pngDataUrl: canvas.toDataURL("image/png"), w, h });
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("이미지를 디코딩하지 못함"));
      img.src = dataUrl;
    },
  );
const yymmdd = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
};

// 무신사/29cm 플랫폼 코드 -> 화면에 보여줄 라벨 (BrandFilterModal의
// PLATFORM_LABEL_TO_CODE와 반대 방향 매핑).
const PLATFORM_LABELS: Record<string, string> = {
  musinsa: "무신사",
  "29cm": "29cm",
};

function BrandTab({ isProductTab }: Props) {
  const { brandList, platformList } = useFilterStore((s) => s);
  const currentPlan = useSubscriptionStore((s) =>
    toBillingPlan(getEffectivePlan(s.subscription)),
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
  const [isDownloadHovered, setIsDownloadHovered] = useState(false);

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
        else if (k === "fit")
          r[k] = p.vlm?.fit ?? "";
        else if (k === "length")
          r[k] = p.vlm?.length ?? "";
        else if (k === "sleeve")
          r[k] = p.vlm?.sleeve ?? "";
        else if (k === "neckline")
          r[k] = p.vlm?.neckline ?? "";
        else if (k === "pattern")
          r[k] = Array.isArray(p.vlm?.pattern)
            ? p.vlm.pattern.join("/")
            : (p.vlm?.pattern ?? "");
        else if (k === "details")
          r[k] = Array.isArray(p.vlm?.detail) ? p.vlm.detail.join(", ") : "";
        else if (k === "current_price" || k === "regular_price")
          r[k] = formatPrice((p as any)[k]);
        else r[k] = (p as any)[k] ?? "";
      });
      ws.addRow(r);
    });

    const imgCol = xlsxCols.findIndex((c) => c.key === "__img");
    const imgColWidthChars = ws.getColumn(imgCol + 1).width as number;
    const baseCellHeightPx = colCharsToPx(imgColWidthChars);

    for (let i = 0; i < rows.length; i++) {
      const url = rows[i].thumbnail || rows[i].front_image_url;
      const rowIndex = i + 2;
      // 이미지를 못 심으면(대부분 썸네일 서버가 CORS로 fetch 자체를 막는
      // 경우) 칸을 비워두지 않고 최소한 원본 링크라도 클릭할 수 있게 남긴다.
      if (!url) continue;
      try {
        // 썸네일 서버가 CORS를 안 열어줘서 직접 fetch가 막히므로, CORS를
        // 허용하는 공개 이미지 프록시(weserv)를 한 번 거쳐서 가져온다.
        const res = await fetch(
          `https://images.weserv.nl/?url=${encodeURIComponent(url)}`,
        );
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.readAsDataURL(blob);
        });
        const { pngDataUrl, w: iw, h: ih } = await toPngDataUrl(dataUrl);
        const base64 = (pngDataUrl.split(",")[1] || "").trim();
        if (!base64) throw new Error("이미지 데이터가 비어 있음");
        const imgId = wb.addImage({ base64, extension: "png" });

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
        ws.getCell(rowIndex, imgCol + 1).value = {
          text: "이미지 링크",
          hyperlink: url,
        };
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

  // 브랜드(또는 플랫폼) 하나만 지정해 전체 페이지를 끝까지 순회하며 모은다.
  // 화면에 이미 로드된 resultLists는 여러 브랜드가 섞여 있고 무한 스크롤로
  // 일부만 불러온 상태일 수 있어, 엑셀에는 항상 전체 데이터를 새로 받아 담는다.
  async function fetchAllProductsForTarget(target: {
    brand: string | null;
    platform: string | null;
  }): Promise<ApiDetail[]> {
    const items: ApiDetail[] = [];
    let cursor: string | null = null;
    do {
      const data = await GetProductList({
        brandList: target.brand ? [target.brand] : [],
        platformList: target.platform ? [target.platform] : [],
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

    // 브랜드/플랫폼이 여러 개 선택돼 있어도 한 번에 하나씩만 요청해서
    // 파일을 나눠 받는다. 아무것도 선택 안 돼 있으면(기본 무신사 데이터)
    // 한 번만 받는다.
    const targets = [
      ...brandList.map((brand) => ({ brand, platform: null })),
      ...platformList.map((platform) => ({ brand: null, platform })),
    ];
    const finalTargets =
      targets.length > 0 ? targets : [{ brand: null, platform: null }];

    setIsDownloading(true);
    setDownloadProgress({ done: 0, total: finalTargets.length });
    try {
      for (let i = 0; i < finalTargets.length; i++) {
        const target = finalTargets[i];
        const rows = await fetchAllProductsForTarget(target);
        if (rows.length > 0) {
          const label =
            target.brand ??
            (target.platform ? PLATFORM_LABELS[target.platform] : undefined);
          await downloadXlsxWithImages(rows, label);
        }
        setDownloadProgress({ done: i + 1, total: finalTargets.length });
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
            {platformList.map((platform) => (
              <button
                key={`platform-${platform}`}
                type="button"
                className="font-semibold inline-flex px-3 h-10 rounded-lg  bg-fill-primary text-white items-center justify-center text-sm shrink-0"
              >
                {PLATFORM_LABELS[platform] ?? platform} 전체
              </button>
            ))}
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
        <div className="relative">
          <button
            onClick={handleDownloadClick}
            disabled={isDownloadDisabled}
            onMouseEnter={() => setIsDownloadHovered(true)}
            onMouseLeave={() => setIsDownloadHovered(false)}
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

          {isDownloadHovered && !isFree && (
            <DateNavNotice>
              엑셀 파일 하나당 브랜드 1개만 다운로드돼요
              {currentPlan === "basic" && (
                <>
                  <br />
                  Basic 요금제는 월 3회까지 다운로드할 수 있어요
                </>
              )}
            </DateNavNotice>
          )}
        </div>
      )}
    </section>
  );
}

export default BrandTab;
