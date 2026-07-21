import { useState } from "react";
import { Icon } from "@iconify/react";
import { PostJudge } from "@/apis/AnalysisAPI";

interface DetailItemProps {
  title: string;
  content: string | string[];
  itemcode: string;
}

export default function DetailItem({ title, content, itemcode }: DetailItemProps) {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);

  const displayContent = Array.isArray(content) ? content.join(", ") : content;

  const handleLike = () => {
    const next = feedback === "like" ? null : "like";
    setFeedback(next);
    if (next === "like") {
      PostJudge({ itemcode, column: title, judge: 1, feedback: null }).catch(
        () => {},
      );
    }
  };

  const handleDislike = () => {
    const next = feedback === "dislike" ? null : "dislike";
    setFeedback(next);
    if (next === "dislike") {
      PostJudge({ itemcode, column: title, judge: -1, feedback: null }).catch(
        () => {},
      );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-tx-alt font-semibold">{title}</span>
      <div className="flex items-start justify-between py-3 px-2 bg-fill-bg-strong rounded-lg border border-surface-base">
        <span className="text-sm font-semibold text-tx-default break-words flex-1 mr-1">
          {displayContent || "-"}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          <button onClick={handleLike}>
            <Icon
              icon={
                feedback === "like" ? "mdi:thumb-up" : "mdi:thumb-up-outline"
              }
              className={`w-5 h-5 ${feedback === "like" ? "text-tx-alt" : "text-[#D1D3D9]"}`}
            />
          </button>
          <div className="w-[1px] h-4 bg-line-alt" />
          <button onClick={handleDislike}>
            <Icon
              icon={
                feedback === "dislike"
                  ? "mdi:thumb-down"
                  : "mdi:thumb-down-outline"
              }
              className={`w-5 h-5 ${feedback === "dislike" ? "text-tx-alt" : "text-[#D1D3D9]"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
