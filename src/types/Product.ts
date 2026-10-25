export type DetailSectionType = {
  title: string;
  content: string | string[];
};

type ApiCategory = {
  main_category?: string | null;
  category?: string | null;
};

type Vlm = {
  length: string;
  material: string;
  neckline: string;
  sleeve: string;
  fit: string;
  pattern: string | string[];
  detail: string[];
  color: string[];
  // 무드(최대 3개)·계절감(봄→여름→가을→겨울→사계절 순). 백엔드 배포 전이면
  // 키가 없을 수 있다 — 없으면 빈 배열로 본다.
  mood?: string[];
  season_feel?: string[];
};

export type ApiDetail = {
  itemcode: string;
  product_name: string;
  gender: string | null;
  brand: string | null;
  categories?: ApiCategory[];
  thumbnail?: string | null;
  front_image_url?: string | null;
  current_price: string | null;
  regular_price: string | null;
  discount_rate: string | number | null;
  reviews: number | null;
  rating: number | null;
  vlm?: Vlm | null;
  release_date: string | null;
  // 마지막으로 크롤링한 날 — 출시일이 없을 때 "신상 업데이트"에 대신 쓴다(서버 배포 전엔 없음)
  crawled_date?: string | null;
  ai_description: string | null;
  product_detail_url?: string | null;
  views?: string | number | null;
  sales?: string | number | null;
  platform?: string | null;
};
