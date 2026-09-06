import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useProductStore } from "@/stores/ProductStore";
import {
  GetDetailInfo,
  GetProductByItemCode,
  GetRelatedItemInfo,
} from "@/apis/AnalysisAPI";
import {
  GetTrendIndex,
  GetTrendSimilar,
  GetTrendSnapshot,
} from "@/apis/DashBoardAPI";
import {
  PostCreateBoard,
  PostAddBoardItem,
  DeleteBoardItem,
  GetBoardList,
  GetBoardItems,
  type BoardListItem,
} from "@/apis/BoardAPI";
import type { ApiDetail } from "@/types/Product";
import type {
  TrendSnapshotDetailDto,
  TrendSimilarItemDto,
} from "@/types/Main";
import DetailItem from "./DetailItem";
import defaultImg from "@/assets/logo/defaultImg.svg";
import AIAnalysisBox from "./AIAnalysisBox";
import TrendIndexBoxMock from "./TrendIndexBoxMock";
import { formatSalesCount } from "@/lib/utils";

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
  // 랭킹 목록처럼 itemcode 없이 temp_item_id로만 조회한 상품 — 이미 받아온
  // /trend 스냅샷을 그대로 넣어 보여준다. itemcode가 없어 보드 저장·유사
  // 상품 조회는 할 수 없으니 그 UI는 숨긴다.
  previewSnapshot?: TrendSnapshotDetailDto;
};

// /trend 스냅샷을 상세 모달이 쓰는 ApiDetail 모양으로 변환한다. 가격·평점·
// 판매 지표는 별도 블록이 아니라 vlm 안에 같이 들어있다(VLM 미분석이면
// vlm 자체가 null이라 다 같이 비어있다). current_price가 없으면(세일 중이
// 아니면) regular_price를 대신 넣어서 기존 가격 표시 로직이 그대로 동작하게 한다.
function mapSnapshotToApiDetail(snapshot: TrendSnapshotDetailDto): ApiDetail {
  const vlm = snapshot.vlm;
  return {
    itemcode: snapshot.itemcode ?? "",
    product_name: snapshot.product_name,
    gender: vlm?.gender ?? null,
    brand: snapshot.brand,
    categories: snapshot.category ? [{ category: snapshot.category }] : [],
    thumbnail: snapshot.thumbnail,
    front_image_url: null,
    current_price:
      vlm?.current_price != null
        ? String(vlm.current_price)
        : vlm?.regular_price != null
          ? String(vlm.regular_price)
          : null,
    regular_price: vlm?.regular_price != null ? String(vlm.regular_price) : null,
    discount_rate: vlm?.discount_rate ?? null,
    reviews: vlm?.review_count ?? null,
    rating: vlm?.rating ?? null,
    vlm: {
      length: vlm?.length ?? "",
      material: vlm?.material ?? "",
      neckline: vlm?.neckline ?? "",
      sleeve: vlm?.sleeve ?? "",
      fit: vlm?.fit ?? "",
      pattern: vlm?.pattern ?? "",
      detail: vlm?.detail_category ? [vlm.detail_category] : [],
      color: vlm?.color ? [vlm.color] : [],
    },
    release_date: null,
    ai_description: vlm?.ai_description ?? null,
    product_detail_url: snapshot.product_detail_url,
    views: vlm?.views ?? null,
    sales: vlm?.sales ?? null,
    platform: snapshot.platform,
  };
}

