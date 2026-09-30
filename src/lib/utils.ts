import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 값이 없으면(null/undefined/빈 문자열) null을 반환해 호출부가 아예 표시를
// 생략하게 한다. 1 이하도 "값 없음"으로 취급한다 — 백엔드가 실제 판매
// 데이터가 없을 때 0이나 1을 내려주는 경우가 있어, 그대로 보여주면 진짜
// 수치인 것처럼 오해된다(예전 코드에 있던 `sales != 1` 체크도 같은
// 이유였다). 500건 이하는 정확한 수치(100건/200건 등)를 노출하지 않고
// "500건 이하"로 통일한다.
export function formatSalesCount(
  value: number | string | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 1) return null;
  if (n <= 500) return "500건 이하";
  return n.toLocaleString("ko-KR");
}
