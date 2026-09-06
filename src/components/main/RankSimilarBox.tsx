import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { GetTrendSimilar, GetTrendSnapshot } from "@/apis/DashBoardAPI";
import type { TrendSimilarItemDto } from "@/types/Main";
import { useProductStore } from "@/stores/ProductStore";

interface RankSimilarBoxProps {
  // /trend/{id}에 넣는 값과 동일(temp_item_id). null이면 아직 선택된 항목이 없다.
  tempItemId: number | null;
}

// 상세 화면엔 8~10개 권장.
const SIMILAR_LIMIT = 10;
// 한 페이지에 2열 x 3행.
const PAGE_SIZE = 6;

// 시안 스펙 — 이미지 박스 90x90, 라운드 8, 얇은 회색 테두리, cover.
// 썸네일이 없거나 깨지면 lightgray 배경만 남는다(스펙 그대로).
const thumbStyle = (thumbnail: string | null): React.CSSProperties => ({
  width: 90,
  height: 90,
  aspectRatio: "1 / 1",
  borderRadius: 8,
  border: "1px solid #F6F8FA",
  background: thumbnail
    ? `url(${thumbnail}) lightgray 50% / cover no-repeat`
    : "lightgray",
});

// "디테일 유사 아이템" 문구 스펙 — Title(sb)/small.
const headingStyle: React.CSSProperties = {
  color: "#3D3F41",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: "143%",
  letterSpacing: "-0.07px",
};

export default function RankSimilarBox({ tempItemId }: RankSimilarBoxProps) {
  const { setModalProductId, setModalTrendSnapshot } = useProductStore((s) => s);
  const [items, setItems] = useState<TrendSimilarItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  // RANKING 카드는 클릭 시 스냅샷을 한 번 더 받아와야 해서, 그 사이 중복
  // 클릭을 막는다.
  const [navigatingId, setNavigatingId] = useState<number | null>(null);

  // 트렌드 지수 고도화 — 유사 상품은 상세(/trend/{id})와 분리해서 지연 호출한다.
  // 임베딩 검색 왕복이 있어 상세보다 느릴 수 있으니 스켈레톤을 먼저 띄운다.
  useEffect(() => {
    setPage(0);
    if (tempItemId == null) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    let canceled = false;
    setIsLoading(true);
    GetTrendSimilar(tempItemId, SIMILAR_LIMIT)
      .then((res) => {
        if (!canceled) setItems(res ?? []);
      })
      .catch(() => {
        // 404(TREND_SNAPSHOT_NOT_FOUND) 포함 실패 시엔 섹션을 숨긴다.
        if (!canceled) setItems([]);
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [tempItemId]);

  // source === "RANKING" → /trend/{trend_id} 스냅샷 모달,
  // 그 외("PRODUCT")   → /product/{item_code} 상세 모달.
  const handleClick = async (item: TrendSimilarItemDto) => {
    if (item.source === "RANKING") {
      if (item.trend_id == null || navigatingId != null) return;
      setNavigatingId(item.trend_id);
      try {
        const snapshot = await GetTrendSnapshot(item.trend_id);
        if (snapshot) setModalTrendSnapshot(snapshot);
      } catch {
        // 무시 — 모달을 열지 않는다.
      } finally {
        setNavigatingId(null);
      }
    } else if (item.item_code) {
      setModalProductId(item.item_code);
    }
  };

  // 빈 배열 = 이 랭킹 상품이 아직 VLM 분석 전 → 섹션 자체를 숨긴다.
  if (!isLoading && items.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="mb-4">
      <div className="w-full h-px my-5 bg-line-alt" />

      <div className="flex items-center gap-1.5 mb-4" style={headingStyle}>
        <Icon icon="ph:scan" className="w-4 h-4" />
        디테일 유사 아이템
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {isLoading
          ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 animate-pulse"
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 8,
                    background: "#F1F3F5",
                  }}
                />
                <div className="flex flex-col flex-1 gap-2 pt-1">
                  <div className="w-2/5 h-3 rounded bg-fill-bg-strong animate-pulse" />
                  <div className="h-3.5 w-4/5 rounded bg-fill-bg-strong animate-pulse" />
                </div>
              </div>
            ))
          : pageItems.map((item, idx) => {
              const isNavigating =
                item.source === "RANKING" && navigatingId === item.trend_id;
              return (
                <button
                  key={
                    item.source === "RANKING"
                      ? `r-${item.trend_id ?? idx}`
                      : `p-${item.item_code ?? idx}`
                  }
                  type="button"
                  onClick={() => handleClick(item)}
                  className={`flex items-start gap-4 text-left transition-opacity ${
                    isNavigating ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <div
                    className="flex-shrink-0"
                    style={thumbStyle(item.thumbnail)}
                  />
                  <div className="flex flex-col gap-1 pt-0.5 overflow-hidden">
                    <span className="overflow-hidden text-[13px] font-medium leading-[133%] text-tx-assistive text-ellipsis truncate">
                      {item.brand}
                    </span>
                    <span className="overflow-hidden text-[14px] font-semibold leading-[143%] tracking-[-0.07px] text-[#3D3F41] text-ellipsis line-clamp-2">
                      {item.product_name}
                    </span>
                  </div>
                </button>
              );
            })}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center justify-center transition-colors border rounded-full w-9 h-9 border-line-alt text-tx-neutral hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Icon icon="ph:caret-left" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center justify-center transition-colors border rounded-full w-9 h-9 border-line-alt text-tx-neutral hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Icon icon="ph:caret-right" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
