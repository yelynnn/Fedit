import type { DetailSectionType } from "@/types/Product";

function DetailSection({ title, content }: DetailSectionType) {
  const isArray = Array.isArray(content);
  const items = isArray ? (content as string[]) : null;
  const isEmptyArray = isArray && (!items || items.length === 0);

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold">
      <span className="text-icon-neutral leading-5">{title}</span>

      {isArray ? (
        isEmptyArray ? (
          <div className="flex items-center justify-center px-3 border rounded-lg w-10 h-fit py-2 border-[1px] border-line-default">
            <span className="text-tx-neutral">-</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items!.map((c, idx) => (
              <div
                key={`${c}-${idx}`}
                className="flex items-center justify-center px-3 border rounded-lg w-fit h-fit py-2 border-[1px] border-line-default"
              >
                <span className="text-tx-neutral">{c}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex items-center justify-center px-3 border rounded-lg w-fit h-fit py-2 border-[1px] border-line-default">
          <span className="text-tx-neutral">
            {content && String(content).trim() !== "" ? content : "-"}
          </span>
        </div>
      )}
    </div>
  );
}

export default DetailSection;
