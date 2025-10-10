import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useProductStore } from "@/stores/ProductStore";
import DetailSection from "./DetailSection";
import { GetDetailInfo, GetRelatedItemInfo } from "@/apis/AnalysisAPI";
import type { ApiDetail } from "@/types/Product";

function formatPrice(price?: string | number | null) {
  if (price === null || price === undefined || price === "") return "";

  if (typeof price === "string" && /[₩$€¥]/.test(price)) {
    return price;
  }

  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!isFinite(n)) return String(price);

  return `₩${Math.floor(n).toLocaleString("ko-KR")}`;
}

type RelatedItem = { itemcode?: string; product_image_url?: string };

type Props = { product?: ApiDetail | null };

export default function ProductDetailContent({ product }: Props) {
  const { setSelectedProductId, selectedProductId } = useProductStore((s) => s);
  const [detailData, setDetailData] = useState<ApiDetail | null>(
    product ?? null
  );
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const skipNextDetailFetchRef = useRef(false);

  useEffect(() => {
    if (product) {
      setDetailData(product);
      skipNextDetailFetchRef.current = true;
    } else {
      skipNextDetailFetchRef.current = false;
    }
  }, [product]);

  useEffect(() => {
    if (!selectedProductId) return;
    if (
      skipNextDetailFetchRef.current &&
      product?.itemcode === selectedProductId
    ) {
      skipNextDetailFetchRef.current = false;
      return;
    }
    let canceled = false;
    (async () => {
      try {
        setLoading(true);
        const res: ApiDetail = await GetDetailInfo({
          itemcode: selectedProductId,
        });
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
  }, [selectedProductId, product?.itemcode]);

  useEffect(() => {
    if (!selectedProductId) return;
    let canceled = false;
    (async () => {
      try {
        const res = await GetRelatedItemInfo({ itemcode: selectedProductId });
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.related_item)
          ? (res as any).related_item
          : [];
        if (!canceled) setRelated(items as RelatedItem[]);
      } catch {
        if (!canceled) setRelated([]);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [selectedProductId]);

  const mainCategory = useMemo(
    () => detailData?.categories?.[0]?.main_category ?? "",
    [detailData]
  );
  const subCategory = useMemo(
    () => detailData?.categories?.[0]?.category ?? "",
    [detailData]
  );

  const releaseText = useMemo(() => {
    if (!detailData?.release_date) return "-";
    return dayjs(detailData.release_date).isValid()
      ? dayjs(detailData.release_date).format("YYYY.MM.DD")
      : detailData.release_date;
  }, [detailData]);

  const lastCheckedText = useMemo(() => {
    if (detailData?.stop_selling_date) {
      const d = dayjs(detailData.stop_selling_date);
      return d.isValid()
        ? d.format("YYYY.MM.DD")
        : String(detailData.stop_selling_date);
    }
    return dayjs().format("YYYY.MM.DD");
  }, [detailData]);

  const discountRateText = useMemo(() => {
    const v = detailData?.discount_rate;
    if (v == null || v === "") return "";
    const num = typeof v === "string" ? parseFloat(v) : Number(v);
    if (!isFinite(num) || num === 0) return "";
    return `${Math.floor(num)}%`;
  }, [detailData]);

  if (!selectedProductId && !detailData) return null;

  return (
    <div className="relative">
      <div className="absolute cursor-pointer top-3 right-3">
        <Icon
          icon="fontisto:close-a"
          onClick={() => setSelectedProductId(null)}
        />
      </div>

      {loading && (
        <div className="p-6 text-sm text-gray-500">
          상세 정보를 불러오는 중…
        </div>
      )}

      {!loading && detailData && (
        <section className="flex items-start gap-5">
          <div className="flex flex-col flex-shrink-0 gap-6">
            {detailData.front_image_url ? (
              <img
                src={detailData.front_image_url}
                alt={detailData.product_name || "product"}
                className="object-cover h-129 w-96 rounded-xl"
              />
            ) : (
              <div className="flex items-center justify-center h-129 w-96 rounded-xl bg-[#F9FAFB] text-gray-400 text-sm">
                이미지 없음
              </div>
            )}

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-5 w-fit px-[6px] bg-[#ECEEF0] rounded text-xs text-[#56585A]">
                  신상 업데이트 일자
                </div>
                <p className="text-xs font-normal text-[#56585A]">
                  {releaseText}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-5 w-fit px-[6px] bg-[#ECEEF0] rounded text-xs text-[#56585A]">
                  마지막 확인된 일자
                </div>
                <p className="text-xs font-normal text-[#56585A]">
                  {lastCheckedText}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1 min-w-0 mt-3">
            <span className="text-[#56585A] text-sm font-semibold mb-3">
              {detailData.brand || "-"}
            </span>

            <div className="text-[#56585A] text-sm font-semibold gap-1 flex items-center">
              <p>{mainCategory || "카테고리"}</p>
              {subCategory && (
                <>
                  <Icon icon="mingcute:right-line" className="h-6" />
                  <p>{subCategory}</p>
                </>
              )}
            </div>

            <div className="flex items-end justify-between w-full text-[#56585A] mb-3">
              <span className="text-xl font-semibold">
                {detailData.product_name || "-"}
              </span>
              {detailData.product_detail_url && (
                <a
                  href={detailData.product_detail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-30 h-4 flex gap-1 text-xs cursor-pointer items-center text-[#56585A] whitespace-nowrap"
                >
                  <p>상품 상세페이지</p>
                  <Icon icon="mingcute:right-line" className="h-4" />
                </a>
              )}
            </div>

            {detailData.regular_price && (
              <span className="text-[#91929D] text-md line-through leading-6">
                {formatPrice(detailData.regular_price)}
              </span>
            )}

            <div className="flex mb-3">
              {discountRateText && (
                <div className="flex items-center justify-center h-6 rounded w-10 bg-[#FEE6C6] text-xs font-medium text-[#FF9200] mr-2">
                  {discountRateText}
                </div>
              )}
              <span className="text-[#3D3F41] font-semibold">
                {formatPrice(detailData.current_price)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {detailData.rating != null && (
                <div className="flex items-center gap-1 text-[#3D3F41]">
                  <Icon icon="tabler:star-filled" color="#3D3F41" />
                  {detailData.rating}
                </div>
              )}
              {detailData.reviews != null && (
                <span className="text-[#888A8C] text-xs font-semibold">
                  {detailData.reviews}개의 리뷰
                </span>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <section className="grid grid-cols-2 gap-x-16 gap-y-4">
                <DetailSection
                  title="성별"
                  content={detailData.gender || "-"}
                />
                <DetailSection
                  title="색상"
                  content={detailData.colors || "-"}
                />
                <DetailSection title="패턴" content="준비중" />
                <DetailSection title="사이즈" content="준비중" />
              </section>

              <DetailSection
                title="소재"
                content={detailData.material || "준비중"}
              />
              <DetailSection
                title="디테일"
                content={detailData.details || "-"}
              />
            </div>
          </div>
        </section>
      )}

      {!loading && (
        <>
          <div className="my-8 flex flex-col px-5 border rounded-lg w-full py-4 border-[1px] border-[#1A75FF] bg-[#EAF2FE] text-[#1A75FF] font-semibold">
            <div className="flex items-center mb-[10px]">
              <Icon
                icon="ic:baseline-lightbulb"
                color="#1A75FF"
                className="w-6"
              />
              <span className="text-base">AI BETA</span>
            </div>
            <span className="text-sm">{detailData?.ai_description || "-"}</span>
          </div>

          <span className="text-[#56585A] font-semibold mb-2">
            유사한 스타일 아이템
          </span>
          <div className="mt-2 flex gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {related.map((r, idx) => {
              const src = r.product_image_url || "";
              if (!src) return null;
              return r.itemcode ? (
                <button
                  key={r.itemcode}
                  type="button"
                  className="flex-shrink-0"
                  onClick={() => setSelectedProductId(r.itemcode!)}
                  title={r.itemcode}
                >
                  <img
                    src={src}
                    alt={`related-${idx}`}
                    className="object-cover rounded-lg w-42 h-42"
                  />
                </button>
              ) : (
                <img
                  key={`${src}-${idx}`}
                  src={src}
                  alt={`related-${idx}`}
                  className="flex-shrink-0 object-cover rounded-lg w-42 h-42"
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
