import { brandData } from "./BrandCategories";

export const GenderCategories = ["여성", "남성", "공용"];
export const ColorCategories = [
  { label: "red", value: "#FF0000" },
  { label: "orange", value: "#FFA378" },
  { label: "yellow", value: "#FFF017" },
  { label: "blue", value: "#2563EB" },
  { label: "green", value: "#216F36" },
  { label: "black", value: "#000000" },
  { label: "gray", value: "#D9D9D9" },
  { label: "white", value: "#FFFFFF" },
  { label: "brown", value: "#785915" },
  { label: "pink", value: "#FF27C9" },
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
  ...TypeCategories.flatMap((t) => [t.category, ...t.subcategories]),
];
