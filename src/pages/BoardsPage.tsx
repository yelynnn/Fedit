import { useState } from "react";
import { Icon } from "@iconify/react";
import { useProductStore } from "@/stores/ProductStore";
import ProductDetailModal from "@/components/product/ProductDetailModal";

type BoardItem = { itemcode: string; imageUrl: string };
type Board = { id: string; name: string; items: BoardItem[] };

function BoardThumbnail({ board }: { board: Board }) {
  return (
    <div className="grid grid-cols-2 w-full aspect-square rounded-xl overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-[#ECEEF0]">
          {board.items[i]?.imageUrl && (
            <img src={board.items[i].imageUrl} className="w-full h-full object-cover" alt="" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>(() => {
    try { return JSON.parse(localStorage.getItem("fedit-boards") || "[]"); } catch { return []; }
  });
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [editName, setEditName] = useState("");
  const { setModalProductId } = useProductStore((s) => s);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;

  const persistBoards = (updated: Board[]) => {
    setBoards(updated);
    localStorage.setItem("fedit-boards", JSON.stringify(updated));
  };

  const handleEditSave = () => {
    if (!editBoard || !editName.trim()) return;
    persistBoards(boards.map((b) => b.id === editBoard.id ? { ...b, name: editName.trim() } : b));
    setEditBoard(null);
  };

  const handleDeleteBoard = () => {
    if (!editBoard) return;
    persistBoards(boards.filter((b) => b.id !== editBoard.id));
    if (selectedBoardId === editBoard.id) setSelectedBoardId(null);
    setEditBoard(null);
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
              <Icon icon="lucide:arrow-left" className="w-5 h-5 text-[#242628]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#0B0E0F]">{selectedBoard.name}</h1>
              <p className="text-sm text-[#91929D]">상품 {selectedBoard.items.length}개</p>
            </div>
          </div>

          {selectedBoard.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#91929D]">
              <Icon icon="ph:bookmark" className="w-12 h-12 mb-3" />
              <p className="text-base font-medium">저장된 상품이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {selectedBoard.items.map((item, i) => (
                <button
                  key={item.itemcode + i}
                  onClick={() => setModalProductId(item.itemcode)}
                  className="group relative rounded-xl overflow-hidden bg-[#F6F8FA] aspect-[3/4]"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      className="w-full h-full object-cover group-hover:brightness-90 transition-all"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full bg-[#ECEEF0]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-[#0B0E0F] mb-6">내 보드</h1>

          {boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#91929D]">
              <Icon icon="ph:folder" className="w-12 h-12 mb-3" />
              <p className="text-base font-medium">저장된 보드가 없습니다</p>
              <p className="text-sm mt-1">상품을 저장하면 보드가 생성됩니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="group relative cursor-pointer"
                  onClick={() => setSelectedBoardId(board.id)}
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
                      <Icon icon="lucide:pencil" className="w-4 h-4 text-[#3D3F41]" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="font-bold text-[#0B0E0F]">{board.name}</p>
                    <p className="text-sm text-[#91929D]">상품 {board.items.length}개</p>
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
              <h2 className="text-xl font-bold text-[#242628]">보드 수정</h2>
              <button onClick={() => setEditBoard(null)}>
                <Icon icon="material-symbols:close" className="w-6 h-6 text-[#91929D] hover:text-black transition-colors" />
              </button>
            </div>
            <div className="border border-[#ECEEF0] rounded-xl px-4 py-3 mb-4">
              <div className="text-xs text-[#91929D] mb-1">보드 이름</div>
              <input
                className="w-full text-sm font-semibold text-[#242628] outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                autoFocus
              />
            </div>
            <button
              onClick={handleEditSave}
              disabled={!editName.trim()}
              className={`w-full py-3 rounded-xl font-bold text-base transition-colors mb-3 ${
                editName.trim() ? "bg-[#242628] text-white hover:bg-black cursor-pointer" : "bg-[#F6F8FA] text-[#A1A3A5] cursor-not-allowed"
              }`}
            >
              저장
            </button>
            <button
              onClick={handleDeleteBoard}
              className="w-full py-3 rounded-xl font-bold text-base text-[#F04438] border border-[#FEE4E2] hover:bg-[#FFF5F4] transition-colors"
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
