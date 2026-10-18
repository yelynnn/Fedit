import { axiosInstance } from "./AxiosInstance";

// 크롬 확장으로 저장한 외부 상품(itemcode 가 EXT 로 시작). 서버: /board/external-item
export interface ExtensionItemAnalysis {
  mainCategory?: string | null;
  category?: string | null;
  material?: string | null;
  length?: string | null;
  sleeve?: string | null;
  fit?: string | null;
  neckline?: string | null;
  pattern?: string | null;
  detail?: string | null;
  color?: string | null;
  mood?: string | null;
  seasonFeel?: string | null;
  aiDescription?: string | null;
}

export interface ExtensionItem {
  itemcode: string;
  source: "product" | "extension";
  status: "queued" | "ai_done" | "indexed" | "failed";
  productName?: string | null;
  brand?: string | null;
  thumbnail?: string | null;
  analysis?: ExtensionItemAnalysis | null;
  error?: string | null;
  productUrl?: string | null;
  platform?: string | null;
  regularPrice?: number | null;
  currentPrice?: number | null;
}

export interface ExtensionSimilarItem {
  itemCode: string;
  brand?: string | null;
  product_name?: string | null;
  thumbnail?: string | null;
  details?: string[] | null;
}

export const isExtensionItemCode = (code: string | null | undefined): boolean =>
  !!code && code.startsWith("EXT");

export const GetExtensionItem = async (itemcode: string): Promise<ExtensionItem> => {
  const res = await axiosInstance.get(`/board/external-item/${encodeURIComponent(itemcode)}`);
  return res.data;
};

export const GetExtensionSimilar = async (
  itemcode: string,
  limit = 8,
): Promise<ExtensionSimilarItem[]> => {
  const res = await axiosInstance.get(
    `/board/external-item/${encodeURIComponent(itemcode)}/similar`,
    { params: { limit } },
  );
  return Array.isArray(res.data) ? res.data : [];
};
