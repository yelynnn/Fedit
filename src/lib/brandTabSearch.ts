import { useEffect, type RefObject } from "react";

// 브랜드 검색(브랜드 필터·관심 브랜드 선택·입점 신청)은 지금 탭 안에서만 찾는다.
// 그래서 SPA 탭에서 디자이너 탭에만 있는 브랜드를 치면 "없어요"가 떴다.
// 지금 탭에 맞는 브랜드가 없으면, 맞는 브랜드가 있는 첫 탭(탭 순서대로)을 돌려준다.

type BrandCategory = { label: string; brands: string[] };

export function findTabForKeyword(
  categories: BrandCategory[],
  currentBrands: string[],
  keyword: string,
): string | null {
  const k = keyword.trim().toLowerCase();
  if (!k) return null;
  const has = (brands: string[]) => brands.some((b) => b.toLowerCase().includes(k));
  if (has(currentBrands)) return null;
  return categories.find((c) => has(c.brands))?.label ?? null;
}

// 탭 줄이 가로 스크롤이라 옮겨간 탭이 화면 밖일 수 있다 — 그 탭이 보이게 탭 줄만
// 스크롤한다(scrollIntoView는 바깥 레이아웃까지 밀어서 쓰지 않는다). 탭 버튼에 data-tab.
export function useScrollActiveTabIntoView(
  containerRef: RefObject<HTMLElement | null>,
  activeTab: string,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activeTab) return;
    const tab = container.querySelector<HTMLElement>(
      `[data-tab="${CSS.escape(activeTab)}"]`,
    );
    if (!tab) return;
    const c = container.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    if (t.left >= c.left && t.right <= c.right) return;
    container.scrollTo({
      left: container.scrollLeft + (t.left - c.left) - (c.width - t.width) / 2,
      behavior: "smooth",
    });
  }, [containerRef, activeTab]);
}
