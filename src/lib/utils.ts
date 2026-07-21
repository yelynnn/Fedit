import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalesCount(value: number | string) {
  const n = Number(value)
  if (n <= 100) return "100건 이하"
  return n.toLocaleString("ko-KR")
}
