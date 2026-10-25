import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  DeleteBoardItem,
  GetBoardItems,
  GetBoardList,
  PostAddBoardItem,
  PostCreateBoard,
  type BoardListItem,
} from "@/apis/BoardAPI";
import { trackFolderSave } from "@/lib/analytics";

// 상품 상세 헤더의 "내 보드에 저장" 버튼. 누르면 보드 목록이 펼쳐지고,
// 보드를 고르면 바로 그 보드에 저장한다(이미 저장된 보드는 체크 표시).
// 보드가 없거나 "보드 만들기"를 누르면 새 보드를 만든 뒤 저장한다.

interface Props {
  itemcode: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  className: string;
  iconClassName: string;
  // 저장된 상태의 버튼·아이콘 클래스(없으면 기본 클래스 그대로)
  activeClassName?: string;
  activeIconClassName?: string;
}

export default function SaveToBoardButton({
  itemcode,
  brand,
  category,
  imageUrl,
  className,
  iconClassName,
  activeClassName,
  activeIconClassName,
}: Props) {
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  // 이 상품이 들어 있는 보드 id
  const [savedIn, setSavedIn] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ boardId: number; boardName: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 보드 목록과, 각 보드에 이 상품이 이미 있는지 확인한다
  useEffect(() => {
    let canceled = false;
    GetBoardList()
      .then(async (list) => {
        if (canceled) return;
        setBoards(list);
        const results = await Promise.all(
          list.map((b) =>
            GetBoardItems(b.boardId)
              .then((items) => (items.some((i) => i.itemcode === itemcode) ? b.boardId : null))
              .catch(() => null),
          ),
        );
        if (!canceled) setSavedIn(new Set(results.filter((id): id is number => id != null)));
      })
      .catch(() => {});
    return () => {
      canceled = true;
    };
  }, [itemcode]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const saveTo = async (board: BoardListItem) => {
    setOpen(false);
    if (savedIn.has(board.boardId)) return;
    try {
      await PostAddBoardItem(board.boardId, itemcode);
      setSavedIn((prev) => new Set(prev).add(board.boardId));
      trackFolderSave(itemcode, brand ?? undefined, category ?? undefined);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ boardId: board.boardId, boardName: board.name });
      toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    } catch {
      alert("보드에 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const undoSave = async () => {
    if (!toast) return;
    const { boardId } = toast;
    setToast(null);
    try {
      await DeleteBoardItem(boardId, itemcode);
      setSavedIn((prev) => {
        const next = new Set(prev);
        next.delete(boardId);
        return next;
      });
    } catch {
      // 무시 — 저장은 그대로 남는다
    }
  };

  const createAndSave = async () => {
    const name = newName.trim();
    if (!name || isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await PostCreateBoard(name);
      const board: BoardListItem = {
        boardId: created.boardId,
        name,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        recentThumbnails: [],
      };
      setBoards((prev) => [...prev, board]);
      setNewName("");
      setCreateOpen(false);
      await saveTo(board);
    } catch (error: any) {
      setCreateError(error?.message ?? "보드를 만들지 못했어요.");
    } finally {
      setIsCreating(false);
    }
  };

  const isSaved = savedIn.size > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (boards.length === 0 ? setCreateOpen(true) : setOpen((v) => !v))}
        className={isSaved && activeClassName ? activeClassName : className}
      >
        {isSaved && activeIconClassName ? (
          <Icon icon="ph:check-bold" className={activeIconClassName} />
        ) : (
          <Icon icon={isSaved ? "ph:bookmark-simple-fill" : "ph:bookmark-simple"} className={iconClassName} />
        )}
        {isSaved ? "내 보드에 저장됨" : "내 보드에 저장"}
      </button>

      {open && (
        // 버튼 바로 아래, 버튼 가로 가운데에 맞춰 붙인다. 너비는 180px(버튼보다 조금
        // 넓게, 버튼이 더 넓으면 버튼 너비). 긴 보드 이름은 말줄임
        <div className="absolute left-1/2 -translate-x-1/2 z-50 mt-1 w-[180px] min-w-full overflow-hidden bg-white border rounded-lg shadow-lg top-full border-[#E4E4E4]">
          <div className="py-1 overflow-y-auto max-h-56">
            {boards.map((b) => {
              const saved = savedIn.has(b.boardId);
              return (
                <button
                  key={b.boardId}
                  type="button"
                  onClick={() => saveTo(b)}
                  title={b.name}
                  className="flex items-center justify-between w-full gap-1.5 px-2 py-1.5 text-[13px] font-medium leading-[1.38] text-left transition-colors text-[#3D3F41] hover:bg-surface-base"
                >
                  <span className="truncate">{b.name}</span>
                  {saved && <Icon icon="ph:check-bold" className="flex-shrink-0 w-3.5 h-3.5 text-[#3D3F41]" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-line-divider">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="flex items-center w-full gap-1.5 px-2 py-2 text-[13px] font-medium leading-[1.38] text-left transition-colors text-[#3D3F41] hover:bg-surface-base"
            >
              <Icon icon="ph:plus" className="flex-shrink-0 w-3.5 h-3.5" />
              보드 만들기
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 bg-tx-neutral text-white px-4 py-3 rounded-2xl shadow-xl">
          {imageUrl && <img src={imageUrl} className="flex-shrink-0 object-cover w-10 h-10 rounded-lg" alt="" />}
          <span className="text-sm font-semibold whitespace-nowrap">
            <span className="font-semibold">{toast.boardName}</span>에 저장됨
          </span>
          <button
            type="button"
            onClick={undoSave}
            className="bg-white text-tx-neutral text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            실행 취소
          </button>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setCreateOpen(false);
              setCreateError(null);
            }}
          />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-[400px] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-tx-default">보드 만들기</h2>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setCreateError(null);
                }}
              >
                <Icon icon="material-symbols:close" className="w-6 h-6 transition-colors text-tx-assistive hover:text-black" />
              </button>
            </div>
            <div className="px-4 py-3 mb-2 border border-line-divider rounded-xl">
              <div className="mb-1 text-xs text-tx-assistive">보드 이름</div>
              <input
                className="w-full text-sm font-semibold text-tx-default outline-none placeholder:font-normal placeholder:text-[#C4C6C8]"
                placeholder="보드 이름을 입력하세요"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && createAndSave()}
                autoFocus
              />
            </div>
            <p className="mb-4 text-xs text-status-error min-h-4">{createError}</p>
            <button
              type="button"
              onClick={createAndSave}
              disabled={!newName.trim() || isCreating}
              className={`w-full py-3 rounded-xl font-semibold text-base transition-colors ${
                newName.trim() && !isCreating
                  ? "bg-fill-primary text-white hover:bg-black cursor-pointer"
                  : "bg-surface-base text-tx-assistive cursor-not-allowed"
              }`}
            >
              만들고 저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
