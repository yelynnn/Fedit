import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useRef, useState } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { trackExcelDownload } from "@/lib/analytics";
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from "@/stores/SubscriptionStore";
import useFilteredData from "@/lib/filteredData";
import {
  GetProductList,
  GetExcelDownloadUsage,
  PostExcelDownload,
  type ExcelDownloadUsage,
} from "@/apis/AnalysisAPI";
import DateNavNotice from "@/components/main/DateNavNotice";
import { formatPrice } from "@/lib/price";
import type { ApiDetail } from "@/types/Product";
import { formatSalesCount } from "@/lib/utils";

// 헤더의 Excel 버튼(상품 분석 화면에서만 노출). 선택한 브랜드(또는 플랫폼)의
// 상품을 이미지 포함 엑셀로 받는다. 요금제별 한도·진행/중단·안내 말풍선 포함.

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

// excel_downloaded 이벤트의 export_type — 어느 분석 탭에서 받았는지 구분.
const EXPORT_TYPE_BY_TAB: Record<string, string> = {
  "상품 분석": "product_analysis",
  "색상 분석": "color_analysis",
  "유형 분석": "type_analysis",
  "패션쇼 분석": "fashion_show", // feature_viewed의 feature_name과 맞춘다
};

function ExcelDownloadButton() {
  const { brandList, platformList, selectedTab } = useFilterStore((s) => s);
  const currentPlan = useSubscriptionStore((s) =>
    toBillingPlan(getEffectivePlan(s.subscription)),
  );
  const {
    selectedColors,
    selectedGenders,
    selectedCategories,
    selectedDetails,
    selectedPatterns,
    selectedSeasons,
    selectedMoods,
    selectedSeasonFeels,
  } = useFilteredData();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [isDownloadHovered, setIsDownloadHovered] = useState(false);
  const [usage, setUsage] = useState<ExcelDownloadUsage | null>(null);
  const downloadAbortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  const isFree = currentPlan === "free";
  const isBasicLike = currentPlan === "basic";
  const isPro = currentPlan === "pro";
  const isEnterprise = currentPlan === "enterprise";
  const hasExcelLimit = isBasicLike || isPro;
  // Enterprise는 한도는 없지만(hasExcelLimit에 안 넣음), 여러 브랜드를
  // 한 파일로 합쳐 받는 Pro의 편의는 그대로 누린다.
  const combinesFiles = isPro || isEnterprise;

  // FREE는 두 API 모두 403이라 아예 안 부른다. BASIC/BASIC_SECRET(둘 다
  // toBillingPlan에서 "basic"으로 합쳐짐)와 PRO는 둘 다 월 한도가 있어서
  // (Basic 월 3회, Pro 월 30회) 조회한다.
  useEffect(() => {
    if (!hasExcelLimit) {
      setUsage(null);
      return;
    }
    let ignore = false;
    GetExcelDownloadUsage()
      .then((u) => {
        if (!ignore) setUsage(u);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [hasExcelLimit]);

  // 다운로드 도중 이 컴포넌트가 언마운트되면(탭 전환 등) 진행 중이던 요청도
  // 같이 취소한다.
  useEffect(() => {
    return () => {
      downloadAbortControllerRef.current?.abort();
    };
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
        // 할인 중이 아닌 상품(할인가 없음)은 현업 엑셀 관행대로 현재가(판매가)를
        // 정가와 같은 금액으로 채우고 할인율은 0%로 둔다 — 비워 두면 정렬·평균·
        // 피벗에서 빠지거나 0원으로 계산된다. 백엔드가 준 할인율은 그대로 쓴다.
        else if (k === "current_price")
          r[k] = formatPrice(p.current_price) || formatPrice(p.regular_price);
        else if (k === "regular_price") r[k] = formatPrice(p.regular_price);
        else if (k === "discount_rate") {
          const hasRate = p.discount_rate !== null && p.discount_rate !== undefined && p.discount_rate !== "";
          const noDiscount = !formatPrice(p.current_price) && !!formatPrice(p.regular_price);
          r[k] = hasRate ? p.discount_rate : noDiscount ? "0%" : "";
        }
        // 판매량은 화면과 동일하게 표시한다 — 값이 없거나 1 이하(백엔드가
        // 데이터 없을 때 내려주는 값)는 빈칸, 500건 이하는 "500건 이하".
        else if (k === "sales") r[k] = formatSalesCount(p.sales) ?? "";
        // 평점 0은 실제 평점이 아니라 값이 없는 것이라 빈칸으로 둔다.
        else if (k === "rating") {
          const rating = Number(p.rating);
          r[k] = Number.isFinite(rating) && rating > 0 ? rating : "";
        }
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
    // 브랜드(또는 플랫폼) 하나만 받는 경우 파일명을 "다이닛_261002"처럼
    // 해당 이름으로, 여러 브랜드를 합친 파일은 기존처럼 "FEDIT_261002"로 저장한다.
    // 파일명에 쓸 수 없는 문자는 "_"로 바꾼다.
    const namePart = brandLabel
      ? brandLabel.replace(/[\\/:*?"<>|]/g, "_").trim()
      : "";
    saveAs(blob, `${namePart || "FEDIT"}_${yymmdd()}.xlsx`);
  }

  // 브랜드(또는 플랫폼) 하나만 지정해 전체 페이지를 끝까지 순회하며 모은다.
  // 화면에 이미 로드된 resultLists는 여러 브랜드가 섞여 있고 무한 스크롤로
  // 일부만 불러온 상태일 수 있어, 엑셀에는 항상 전체 데이터를 새로 받아 담는다.
  async function fetchAllProductsForTarget(
    target: { brand: string | null; platform: string | null },
    signal: AbortSignal,
  ): Promise<ApiDetail[]> {
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
        selectedMoods,
        selectedSeasonFeels,
        cursor,
        signal,
      });
      const pageItems = Array.isArray(data?.items) ? data.items : [];
      items.push(...pageItems);
      cursor = data?.nextCursor || null;
    } while (cursor);
    return items;
  }

  // 브랜드/플랫폼이 여러 개 선택돼 있으면 한 번에 하나씩 나눠서 파일을
  // 여러 개 받는다. 아무것도 선택 안 돼 있으면(기본 무신사 데이터) 한
  // 번만 받는다. Basic/Basic_secret은 다운로드 1회 = 서버 한도 1회 소진
  // 이라, 여러 브랜드를 한 번에 고르면 클릭 한 번으로 한 달 한도(3회)가
  // 순식간에 다 없어질 수 있어 브랜드 1개만 선택했을 때만 받을 수 있게 막는다.
  const targets = [
    ...brandList.map((brand) => ({ brand, platform: null as string | null })),
    ...platformList.map((platform) => ({
      brand: null as string | null,
      platform,
    })),
  ];
  const finalTargets =
    targets.length > 0 ? targets : [{ brand: null, platform: null }];

  const getTargetLabel = (target: {
    brand: string | null;
    platform: string | null;
  }) =>
    target.brand ??
    (target.platform ? PLATFORM_LABELS[target.platform] : undefined);

  const isBasicUsageLoading = isBasicLike && usage === null;
  const isBasicLimitReached =
    isBasicLike && usage !== null && !usage.canDownload;
  const isBasicMultiTargetBlocked = isBasicLike && finalTargets.length > 1;
  const isProUsageLoading = isPro && usage === null;
  const isProLimitReached = isPro && usage !== null && !usage.canDownload;
  // 다운로드 중에는 이 버튼이 "중단" 버튼으로 바뀌므로 여기엔 안 넣는다 —
  // 눌러서 취소할 수 있어야 하니 계속 활성 상태여야 한다.
  const isDownloadDisabled =
    isFree ||
    isBasicUsageLoading ||
    isBasicLimitReached ||
    isBasicMultiTargetBlocked ||
    isProUsageLoading ||
    isProLimitReached;

  const handleDownloadClick = async () => {
    if (isDownloadDisabled) return;

    const controller = new AbortController();
    downloadAbortControllerRef.current = controller;
    isCancelledRef.current = false;

    setIsDownloading(true);
    setDownloadProgress({ done: 0, total: finalTargets.length });
    try {
      // Pro는 브랜드를 여러 개 골라도 파일 하나로 합쳐서 받는다 — 여기에
      // 다 모아뒀다가 루프가 끝난 뒤 한 번에 저장한다. Basic은 이미 브랜드
      // 1개로 제한돼 있어서 기존처럼 브랜드마다 파일을 바로바로 저장한다.
      const combinedRows: ApiDetail[] = [];

      for (let i = 0; i < finalTargets.length; i++) {
        // 브랜드 사이(=파일 사이) 경계에서 중단 여부를 확인한다 — 이미
        // 완성돼서 저장까지 끝난 파일의 다운로드 횟수는 그대로 유지된다.
        if (isCancelledRef.current) break;

        const target = finalTargets[i];
        let rows: ApiDetail[];
        try {
          rows = await fetchAllProductsForTarget(target, controller.signal);
        } catch (fetchError: any) {
          if (isCancelledRef.current) break;
          throw fetchError;
        }
        if (isCancelledRef.current) break;

        if (combinesFiles) {
          combinedRows.push(...rows);
        } else if (rows.length > 0) {
          await downloadXlsxWithImages(rows, getTargetLabel(target));
          trackExcelDownload(
            EXPORT_TYPE_BY_TAB[selectedTab] ?? "unknown",
            brandList,
            rows.length,
          );

          // 파일 하나가 실제로 완성될 때만(=중단되기 전에 끝까지 받았을
          // 때만) 서버에 기록한다. 중단하면 그 시점까지 받은 파일들의
          // 기록은 이미 남아있고, 진행 중이던/못 받은 파일은 카운트되지
          // 않는다. 응답으로 화면 사용량을 그대로 갱신한다.
          try {
            const updated = await PostExcelDownload();
            setUsage(updated);
            if (!updated.canDownload) break;
          } catch (recordError: any) {
            if (recordError?.code === "EXCEL_DOWNLOAD_LIMIT_EXCEEDED") {
              alert(
                recordError.message || "이번 달 엑셀 다운로드 한도를 초과했습니다.",
              );
              break;
            }
            // 기록 자체가 실패해도 파일은 이미 받았으니 조용히 넘어간다.
          }
        }
        setDownloadProgress({ done: i + 1, total: finalTargets.length });
      }

      if (combinesFiles && !isCancelledRef.current && combinedRows.length > 0) {
        // 합쳐 받는 파일도 대상이 하나뿐이면 그 이름으로, 여러 개면 FEDIT로 저장한다.
        await downloadXlsxWithImages(
          combinedRows,
          finalTargets.length === 1 ? getTargetLabel(finalTargets[0]) : undefined,
        );
        trackExcelDownload(
          EXPORT_TYPE_BY_TAB[selectedTab] ?? "unknown",
          brandList,
          combinedRows.length,
        );
        try {
          const updated = await PostExcelDownload();
          setUsage(updated);
        } catch (recordError: any) {
          if (recordError?.code === "EXCEL_DOWNLOAD_LIMIT_EXCEEDED") {
            alert(
              recordError.message || "이번 달 엑셀 다운로드 한도를 초과했습니다.",
            );
          }
          // 기록 자체가 실패해도 파일은 이미 받았으니 조용히 넘어간다.
        }
      }
    } catch {
      if (!isCancelledRef.current) {
        alert("엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      downloadAbortControllerRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    isCancelledRef.current = true;
    downloadAbortControllerRef.current?.abort();
  };

  // 호버 안내 말풍선 문구 — 요금제별 한도와, 지금 못 받는 이유
  const usageText = usage ? ` (이번 달 ${usage.used}/${usage.limit}회)` : "";
  const hoverNotice = isFree
    ? "엑셀 다운로드는 Basic 요금제부터 이용할 수 있어요"
    : isBasicLike
      ? isBasicLimitReached
        ? `월 다운로드 횟수 ${usage?.limit ?? 3}회를 모두 사용했어요`
        : `Basic 요금제는 한 번에 브랜드 1개만, 월 ${usage?.limit ?? 3}회까지 다운로드할 수 있어요${usageText}`
      : isPro
        ? isProLimitReached
          ? `월 다운로드 횟수 ${usage?.limit ?? 30}회를 모두 사용했어요`
          : `Pro 요금제는 월 ${usage?.limit ?? 30}회까지 다운로드할 수 있어요${usageText}`
        : "지금 필터 그대로, 선택한 브랜드 상품을 엑셀로 받아요";

  return (
    // 호버는 버튼이 아니라 감싼 영역에서 감지한다 — 비활성(disabled) 버튼은
    // 브라우저가 마우스 이벤트를 보내지 않아서, 정작 "왜 못 받는지" 안내가
    // 필요한 순간(브랜드 여러 개 선택·횟수 소진)에 말풍선이 안 떴다.
    <div
      data-tour="excel-button"
      className="relative"
      onMouseEnter={() => setIsDownloadHovered(true)}
      onMouseLeave={() => setIsDownloadHovered(false)}
    >
      <button
        type="button"
        onClick={isDownloading ? handleCancelDownload : handleDownloadClick}
        disabled={!isDownloading && isDownloadDisabled}
        // 헤더 버튼 공통 규격(NewHeader의 HEADER_BUTTON과 동일)
        className={[
          "flex h-[34px] shrink-0 select-none items-center justify-center gap-[6px] rounded-lg border border-[#E4E4E4] bg-white px-2 py-1 text-[14px] font-medium leading-[1.43] tracking-[-0.07px] text-[#3D3F41] transition-colors",
          !isDownloading && isDownloadDisabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-pointer hover:bg-surface-base",
        ].join(" ")}
      >
        <Icon
          icon={isDownloading ? "ph:stop-circle-fill" : "ph:file-arrow-down"}
          className="h-[16.25px] w-[13.75px] shrink-0 text-[#3D3F41]"
        />
        {isDownloading
          ? `다운로드 중 ${downloadProgress?.done ?? 0}/${downloadProgress?.total ?? 0} · 중단`
          : "Excel"}
      </button>

      {isDownloadHovered && (
        <DateNavNotice>
          {isDownloading
            ? "누르면 다운로드를 중단해요. 이미 받은 파일의 횟수는 그대로 유지돼요."
            : hoverNotice}
        </DateNavNotice>
      )}
    </div>
  );
}

export default ExcelDownloadButton;
