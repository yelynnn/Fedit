import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useProductStore } from "@/stores/ProductStore";
import ProductDetailModal from "@/components/product/ProductDetailModal";
import {
  DeleteBoard,
  DeleteBoardItem,
  GetBoardItems,
  GetBoardList,
  PatchBoardName,
  type BoardItemThumbnail,
  type BoardListItem,
} from "@/apis/BoardAPI";

function BoardThumbnail({ board }: { board: BoardListItem }) {
  return (
    <div className="grid grid-cols-2 w-full aspect-square rounded-xl overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-line-divider">
          {board.recentThumbnails[i] && (
            <img src={board.recentThumbnails[i]} className="w-full h-full object-cover" alt="" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [boardItems, setBoardItems] = useState<BoardItemThumbnail[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [editBoard, setEditBoard] = useState<BoardListItem | null>(null);
  const [editName, setEditName] = useState("");
  const { setModalProductId } = useProductStore((s) => s);

  const selectedBoard = boards.find((b) => b.boardId === selectedBoardId) ?? null;

  const loadBoards = () => {
    GetBoardList()
      .then(setBoards)
      .catch(console.error);
  };

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (!selectedBoardId) {
      setBoardItems([]);
      return;
    }
    let canceled = false;
    setItemsLoading(true);
    GetBoardItems(selectedBoardId)
      .then((items) => {
        if (!canceled) setBoardItems(items);
      })
      .catch(() => {
        if (!canceled) setBoardItems([]);
      })
      .finally(() => {
        if (!canceled) setItemsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [selectedBoardId]);

  const handleEditSave = async () => {
    if (!editBoard || !editName.trim()) return;
    const trimmedName = editName.trim();
    try {
      await PatchBoardName(editBoard.boardId, trimmedName);
      setBoards((prev) =>
        prev.map((b) => (b.boardId === editBoard.boardId ? { ...b, name: trimmedName } : b)),
      );
      setEditBoard(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBoard = async () => {
    if (!editBoard) return;
    try {
      await DeleteBoard(editBoard.boardId, editBoard.name);
      setBoards((prev) => prev.filter((b) => b.boardId !== editBoard.boardId));
      if (selectedBoardId === editBoard.boardId) setSelectedBoardId(null);
      setEditBoard(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveItem = async (itemcode: string) => {
    if (!selectedBoardId) return;
    try {
      await DeleteBoardItem(selectedBoardId, itemcode);
      setBoardItems((prev) => prev.filter((item) => item.itemcode !== itemcode));
      setBoards((prev) =>
        prev.map((b) =>
          b.boardId === selectedBoardId ? { ...b, itemCount: Math.max(0, b.itemCount - 1) } : b,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="px-12 py-8 min-h-full">
      {selectedBoard ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedBoardId(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5 text-tx-default" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-tx-strong">{selectedBoard.name}</h1>
              <p className="text-sm text-tx-assistive">상품 {boardItems.length}개</p>
            </div>
          </div>

          {itemsLoading ? (
            <div className="flex items-center justify-center py-24 text-tx-assistive">
              불러오는 중...
            </div>
          ) : boardItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-tx-assistive">
              <Icon icon="ph:bookmark" className="w-12 h-12 mb-3" />
              <p className="text-base font-medium">저장된 상품이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {boardItems.map((item) => (
                <div
                  key={item.itemcode}
                  className="group relative rounded-xl overflow-hidden bg-surface-base aspect-[3/4]"
                >
                  <button
                    onClick={() => setModalProductId(item.itemcode)}
                    className="block w-full h-full"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        className="w-full h-full object-cover group-hover:brightness-90 transition-all"
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full bg-line-divider" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.itemcode);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <Icon icon="material-symbols:close" className="w-4 h-4 text-tx-neutral" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold text-tx-strong mb-6">내 보드</h1>

          {boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-tx-assistive">
              <Icon icon="ph:folder" className="w-12 h-12 mb-3" />
              <p className="text-base font-medium">저장된 보드가 없습니다</p>
              <p className="text-sm mt-1">상품을 저장하면 보드가 생성됩니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {boards.map((board) => (
                <div
                  key={board.boardId}
                  className="group relative cursor-pointer"
                  onClick={() => setSelectedBoardId(board.boardId)}
                >
                  <div className="relative">
                    <BoardThumbnail board={board} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditBoard(board);
                        setEditName(board.name);
                      }}
                      className="absolute bottom-3 right-3 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                    >
                      <Icon icon="lucide:pencil" className="w-4 h-4 text-tx-neutral" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-tx-strong">{board.name}</p>
                    <p className="text-sm text-tx-assistive">상품 {board.itemCount}개</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editBoard && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditBoard(null)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-[400px] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-tx-default">보드 수정</h2>
              <button onClick={() => setEditBoard(null)}>
                <Icon icon="material-symbols:close" className="w-6 h-6 text-tx-assistive hover:text-black transition-colors" />
              </button>
            </div>
            <div className="border border-line-divider rounded-xl px-4 py-3 mb-4">
              <div className="text-xs text-tx-assistive mb-1">보드 이름</div>
              <input
                className="w-full text-sm font-semibold text-tx-default outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                autoFocus
              />
            </div>
            <button
              onClick={handleEditSave}
              disabled={!editName.trim()}
              className={`w-full py-3 rounded-xl font-semibold text-base transition-colors mb-3 ${
                editName.trim() ? "bg-fill-primary text-white hover:bg-black cursor-pointer" : "bg-surface-base text-tx-assistive cursor-not-allowed"
              }`}
            >
              저장
            </button>
            <button
              onClick={handleDeleteBoard}
              className="w-full py-3 rounded-xl font-semibold text-base text-status-error border border-[#FEE4E2] hover:bg-rising-bg transition-colors"
            >
              보드 삭제
            </button>
          </div>
        </div>
      )}

      <ProductDetailModal />
    </div>
  );
}
