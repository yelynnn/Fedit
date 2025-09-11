import type { DetailSectionType } from "@/types/Product";

function DetailSection({ title, content }: DetailSectionType) {
  const isArray = Array.isArray(content);

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold">
      <span className="text-[#888A8C] leading-5">{title}</span>

      {isArray ? (
        <div className="flex flex-wrap gap-2">
          {(content as string[]).map((c, idx) => (
            <div
              key={`${c}-${idx}`}
              className="flex items-center justify-center px-3 border rounded-lg w-fit h-fit py-2 border-[1px] border-[#56585A]"
            >
              <span className="text-[#3D3F41]">{c}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center px-3 border rounded-lg w-fit h-fit py-2 border-[1px] border-[#56585A]">
          <span className="text-[#3D3F41]">{content}</span>
        </div>
      )}
    </div>
  );
}

export default DetailSection;