export default function ProductDetailContent({
  product,
  itemcodeOverride,
  onClose,
  onItemClick,
  previewSnapshot,
}: Props = {}) {
  const {
    setSelectedProductId,
    selectedProductId,
    setModalProductId,
    setModalTrendSnapshot,
  } = useProductStore((s) => s);
  const effectiveId = itemcodeOverride ?? selectedProductId;
  const [detailData, setDetailData] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  // 랭킹 상품(previewSnapshot) 상세일 때만 /trend/{id}/similar로 채운다.
  const [trendSimilar, setTrendSimilar] = useState<TrendSimilarItemDto[]>([]);
  const [trendSnapshot, setTrendSnapshot] =
    useState<TrendSnapshotDetailDto | null>(null);
  const [isTrendLoading, setIsTrendLoading] = useState(false);

  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [savedItemcodes, setSavedItemcodes] = useState<Set<string>>(new Set());
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [createBoardError, setCreateBoardError] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [toast, setToast] = useState<{
    boardName: string;
    imageUrl: string;
  } | null>(null);
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relatedScrollRef = useRef<HTMLDivElement>(null);
  const [relatedHovering, setRelatedHovering] = useState(false);
  const [relatedShowLeft, setRelatedShowLeft] = useState(false);
  const [relatedShowRight, setRelatedShowRight] = useState(false);
  const [relatedHoverSide, setRelatedHoverSide] = useState<
    "left" | "right" | null
  >(null);

  const selectedBoard =
    boards.find((b) => b.boardId === selectedBoardId) ?? null;
  const isSaved = !!(effectiveId && savedItemcodes.has(effectiveId));

  useEffect(() => {
    GetBoardList()
      .then((list) => {
        setBoards(list);
        setSelectedBoardId((prev) => prev ?? list[0]?.boardId ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBoardId) {
      setSavedItemcodes(new Set());
      return;
    }
    let canceled = false;
    GetBoardItems(selectedBoardId)
      .then((items) => {
        if (!canceled) setSavedItemcodes(new Set(items.map((i) => i.itemcode)));
      })
      .catch(() => {
        if (!canceled) setSavedItemcodes(new Set());
      });
    return () => {
      canceled = true;
    };
  }, [selectedBoardId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        boardDropdownRef.current &&
        !boardDropdownRef.current.contains(e.target as Node)
      ) {
        setBoardDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBoard = (boardId: number) => {
    setSelectedBoardId(boardId);
    setBoardDropdownOpen(false);
  };

  const closeCreateBoard = () => {
    setCreateBoardOpen(false);
    setCreateBoardError(null);
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || isCreatingBoard) return;
    setIsCreatingBoard(true);
    setCreateBoardError(null);
    try {
      const trimmedName = newBoardName.trim();
      const created = await PostCreateBoard(trimmedName);
      const newBoard: BoardListItem = {
        boardId: created.boardId,
        name: trimmedName,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        recentThumbnails: [],
      };
      setBoards((prev) => [...prev, newBoard]);
      setSelectedBoardId(newBoard.boardId);
      setNewBoardName("");
      setCreateBoardOpen(false);
    } catch (error: any) {
      setCreateBoardError(error.message);
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleSave = async () => {
    if (!effectiveId) return;
    if (!selectedBoard) {
      setCreateBoardOpen(true);
      return;
    }
    if (isSaved) return;
    try {
      await PostAddBoardItem(selectedBoard.boardId, effectiveId);
      setSavedItemcodes((prev) => new Set(prev).add(effectiveId));
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({
        boardName: selectedBoard.name,
        imageUrl: detailData?.thumbnail || detailData?.front_image_url || "",
      });
      toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    } catch {
      // 무시
    }
  };

  const updateRelatedScrollButtons = () => {
    const el = relatedScrollRef.current;
    if (!el) return;
    setRelatedShowLeft(el.scrollLeft > 0);
    setRelatedShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scrollRelatedLeft = () => {
    relatedScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
    setTimeout(updateRelatedScrollButtons, 250);
  };

  const scrollRelatedRight = () => {
    relatedScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
    setTimeout(updateRelatedScrollButtons, 250);
  };

  const onRelatedMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const half = rect.width / 2;
    setRelatedHoverSide(e.clientX - rect.left < half ? "left" : "right");
  };

  useEffect(() => {
    updateRelatedScrollButtons();
  }, [related, trendSimilar]);

  // 랭킹 유사 상품 카드 클릭 — source에 따라 다른 상세로 갈아끼운다.
  // RANKING → /trend/{trend_id} 스냅샷 모달, PRODUCT → /product/{item_code} 모달.
  const handleTrendSimilarClick = async (item: TrendSimilarItemDto) => {
    if (item.source === "RANKING") {
      if (item.trend_id == null) return;
      try {
        const snapshot = await GetTrendSnapshot(item.trend_id);
        if (snapshot) setModalTrendSnapshot(snapshot);
      } catch {
        // 무시 — 모달을 열지 않는다.
      }
    } else if (item.item_code) {
      setModalTrendSnapshot(null);
      setModalProductId(item.item_code);
    }
  };

  const handleUndoSave = async () => {
    if (!effectiveId || !selectedBoard) return;
    try {
      await DeleteBoardItem(selectedBoard.boardId, effectiveId);
      setSavedItemcodes((prev) => {
        const next = new Set(prev);
        next.delete(effectiveId);
        return next;
      });
    } catch {
      // 무시
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  useEffect(() => {
    if (previewSnapshot) {
      setDetailData(mapSnapshotToApiDetail(previewSnapshot));
      return;
    }
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
  }, [effectiveId, product, itemcodeOverride, previewSnapshot]);

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

  // 랭킹 상품 상세(previewSnapshot)는 /trend/{id}/similar로 유사 상품을 받는다.
  // 상세와 분리해서 지연 호출 — 임베딩 검색 왕복이 있어 느릴 수 있다. 빈
  // 배열([])이면 아직 VLM 분석 전이라 섹션 자체를 숨긴다.
  useEffect(() => {
    if (!previewSnapshot) {
      setTrendSimilar([]);
      return;
    }
    let canceled = false;
    GetTrendSimilar(previewSnapshot.temp_item_id, 10)
      .then((res) => {
        if (!canceled) setTrendSimilar(res ?? []);
      })
      .catch(() => {
        if (!canceled) setTrendSimilar([]);
      });
    return () => {
      canceled = true;
    };
  }, [previewSnapshot]);

  useEffect(() => {
    if (previewSnapshot) {
      setTrendSnapshot(previewSnapshot);
      return;
    }
    if (!effectiveId) {
      setTrendSnapshot(null);
      return;
    }
    let canceled = false;
    setIsTrendLoading(true);
    GetTrendIndex(effectiveId)
      .then((res) => {
        if (!canceled) setTrendSnapshot(res);
      })
      .catch(() => {
        if (!canceled) setTrendSnapshot(null);
      })
      .finally(() => {
        if (!canceled) setIsTrendLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [effectiveId, previewSnapshot]);

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

  // "유사한 스타일 아이템" 섹션은 정식 상품(itemcode)이든 랭킹 상품
  // (previewSnapshot)이든 이미지만 나열하는 동일한 UI를 쓴다. 데이터 소스와
  // 클릭 동작만 갈린다.
  const similarItems = previewSnapshot
    ? trendSimilar.map((item, idx) => ({
        key:
          item.source === "RANKING"
            ? `r-${item.trend_id ?? idx}`
            : `p-${item.item_code ?? idx}`,
        image: item.thumbnail || defaultImg,
        onClick: () => handleTrendSimilarClick(item),
      }))
    : related.map((r, idx) => ({
        key: r.itemcode || String(idx),
        image: r.product_image_url || defaultImg,
        onClick: () =>
          r.itemcode &&
          (onItemClick
            ? onItemClick(r.itemcode)
            : setSelectedProductId(r.itemcode)),
      }));
  // 랭킹 상품은 유사 상품이 비면(아직 VLM 분석 전) 섹션을 숨기고, 정식
  // 상품은 기존처럼 섹션 자체는 항상 노출한다.
  const showSimilarSection = previewSnapshot
    ? similarItems.length > 0
    : true;

  // const getPlatformLabel = (platform: string) => {
  //   const p = platform.toLowerCase();
  //   if (p.includes("무신사")) return "무";
  //   if (p.includes("wconcept") || p.includes("w컨셉")) return "W";
  //   if (p.includes("29cm")) return "29";
  //   return p;
  // };

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
              <div className="relative flex-shrink-0 w-[400px] h-[530px] rounded-xl bg-fill-bg-strong">
                <img
                  src={
                    detailData.thumbnail ||
                    detailData.front_image_url ||
                    defaultImg
                  }
                  onError={(e) => {
                    // 썸네일 URL이 깨지면 이미지가 찌그러져 오버레이 버튼이
                    // 밖으로 튀어나온다 — 기본 이미지로 교체(무한 루프 방지).
                    const img = e.currentTarget;
                    if (img.dataset.fallback) return;
                    img.dataset.fallback = "true";
                    img.src = defaultImg;
                  }}
                  className="w-full h-full object-cover rounded-xl"
                  alt="product"
                />

                <div className="absolute flex items-center justify-between top-4 left-4 right-4">
                  <button
                    onClick={() =>
                      onClose ? onClose() : setSelectedProductId(null)
                    }
                    className="flex items-center justify-center w-8 h-8 transition-colors bg-white rounded-lg shadow-md hover:bg-gray-50"
                  >
                    <Icon
                      icon="lucide:arrow-left"
                      className="w-4 h-4 text-tx-default"
                    />
                  </button>

                  {detailData.product_detail_url && (
                    <a
                      href={detailData.product_detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-[2px] bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-xs font-medium text-tx-alt hover:bg-white transition-colors"
                    >
                      상세페이지
                      <Icon icon="lucide:external-link" className="w-2 h-2" />
                    </a>
                  )}
                </div>

                {/* {detailData.platform && (
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center justify-center w-5 h-5 text-xs font-medium text-white rounded bg-tx-neutral">
                      {getPlatformLabel(detailData.platform)}
                    </div>
                  </div>
                )} */}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between ">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-tx-default">
                      {detailData.brand || "-"}
                    </span>
                    <div className="mb-4 text-xs text-tx-assistive">
                      {mainCategory} {subCategory && ` / ${subCategory}`}
                    </div>
                  </div>
                  {!previewSnapshot && (
                    <div className="flex items-center gap-2">
                      <div className="relative" ref={boardDropdownRef}>
                        <div
                          className="flex items-center gap-1 cursor-pointer group"
                          onClick={() => setBoardDropdownOpen((prev) => !prev)}
                        >
                          <span className="text-sm font-semibold transition-colors text-tx-neutral group-hover:text-tx-default">
                            {selectedBoard?.name ?? "폴더명"}
                          </span>
                          <Icon
                            icon="mingcute:down-line"
                            className="w-5 h-5 transition-colors text-tx-neutral group-hover:text-tx-default"
                          />
                        </div>

                        {boardDropdownOpen && (
                          <div className="absolute right-0 z-50 w-48 mt-2 overflow-hidden bg-white border shadow-lg top-full rounded-xl border-line-divider">
                            <div className="overflow-y-auto max-h-48">
                              {boards.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-tx-assistive">
                                  보드가 없습니다
                                </div>
                              ) : (
                                boards.map((b) => (
                                  <button
                                    key={b.boardId}
                                    onClick={() => handleSelectBoard(b.boardId)}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-base transition-colors ${
                                      selectedBoard?.boardId === b.boardId
                                        ? "font-semibold text-tx-default"
                                        : "text-tx-neutral"
                                    }`}
                                  >
                                    {b.name}
                                  </button>
                                ))
                              )}
                            </div>
                            <div className="border-t border-line-divider">
                              <button
                                onClick={() => {
                                  setBoardDropdownOpen(false);
                                  setCreateBoardOpen(true);
                                }}
                                className="flex items-center w-full gap-2 px-4 py-3 text-sm text-left transition-colors text-tx-neutral hover:bg-surface-base"
                              >
                                <Icon icon="ph:plus" className="w-4 h-4" />
                                보드 만들기
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1 px-3 py-2 text-base font-semibold text-white rounded-lg bg-fill-primary"
                      >
                        {isSaved ? "저장됨" : "저장하기"}
                      </button>
                    </div>
                  )}
                </div>

                <h1 className="mb-5 text-2xl font-semibold leading-tight break-all text-tx-strong">
                  {detailData.product_name}
                </h1>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {detailData.regular_price &&
                      formatPrice(detailData.regular_price) !==
                        formatPrice(detailData.current_price) && (
                        <span className="text-sm font-semibold line-through text-tx-assistive">
                          {formatPrice(detailData.regular_price)}
                        </span>
                      )}
                    <span className="text-base font-semibold text-tx-default">
                      {formatPrice(detailData.current_price)}
                    </span>
                  </div>

                  <div className="w-[1px] h-4 bg-line-alt" />

                  <div className="flex items-center gap-2">
                    <span className="bg-line-divider px-2 py-1 rounded text-[11px] font-semibold text-tx-alt">
                      성별
                    </span>
                    <span className="text-xs font-medium text-tx-default">
                      {detailData.gender || "-"}
                    </span>
                  </div>

                  <div className="w-[1px] h-4 bg-line-alt" />

                  <div className="flex items-center gap-2">
                    <span className="bg-line-divider px-2 py-1 rounded text-[11px] font-semibold text-tx-alt">
                      신상 업데이트
                    </span>
                    <span className="text-xs font-medium text-tx-default">
                      {releaseText}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 mb-6">
                  {detailData.views && (
                    <div className="px-3 py-1.5 bg-falling-bg text-[#3E7EFF] text-xs font-semibold rounded-lg">
                      누적조회수{" "}
                      {Number(detailData.views).toLocaleString("ko-KR")}
                    </div>
                  )}
                  {detailData.sales != null && (
                    <div className="px-3 py-1.5 bg-data-orange-light text-status-warning text-xs font-semibold rounded-lg">
                      누적판매 {formatSalesCount(detailData.sales!)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {hasValue(detailData.vlm?.color) && (
                    <DetailItem
                      title="색상"
                      content={detailData.vlm!.color}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                  {hasValue(detailData.vlm?.material) && (
                    <DetailItem
                      title="소재"
                      content={detailData.vlm!.material}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                  {hasValue(detailData.vlm?.length) && (
                    <DetailItem
                      title="기장"
                      content={detailData.vlm!.length}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                  {hasValue(detailData.vlm?.sleeve) && (
                    <DetailItem
                      title="소매 길이"
                      content={detailData.vlm!.sleeve}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                  {hasValue(detailData.vlm?.neckline) && (
                    <DetailItem
                      title="넥라인"
                      content={detailData.vlm!.neckline}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                  {hasValue(detailData.vlm?.fit) && (
                    <DetailItem
                      title="핏"
                      content={detailData.vlm!.fit}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                  {hasValue(detailData.vlm?.detail) && (
                    <DetailItem
                      title="디테일"
                      content={detailData.vlm!.detail}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                  {hasValue(detailData.vlm?.pattern) && (
                    <DetailItem
                      title="패턴"
                      content={detailData.vlm!.pattern}
                      itemcode={effectiveId ?? ""}
                    />
                  )}
                </div>
              </div>
            </section>

            <AIAnalysisBox
              content={detailData.ai_description || ""}
              itemcode={effectiveId ?? ""}
              isRanking={false}
            />
            <TrendIndexBoxMock
              data={trendSnapshot}
              isLoading={isTrendLoading}
            />
            {showSimilarSection && (
              <>
                <div className="h-[1px] w-full bg-line-alt my-5" />
                <div className="flex flex-col gap-3">
                  <span className="font-semibold text-tx-alt">
                    유사한 스타일 아이템
                  </span>
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setRelatedHovering(true);
                      updateRelatedScrollButtons();
                    }}
                    onMouseLeave={() => {
                      setRelatedHovering(false);
                      setRelatedHoverSide(null);
                    }}
                    onMouseMove={onRelatedMouseMove}
                  >
                    <div
                      ref={relatedScrollRef}
                      onScroll={updateRelatedScrollButtons}
                      className="flex gap-3 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {similarItems.map((s, idx) => (
                        <button
                          key={s.key}
                          type="button"
                          className="flex-shrink-0"
                          onClick={s.onClick}
                        >
                          <img
                            src={s.image}
                            alt={`related-${idx}`}
                            className="object-cover rounded-lg w-42 h-42"
                          />
                        </button>
                      ))}
                    </div>

                    {relatedHovering &&
                      relatedHoverSide === "left" &&
                      relatedShowLeft && (
                        <button
                          onClick={scrollRelatedLeft}
                          className="absolute left-0 top-1/2 -translate-y-1/2 px-2 py-2 rounded-lg bg-white shadow-[0_4px_8px_rgba(0,0,0,0.10)] border border-line-alt z-10"
                        >
                          <Icon
                            icon="grommet-icons:form-previous"
                            className="w-5 h-5 text-tx-neutral"
                          />
                        </button>
                      )}

                    {relatedHovering &&
                      relatedHoverSide === "right" &&
                      relatedShowRight && (
                        <button
                          onClick={scrollRelatedRight}
                          className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-2 rounded-lg bg-white shadow-[0_4px_8px_rgba(0,0,0,0.10)] border border-line-alt z-10"
                        >
                          <Icon
                            icon="grommet-icons:form-next"
                            className="w-5 h-5 text-tx-neutral"
                          />
                        </button>
                      )}
                  </div>
                </div>
              </>
            )}
          </>
        )
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 bg-tx-neutral text-white px-4 py-3 rounded-2xl shadow-xl">
          {toast.imageUrl && (
            <img
              src={toast.imageUrl}
              className="flex-shrink-0 object-cover w-10 h-10 rounded-lg"
              alt=""
            />
          )}
          <span className="text-sm font-semibold whitespace-nowrap">
            <span className="font-semibold">{toast.boardName}</span>에 저장됨
          </span>
          <button
            onClick={handleUndoSave}
            className="bg-white text-tx-neutral text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            실행 취소
          </button>
        </div>
      )}

      {createBoardOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeCreateBoard}
          />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-[400px] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-tx-default">
                보드 만들기
              </h2>
              <button onClick={closeCreateBoard}>
                <Icon
                  icon="material-symbols:close"
                  className="w-6 h-6 transition-colors text-tx-assistive hover:text-black"
                />
              </button>
            </div>
            <div className="px-4 py-3 mb-2 border border-line-divider rounded-xl">
              <div className="mb-1 text-xs text-tx-assistive">보드 이름</div>
              <input
                className="w-full text-sm font-semibold text-tx-default outline-none placeholder:font-normal placeholder:text-[#C4C6C8]"
                placeholder="보드 이름을 입력하세요"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
                autoFocus
              />
            </div>
            <p className="mb-4 text-xs text-status-error min-h-4">
              {createBoardError}
            </p>
            <button
              onClick={handleCreateBoard}
              disabled={!newBoardName.trim() || isCreatingBoard}
              className={`w-full py-3 rounded-xl font-semibold text-base transition-colors ${
                newBoardName.trim() && !isCreatingBoard
                  ? "bg-fill-primary text-white hover:bg-black cursor-pointer"
                  : "bg-surface-base text-tx-assistive cursor-not-allowed"
              }`}
            >
              만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
