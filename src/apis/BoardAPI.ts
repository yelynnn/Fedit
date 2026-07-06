import { axiosInstance } from "./AxiosInstance";

export interface CreateBoardResponse {
  boardId: number;
  ok: boolean;
}

export interface BoardListItem {
  boardId: number;
  name: string;
  itemCount: number;
  createdAt: string;
  recentThumbnails: string[];
}

export interface BoardItemThumbnail {
  itemcode: string;
  thumbnail: string;
}

const handleError = (error: any, fallbackMessage: string): never => {
  if (error.response) {
    const { data } = error.response;
    throw new Error(data?.message || fallbackMessage);
  }
  throw new Error("서버에 연결할 수 없습니다.");
};

const PostCreateBoard = async (name: string): Promise<CreateBoardResponse> => {
  try {
    const res = await axiosInstance.post("/board/new", { name });
    return res.data;
  } catch (error: any) {
    return handleError(error, "보드 생성에 실패했습니다.");
  }
};

const DeleteBoard = async (boardId: number, name: string): Promise<void> => {
  try {
    await axiosInstance.delete("/board/delete", { data: { boardId, name } });
  } catch (error: any) {
    return handleError(error, "보드 삭제에 실패했습니다.");
  }
};

const PatchBoardName = async (boardId: number, name: string): Promise<void> => {
  try {
    await axiosInstance.patch("/board/name", { boardId, name });
  } catch (error: any) {
    return handleError(error, "보드 이름 변경에 실패했습니다.");
  }
};

const PostAddBoardItem = async (
  boardId: number,
  itemcode: string,
): Promise<void> => {
  try {
    await axiosInstance.post("/board/newitem", { boardId, itemcode });
  } catch (error: any) {
    return handleError(error, "상품 저장에 실패했습니다.");
  }
};

const DeleteBoardItem = async (
  boardId: number,
  itemcode: string,
): Promise<void> => {
  try {
    await axiosInstance.delete("/board/deleteItem", {
      data: { boardId, itemcode },
    });
  } catch (error: any) {
    return handleError(error, "상품 삭제에 실패했습니다.");
  }
};

const GetBoardList = async (): Promise<BoardListItem[]> => {
  try {
    const res = await axiosInstance.get("/board/list");
    return res.data ?? [];
  } catch (error: any) {
    return handleError(error, "보드 목록을 불러오지 못했습니다.");
  }
};

const GetBoardItems = async (boardId: number): Promise<BoardItemThumbnail[]> => {
  try {
    const res = await axiosInstance.get("/board/items", { params: { boardId } });
    return res.data ?? [];
  } catch (error: any) {
    return handleError(error, "보드 상품을 불러오지 못했습니다.");
  }
};

export {
  PostCreateBoard,
  DeleteBoard,
  PatchBoardName,
  PostAddBoardItem,
  DeleteBoardItem,
  GetBoardList,
  GetBoardItems,
};
