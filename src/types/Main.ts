type Keyword = {
  idx: number;
  keyword: string;
  status: number;
};

export interface MonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  dateList: string[];
}

export interface MainItemTrendBoxProps {
  audienceType: string;
}

export interface GetTrendKeywordParams {
  audienceType: string;
  date?: string;
  brand?: string;
}

export type KeywordBox = {
  title: string;
  keywords: Keyword[];
  crawledDate?: string | null;
};

export type TitleBox = {
  title: string;
  sub_title: string;
  info?: string;
};

type ColorItem = {
  color_name: string;
  color_code: string;
};

type ProductItem = {
  product_img_url: string;
  magazine_url: string;
  magazine: string;
};

export type ProductColorData = {
  colors: ColorItem[];
  products: ProductItem[];
};

export type TrendItem = {
  keyword: string;
  keyword_image_url: string;
  search_volume: number;
  search_trend: number[];
  category?: string;
  magazines?: { title: string; magazine_url: string }[];
  magazine?: { title: string; magazine_url: string }[];
  related_item?: { item_image_url: string; item_url: string }[];
};

export type chartProps = { charList: number[] };
