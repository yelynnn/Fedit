import type { DetailSectionType } from "@/types/Product";

function DetailSection({ title, content }: DetailSectionType) {
  const isUrl = typeof content === "string" && content.startsWith("http");

  return (
    <div className="flex flex-col">
      <span className="text-[#424551]">{title}</span>
      {isUrl ? (
        <a
          href={content}
          className="text-[#9A9CA5] underline max-w-[300px] truncate"
          target="_blank"
          rel="noopener noreferrer"
          title={content}
        >
          {new URL(content).hostname}
        </a>
      ) : (
        <span className="text-[#9A9CA5]">{content}</span>
      )}
    </div>
  );
}

export default DetailSection;
