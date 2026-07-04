import { useEffect, useMemo, useRef, useState } from "react";
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

  type BoardItem = { itemcode: string; imageUrl: string };
  type Board = { id: string; name: string; items: BoardItem[] };
  const [boards, setBoards] = useState<Board[]>(() => {
    try { return JSON.parse(localStorage.getItem("fedit-boards") || "[]"); } catch { return []; }
  });
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
    () => localStorage.getItem("fedit-recent-board"),
  );
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [toast, setToast] = useState<{ boardName: string; imageUrl: string } | null>(null);
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? boards[boards.length - 1] ?? null;
  const isSaved = !!(effectiveId && selectedBoard?.items.some((i) => i.itemcode === effectiveId));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boardDropdownRef.current && !boardDropdownRef.current.contains(e.target as Node)) {
        setBoardDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const persistBoards = (updated: Board[]) => {
    setBoards(updated);
    localStorage.setItem("fedit-boards", JSON.stringify(updated));
  };

  const handleSelectBoard = (id: string) => {
    setSelectedBoardId(id);
    localStorage.setItem("fedit-recent-board", id);
    setBoardDropdownOpen(false);
  };

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    const newBoard: Board = { id: Date.now().toString(), name: newBoardName.trim(), items: [] };
    const updated = [...boards, newBoard];
    persistBoards(updated);
    setSelectedBoardId(newBoard.id);
    localStorage.setItem("fedit-recent-board", newBoard.id);
    setNewBoardName("");
    setCreateBoardOpen(false);
  };

  const handleSave = () => {
    if (!effectiveId) return;
    if (!selectedBoard) { setCreateBoardOpen(true); return; }
    persistBoards(
      boards.map((b) =>
        b.id === selectedBoard.id && !b.items.some((i) => i.itemcode === effectiveId)
          ? { ...b, items: [...b.items, { itemcode: effectiveId, imageUrl: detailData?.thumbnail || detailData?.front_image_url || "" }] }
          : b,
      ),
    );
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({
      boardName: selectedBoard.name,
      imageUrl: detailData?.thumbnail || detailData?.front_image_url || "",
    });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const handleUndoSave = () => {
    if (!effectiveId || !selectedBoard) return;
    persistBoards(
      boards.map((b) =>
        b.id === selectedBoard.id
          ? { ...b, items: b.items.filter((item) => item.itemcode !== effectiveId) }
          : b,
      ),
    );
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

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
                  className="w-[400px] h-[530px] object-cover rounded-xl bg-fill-bg-strong"
                  alt="product"
                />

                <div className="absolute flex items-center justify-between top-4 left-4 right-4">
                  <button
                    onClick={() => onClose ? onClose() : setSelectedProductId(null)}
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

                {detailData.platform && (
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center justify-center w-5 h-5 text-white bg-tx-neutral rounded text-xs font-medium">
                      {getPlatformLabel(detailData.platform)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between ">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-tx-default">
                      {detailData.brand || "-"}
                    </span>
                    <div className="text-xs text-tx-assistive mb-4">
                      {mainCategory} {subCategory && ` / ${subCategory}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={boardDropdownRef}>
                      <div
                        className="flex items-center gap-1 cursor-pointer group"
                        onClick={() => setBoardDropdownOpen((prev) => !prev)}
                      >
                        <span className="text-tx-neutral text-sm font-semibold group-hover:text-tx-default transition-colors">
                          {selectedBoard?.name ?? "폴더명"}
                        </span>
                        <Icon
                          icon="mingcute:down-line"
                          className="w-5 h-5 text-tx-neutral group-hover:text-tx-default transition-colors"
                        />
                      </div>

                      {boardDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-line-divider z-50 overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {boards.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-tx-assistive">보드가 없습니다</div>
                            ) : (
                              boards.map((b) => (
                                <button
                                  key={b.id}
                                  onClick={() => handleSelectBoard(b.id)}
                                  className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-base transition-colors ${
                                    selectedBoard?.id === b.id ? "font-semibold text-tx-default" : "text-tx-neutral"
                                  }`}
                                >
                                  {b.name}
                                </button>
                              ))
                            )}
                          </div>
                          <div className="border-t border-line-divider">
                            <button
                              onClick={() => { setBoardDropdownOpen(false); setCreateBoardOpen(true); }}
                              className="w-full text-left px-4 py-3 text-sm text-tx-neutral hover:bg-surface-base transition-colors flex items-center gap-2"
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
                      className="flex items-center gap-1 px-3 py-2 bg-fill-primary text-white rounded-lg text-base font-semibold"
                    >
                      {isSaved ? "저장됨" : "저장하기"}
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl font-semibold text-tx-strong mb-5 break-all leading-tight">
                  {detailData.product_name}
                </h1>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {detailData.regular_price && (
                      <span className="text-sm font-semibold text-tx-assistive line-through">
                        {formatPrice(detailData.regular_price)}
                      </span>
                    )}
                    <span className="text-base font-bold text-tx-default">
                      {formatPrice(detailData.current_price)}
                    </span>
                  </div>

                  <div className="w-[1px] h-4 bg-line-alt" />

                  <div className="flex items-center gap-2">
                    <span className="bg-line-divider px-2 py-1 rounded text-[11px] font-bold text-tx-alt">
                      성별
                    </span>
                    <span className="text-xs font-medium text-tx-default">
                      {detailData.gender || "-"}
                    </span>
                  </div>

                  <div className="w-[1px] h-4 bg-line-alt" />

                  <div className="flex items-center gap-2">
                    <span className="bg-line-divider px-2 py-1 rounded text-[11px] font-bold text-tx-alt">
                      신상 업데이트
                    </span>
                    <span className="text-xs font-medium text-tx-default">
                      {releaseText}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 mb-6">
                  {detailData.views && (
                    <div className="px-3 py-1.5 bg-falling-bg text-[#3E7EFF] text-xs font-bold rounded-lg">
                      누적조회수{" "}
                      {Number(detailData.views).toLocaleString("ko-KR")}
                    </div>
                  )}
                  {detailData.sales != 1 && (
                    <div className="px-3 py-1.5 bg-data-orange-light text-status-warning text-xs font-bold rounded-lg">
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
            <div className="h-[1px] w-full bg-line-alt my-5" />
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-tx-alt">
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
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 bg-tx-neutral text-white px-4 py-3 rounded-2xl shadow-xl">
          {toast.imageUrl && (
            <img src={toast.imageUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
          )}
          <span className="text-sm font-semibold whitespace-nowrap">
            <span className="font-bold">{toast.boardName}</span>에 저장됨
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
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreateBoardOpen(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-[400px] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-tx-default">보드 만들기</h2>
              <button onClick={() => setCreateBoardOpen(false)}>
                <Icon icon="material-symbols:close" className="w-6 h-6 text-tx-assistive hover:text-black transition-colors" />
              </button>
            </div>
            <div className="border border-line-divider rounded-xl px-4 py-3 mb-6">
              <div className="text-xs text-tx-assistive mb-1">보드 이름</div>
              <input
                className="w-full text-sm font-semibold text-tx-default outline-none placeholder:font-normal placeholder:text-[#C4C6C8]"
                placeholder="보드 이름을 입력하세요"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
                autoFocus
              />
            </div>
            <button
              onClick={handleCreateBoard}
              disabled={!newBoardName.trim()}
              className={`w-full py-3 rounded-xl font-bold text-base transition-colors ${
                newBoardName.trim() ? "bg-fill-primary text-white hover:bg-black cursor-pointer" : "bg-surface-base text-tx-assistive cursor-not-allowed"
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
