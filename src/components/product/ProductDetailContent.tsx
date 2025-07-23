import { useEffect, useState } from "react";
import dayjs from "dayjs";
import DetailSection from "./DetailSection";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useProductStore } from "@/stores/ProductStore";
import mockData from "@/data/mock/mockup_v3.json";

type ProductItem = (typeof mockData)[number];

function ProductDetailContent() {
  const { setSelectedProductId, selectedProductId } = useProductStore(
    (state) => state
  );
  const [detailData, setDetailData] = useState<ProductItem | null>(null);
  useEffect(() => {
    if (!selectedProductId) return;

    const found = mockData.find((item) => item.itemcode === selectedProductId);
    setDetailData(found ?? null);
    console.log("📦 상품 상세 정보:", found);
  }, [selectedProductId]);

  return (
    <div className="relative pt-3 pl-13">
      <div className="absolute cursor-pointer top-3 right-3">
        <Icon
          icon="fontisto:close-a"
          onClick={() => setSelectedProductId(null)}
        />
      </div>
      <span className="text-3xl font-semibold">{detailData?.product_name}</span>
      <section className="flex mt-7 gap-25">
        <div className="flex flex-col gap-4">
          <img
            src={detailData?.image_url}
            alt={"product_name"}
            className="h-97 w-78"
          />
          <DetailSection
            title="상품 상세 페이지"
            content={detailData?.product_detail_url}
          />
          <DetailSection
            title="신상 업데이트 일자"
            content={
              detailData?.release_date
                ? dayjs(`20${detailData.release_date}`, "YYYYMMDD").format(
                    "YYYY.MM.DD"
                  )
                : undefined
            }
          />
          <DetailSection
            title="마지막 확인된 일자"
            content={
              detailData?.stop_selling_date &&
              detailData.stop_selling_date !== "NONE" &&
              /^\d{6}$/.test(detailData.stop_selling_date)
                ? dayjs(detailData.stop_selling_date, "YYMMDD").format(
                    "YYYY.MM.DD"
                  )
                : dayjs().format("YYYY.MM.DD")
            }
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <span className="text-[#FF4242] text-2xl font-semibold">
              ₩{detailData?.current_price}
            </span>
            <div className="flex items-center gap-2">
              {detailData?.regular_price && (
                <span className="text-[#91929D] text-md line-through">
                  ₩{detailData?.regular_price}
                </span>
              )}
              {detailData?.discount_rate && (
                <span className="h-7 w-14 bg-[#FF4242] text-white flex items-center justify-center rounded-md">
                  {detailData?.discount_rate}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col ">
            {detailData?.rating && (
              <div className="flex items-center gap-1 ">
                <Icon icon="tabler:star-filled" />
                {detailData?.rating}
              </div>
            )}
            {detailData?.reviews && (
              <span className="text-[#787A80]">
                {detailData?.reviews}개의 리뷰
              </span>
            )}
          </div>
          <DetailSection title="성별" content={detailData?.gender} />
          <DetailSection title="유형" content={detailData?.category} />
          <DetailSection title="소재" content={detailData?.material} />
          <DetailSection
            title="색상"
            content={detailData?.color_text?.replace(/[[\]']+/g, "").trim()}
          />
          <DetailSection title="디테일" content={detailData?.details} />
        </div>
      </section>
    </div>
  );
}

export default ProductDetailContent;
