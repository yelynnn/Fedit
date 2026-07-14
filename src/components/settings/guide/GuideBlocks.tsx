import type { GuideBlock } from "@/types/guide";
import { renderInline } from "./inlineText";

// 소제목: Title(sb)/medium — #0B0E0F, 16px/600/150%/-0.08px
const HEADING_CLASS =
  "mt-2 text-[16px] font-semibold leading-[150%] tracking-[-0.08px] text-[#0B0E0F]";

// 기본 본문: Label(rg)/small — #3D3F41, 14px/400/143%/-0.07px
const BODY_CLASS =
  "text-[14px] font-normal leading-[143%] tracking-[-0.07px] text-[#3D3F41]";

export default function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm text-tx-assistive py-8 text-center">
        콘텐츠 준비 중입니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 break-keep">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h3 key={i} className={HEADING_CLASS}>
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <p key={i} className={BODY_CLASS}>
                {renderInline(block.text)}
              </p>
            );

          case "quote":
            return (
              <p
                key={i}
                className={`${BODY_CLASS} border-l-2 border-[#E4E4E4] pl-3`}
              >
                {renderInline(block.text)}
              </p>
            );

          case "list":
            return block.ordered ? (
              <ol key={i} className={`ml-5 flex list-decimal flex-col gap-1.5 ${BODY_CLASS}`}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            ) : (
              <ul key={i} className={`ml-5 flex list-disc flex-col gap-1.5 ${BODY_CLASS}`}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );

          case "table":
            return (
              <div
                key={i}
                className="overflow-hidden rounded-[8px] border border-line-divider"
              >
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#F9FAFB]">
                      {block.headers.map((header) => (
                        <th
                          key={header}
                          className="border-b border-line-divider px-[14px] py-[10px] text-left font-semibold text-[#0B0E0F]"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr
                        key={r}
                        className={
                          r !== block.rows.length - 1
                            ? "border-b border-[#F1F2F4]"
                            : ""
                        }
                      >
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={`px-[14px] py-[10px] leading-[143%] tracking-[-0.07px] ${
                              c === 0
                                ? "font-semibold text-[#0B0E0F]"
                                : "text-[#3D3F41]"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "callout":
            return (
              <div
                key={i}
                className="rounded-xl bg-[#F9FAFB] border border-line-divider px-4 py-3"
              >
                {block.title && (
                  <p className="mb-1 text-[14px] font-semibold leading-[143%] tracking-[-0.07px] text-[#0B0E0F]">
                    {block.title}
                  </p>
                )}
                <p className={BODY_CLASS}>{renderInline(block.text)}</p>
              </div>
            );

          case "note":
            return (
              <p
                key={i}
                className="text-[12px] leading-[143%] tracking-[-0.06px] text-tx-assistive"
              >
                {renderInline(block.text)}
              </p>
            );

          case "image":
            return (
              <img
                key={i}
                src={block.src}
                alt={block.alt ?? ""}
                className="w-full rounded-xl border border-line-divider"
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
