import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useProductStore } from "@/stores/ProductStore";
import { GetDetailInfo, GetProductByItemCode, GetRelatedItemInfo } from "@/apis/AnalysisAPI";
import type { ApiDetail } from "@/types/Product";
import DetailItem from "./DetailItem";
import defaultImg from "@/assets/logo/defaultImg.svg";
import AIAnalysisBox from "./AIAnalysisBox";
import TrendIndexBox from "./TrendIndexBox";

const hasValue = (v: string | string[] | undefined | null) =>
  Array.isArray(v)
    ? v.filter((s) => s.trim() !== "" && s.toLowerCase() !== "nan").length > 0
    : !!v && v.trim() !== "" && v.toLowerCase() !== "nan";

function formatPrice(price?: string | number | null) {
  if (price === null || price === undefined || price === "") return "";
  if (typeof price === "string" && /[₩$€¥]/.test(price)) return price;
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!isFinite(n)) return String(price);
  return `₩${Math.floor(n).toLocaleString("ko-KR")}`;
}

type RelatedItem = { itemcode?: string; product_image_url?: string };
type Props = {
  product?: ApiDetail | null;
  itemcodeOverride?: string;
  onClose?: () => void;
  onItemClick?: (id: string) => void;
};

export default function ProductDetailContent({ product, itemcodeOverride, onClose, onItemClick }: Props = {}) {
  const { setSelectedProductId, selectedProductId } = useProductStore((s) => s);
  const effectiveId = itemcodeOverride ?? selectedProductId;
  const [detailData, setDetailData] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState<RelatedItem[]>([]);

  useEffect(() => {
    if (!effectiveId) return;

    if (product && product.itemcode === effectiveId) {
      setDetailData(product);
      return;
    }

    let canceled = false;
    (async () => {
      try {
        setLoading(true);
        const res: ApiDetail = itemcodeOverride
          ? await GetProductByItemCode(effectiveId)
          : await GetDetailInfo({ itemcode: effectiveId });
        if (!canceled) setDetailData(res ?? null);
      } catch {
        if (!canceled) setDetailData(null);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [effectiveId, product, itemcodeOverride]);

  useEffect(() => {
    if (!effectiveId) return;
    let canceled = false;
    (async () => {
      try {
        const res = await GetRelatedItemInfo({ itemcode: effectiveId });
        const items = Array.isArray(res)
          ? res
          : (res as any)?.related_item || [];
        if (!canceled) setRelated(items as RelatedItem[]);
      } catch {
        if (!canceled) setRelated([]);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [effectiveId]);

  const mainCategory = useMemo(
    () => detailData?.categories?.[0]?.main_category ?? "",
    [detailData],
  );
  const subCategory = useMemo(
    () => detailData?.categories?.[0]?.category ?? "",
    [detailData],
  );

  const releaseText = useMemo(() => {
    if (!detailData?.release_date) return "-";
    return dayjs(detailData.release_date).isValid()
      ? dayjs(detailData.release_date).format("YYYY.MM.DD")
      : detailData.release_date;
  }, [detailData]);

  const getPlatformLabel = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("무신사")) return "무";
    if (p.includes("wconcept")) return "W";
    if (p.includes("29cm")) return "29";
    return p;
  };

  if (!effectiveId && !detailData) return null;

  return (
    <div className="relative bg-white rounded-2xl">
      {loading ? (
        <div className="p-10 text-center text-gray-500">
          상세 정보를 불러오는 중…
        </div>
      ) : (
        detailData && (
          <>
            <section className="flex flex-col gap-5 mb-6 lg:flex-row">
              <div className="relative flex-shrink-0">
                <img
                  src={
                    detailData.thumbnail ||
                    detailData.front_image_url ||
                    defaultImg
                  }
                  className="w-[400px] h-[530px] object-cover rounded-xl bg-[#F9FAFB]"
                  alt="product"
                />

                <div className="absolute flex items-center justify-between top-4 left-4 right-4">
                  <button
                    onClick={() => onClose ? onClose() : setSelectedProductId(null)}
                    className="flex items-center justify-center w-8 h-8 transition-colors bg-white rounded-lg shadow-md hover:bg-gray-50"
                  >
                    <Icon
                      icon="lucide:arrow-left"
                      className="w-4 h-4 text-[#242628]"
                    />
                  </button>

                  {detailData.product_detail_url && (
                    <a
                      href={detailData.product_detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-[2px] bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-xs font-medium text-[#6F7173] hover:bg-white transition-colors"
                    >
                      상세페이지
                      <Icon icon="lucide:external-link" className="w-2 h-2" />
                    </a>
                  )}
                </div>

                {detailData.platform && (
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center justify-center w-5 h-5 text-white bg-[#3D3F41] rounded text-xs font-medium">
                      {getPlatformLabel(detailData.platform)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between ">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#242628]">
                      {detailData.brand || "-"}
                    </span>
                    <div className="text-xs text-[#91929D] mb-4">
                      {mainCategory} {subCategory && ` / ${subCategory}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 cursor-pointer group">
                      <span className="text-[#3D3F41] text-sm font-semibold group-hover:text-[#242628] transition-colors">
                        폴더명
                      </span>
                      <Icon
                        icon="mingcute:down-line"
                        className="w-5 h-5 text-[#3D3F41] group-hover:text-[#242628] transition-colors"
                      />
                    </div>

                    <button className="flex items-center gap-1 px-3 py-2 bg-[#242628] text-white rounded-lg text-base font-semibold">
                      저장하기
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl font-semibold text-[#0B0E0F] mb-5 break-all leading-tight">
                  {detailData.product_name}
                </h1>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {detailData.regular_price && (
                      <span className="text-sm font-semibold text-[#91929D] line-through">
                        {formatPrice(detailData.regular_price)}
                      </span>
                    )}
                    <span className="text-base font-bold text-[#242628]">
                      {formatPrice(detailData.current_price)}
                    </span>
                  </div>

                  <div className="w-[1px] h-4 bg-[#E4E4E4]" />

                  <div className="flex items-center gap-2">
                    <span className="bg-[#ECEEF0] px-2 py-1 rounded text-[11px] font-bold text-[#6F7173]">
                      성별
                    </span>
                    <span className="text-xs font-medium text-[#242628]">
                      {detailData.gender || "-"}
                    </span>
                  </div>

                  <div className="w-[1px] h-4 bg-[#E4E4E4]" />

                  <div className="flex items-center gap-2">
                    <span className="bg-[#ECEEF0] px-2 py-1 rounded text-[11px] font-bold text-[#6F7173]">
                      신상 업데이트
                    </span>
                    <span className="text-xs font-medium text-[#242628]">
                      {releaseText}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 mb-6">
                  {detailData.views && (
                    <div className="px-3 py-1.5 bg-[#EBF2FF] text-[#3E7EFF] text-xs font-bold rounded-lg">
                      누적조회수{" "}
                      {Number(detailData.views).toLocaleString("ko-KR")}
                    </div>
                  )}
                  {detailData.sales != 1 && (
                    <div className="px-3 py-1.5 bg-[#FFF5E9] text-[#FF9528] text-xs font-bold rounded-lg">
                      누적판매{" "}
                      {Number(detailData.sales).toLocaleString("ko-KR")}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {hasValue(detailData.vlm?.color) && <DetailItem title="색상" content={detailData.vlm!.color} itemcode={effectiveId ?? ""} />}
                  {hasValue(detailData.vlm?.material) && <DetailItem title="소재" content={detailData.vlm!.material} itemcode={effectiveId ?? ""} />}
                  {hasValue(detailData.vlm?.length) && <DetailItem title="기장" content={detailData.vlm!.length} itemcode={effectiveId ?? ""} />}
                  {hasValue(detailData.vlm?.sleeve) && <DetailItem title="소매 길이" content={detailData.vlm!.sleeve} itemcode={effectiveId ?? ""} />}
                  {hasValue(detailData.vlm?.neckline) && <DetailItem title="넥라인" content={detailData.vlm!.neckline} itemcode={effectiveId ?? ""} />}
                  {hasValue(detailData.vlm?.fit) && <DetailItem title="핏" content={detailData.vlm!.fit} itemcode={effectiveId ?? ""} />}
                  {hasValue(detailData.vlm?.detail) && <DetailItem title="디테일" content={detailData.vlm!.detail} itemcode={effectiveId ?? ""} />}
                  {hasValue(detailData.vlm?.pattern) && <DetailItem title="패턴" content={detailData.vlm!.pattern} itemcode={effectiveId ?? ""} />}
                </div>
              </div>
            </section>

            <AIAnalysisBox
              content={detailData.ai_description || ""}
              itemcode={effectiveId ?? ""}
              isRanking={false}
            />
            <TrendIndexBox itemCode={effectiveId ?? ""} />
            <div className="h-[1px] w-full bg-[#E4E4E4] my-5" />
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[#56585A]">
                유사한 스타일 아이템
              </span>
              <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {related.map((r, idx) => (
                  <button
                    key={r.itemcode || idx}
                    type="button"
                    className="flex-shrink-0"
                    onClick={() =>
                      r.itemcode && (onItemClick ? onItemClick(r.itemcode) : setSelectedProductId(r.itemcode))
                    }
                  >
                    <img
                      src={r.product_image_url || defaultImg}
                      alt={`related-${idx}`}
                      className="object-cover rounded-lg w-42 h-42"
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
