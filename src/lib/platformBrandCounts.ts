import { GetBrandList } from "@/apis/AnalysisAPI";

// BrandFilterModal.tsx의 PLATFORM_LABEL_TO_CODE와 동일한 매핑. 무신사/29cm
// 같은 "플랫폼 전체 선택"은 platformList에 코드 하나만 담기 때문에, 실제
// 몇 개 브랜드를 의미하는지는 /menu/brand 응답의 카테고리별 브랜드 개수를
// 따로 조회해야 알 수 있다(예: musinsa -> 119개).
const PLATFORM_LABEL_TO_CODE: Record<string, string> = {
  무신사: "musinsa",
  "29cm": "29cm",
};

let cache: Promise<Record<string, number>> | null = null;

export const getPlatformBrandCounts = (): Promise<Record<string, number>> => {
  if (!cache) {
    cache = GetBrandList().then((data) => {
      const categories: { label: string; brands: string[] }[] =
        Array.isArray(data?.categories) ? data.categories : [];
      const counts: Record<string, number> = {};
      categories.forEach((c) => {
        const code = PLATFORM_LABEL_TO_CODE[c.label];
        if (code) counts[code] = c.brands.length;
      });
      return counts;
    });
  }
  return cache;
};
