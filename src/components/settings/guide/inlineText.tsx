import type { ReactNode } from "react";

/** "**굵게**" 표기를 <strong>으로 변환 */
export function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m ? (
      <strong key={i} className="font-semibold text-[#0B0E0F]">
        {m[1]}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}
