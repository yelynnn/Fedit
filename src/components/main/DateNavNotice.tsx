import type { ReactNode } from "react";

// 버튼을 누르거나 호버했을 때, 그 버튼 바로 아래에 뜨는 말풍선 토스트/툴팁.
// 부모 쪽에서 `relative`인 버튼 래퍼 안에 조건부로 넣어 쓴다.
export default function DateNavNotice({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-1/2 top-full z-50 flex -translate-x-1/2 flex-col items-center pt-2">
      {/* border 트릭으로 만든 순수 삼각형 — 사각형을 돌린 게 아니라서 아래쪽과
          겹칠 일이 없다 */}
      <div className="h-0 w-0 border-x-[6px] border-b-[6px] border-x-transparent border-b-[rgba(0,0,0,0.75)]" />
      <div className="w-56 break-keep rounded-lg bg-[rgba(0,0,0,0.75)] px-3 py-2 text-center text-sm font-medium leading-snug text-white shadow-lg">
        {children}
      </div>
    </div>
  );
}
