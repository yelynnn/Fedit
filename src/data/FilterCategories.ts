import { brandData } from "./BrandCategories";

export const GenderCategories = ["여성", "남성", "공용"];
export const ColorCategories = [
  { label: "블랙", value: "#000000" },
  { label: "화이트", value: "#FFFFFF" },
  { label: "아이보리", value: "#FFFFF0" },
  { label: "그레이", value: "#9E9E9E" },
  { label: "다크 그레이", value: "#424242" },
  { label: "네이비", value: "#002266" },
  { label: "라이트 그레이", value: "#D3D3D3" },
  { label: "스카이 블루", value: "#87CEEB" },
  { label: "베이지", value: "#D4B896" },
  { label: "블루", value: "#2563EB" },
  { label: "핑크", value: "#FF69B4" },
  { label: "라이트 핑크", value: "#FFB6C1" },
  { label: "브라운", value: "#795548" },
  { label: "다크 네이비", value: "#071952" },
  { label: "레드", value: "#E53935" },
  { label: "카키", value: "#6B6B4E" },
  { label: "오트밀", value: "#D4C5A9" },
  { label: "다크 브라운", value: "#3E2723" },
  { label: "그린", value: "#2E7D32" },
  { label: "민트", value: "#98E4D5" },
  { label: "버건디", value: "#800020" },
  { label: "퍼플", value: "#9C27B0" },
  { label: "라벤더", value: "#E6E6FA" },
  { label: "다크 그린", value: "#1B5E20" },
  { label: "라이트 옐로우", value: "#FFF9C4" },
  { label: "옐로우", value: "#FDD835" },
  { label: "올리브 그린", value: "#556B2F" },
  { label: "다크핑크", value: "#C71585" },
  { label: "오렌지", value: "#FF5722" },
  { label: "다크 베이지", value: "#C4A882" },
  { label: "샌드", value: "#C2B280" },
  { label: "라임", value: "#AEEA00" },
  { label: "딥레드", value: "#8B0000" },
  { label: "피치", value: "#FFBE98" },
  { label: "페일 핑크", value: "#FADADD" },
  { label: "머스타드", value: "#FFDB58" },
  { label: "라이트 브라운", value: "#BC8A5F" },
  { label: "카멜", value: "#C19A6B" },
  { label: "브릭", value: "#B33A3A" },
  { label: "다크 오렌지", value: "#E65100" },
  { label: "데님", value: "#6F8FAF" },
  { label: "실버", value: "#C0C0C0" },
  { label: "라이트 오렌지", value: "#FFAB76" },
  { label: "연청", value: "#B0C4DE" },
  { label: "카키 베이지", value: "#C3B091" },
  { label: "흑청", value: "#2C3E6E" },
  { label: "골드", value: "#FFD700" },
  { label: "중청", value: "#4A6FA5" },
  { label: "로즈골드", value: "#B76E79" },
  { label: "진청", value: "#1B3A6B" },
  { label: "기타색상", value: "rainbow" },
];

export const DetailCategories = [
  "셔링/프릴",
  "리본",
  "스터드",
  "언발란스",
  "절개 트임",
];

export const PatternCategories = ["스트라이프", "도트", "프린팅패턴", "무지"];

export const MoodCategories = [
  "러블리",
  "모던",
  "스포츠",
  "스트리트",
  "베이직/심플",
];

export const TypeCategories = [
  {
    category: "상의",
    subcategories: ["반팔 티셔츠", "롱 슬리브", "슬리브리스", "블라우스"],
  },
  {
    category: "아우터",
    subcategories: ["셔츠", "가디건", "코트", "자켓", "패딩/점퍼"],
  },
  {
    category: "하의",
    subcategories: ["스커트", "쇼츠", "데님", "슬랙스", "코튼", "추리닝"],
  },
];

export const allowedFilters = [
  ...Object.values(brandData).flat(),
  ...GenderCategories,
  ...ColorCategories.map((color) => color.label),
  ...DetailCategories,
  ...PatternCategories,
  ...MoodCategories,
  ...TypeCategories.flatMap((t) => [t.category, ...t.subcategories]),
];
