import { useState } from "react";
import { Icon } from "@iconify/react";

interface DetailItemProps {
  title: string;
  content: string | string[];
}

export default function DetailItem({ title, content }: DetailItemProps) {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);

  const displayContent = Array.isArray(content) ? content.join(", ") : content;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-[#6F7173] font-semibold">{title}</span>
      <div className="flex items-center justify-between py-3 px-2 bg-[#F9FAFB] rounded-lg border border-[#F2F4F6]">
        <span className="text-sm font-semibold text-[#242628] truncate flex-1 mr-1">
          {displayContent || "-"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedback(feedback === "like" ? null : "like")}
          >
            <Icon
              icon={
                feedback === "like" ? "mdi:thumb-up" : "mdi:thumb-up-outline"
              }
              className={`w-5 h-5 ${feedback === "like" ? "text-[#6F7173]" : "text-[#D1D3D9]"}`}
            />
          </button>
          <div className="w-[1px] h-4 bg-[#E4E4E4]" />

          <button
            onClick={() =>
              setFeedback(feedback === "dislike" ? null : "dislike")
            }
          >
            <Icon
              icon={
                feedback === "dislike"
                  ? "mdi:thumb-down"
                  : "mdi:thumb-down-outline"
              }
              className={`w-5 h-5 ${feedback === "dislike" ? "text-[#6F7173]" : "text-[#D1D3D9]"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
