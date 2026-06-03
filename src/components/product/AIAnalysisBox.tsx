import { useState, useRef, useLayoutEffect } from "react";
import { Icon } from "@iconify/react";
import FeedbackModal from "./FeedbackModal";
import { PostJudge } from "@/apis/AnalysisAPI";

interface AIAnalysisBoxProps {
  content: string;
  itemcode: string;
  isRanking: boolean;
  onDetailClick?: () => void;
}

export default function AIAnalysisBox({
  content,
  itemcode,
  isRanking,
  onDetailClick,
}: AIAnalysisBoxProps) {
  const [feedback, setFeedback] = useState<"none" | "like" | "dislike">("none");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const handleLike = () => {
    const next = feedback === "like" ? "none" : "like";
    setFeedback(next);
    if (next === "like") {
      PostJudge({ itemcode, column: "ai_description", judge: 1, feedback: null }).catch(
        console.error,
      );
    }
  };

  const handleDislike = () => {
    if (feedback === "dislike") {
      setFeedback("none");
    } else {
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = (selectedFeedback: string[]) => {
    setFeedback("dislike");
    PostJudge({
      itemcode,
      column: "ai_description",
      judge: -1,
      feedback: selectedFeedback,
    }).catch(console.error);
  };

  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsOverflowing(
          textRef.current.scrollHeight > textRef.current.clientHeight + 2,
        );
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [content]);

  return (
    <div className="bg-[#FBFAFF] rounded-xl p-3 mb-3 border border-[#F1F3F5]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-3 text-sm">
          AI 개요 <Icon icon="ph:question" className="w-4 h-4 text-gray-400" />
        </div>
        {isRanking && (
          <button
            onClick={onDetailClick}
            className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black"
          >
            상품 상세 보기 <Icon icon="ph:caret-right" />
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <p
          ref={textRef}
          className={`text-sm text-gray-600 leading-relaxed ${
            isExpanded ? "" : "line-clamp-3"
          }`}
        >
          {content}
        </p>
        {!isExpanded && isOverflowing && (
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute bottom-0 right-0 bg-[#FBFAFF] pl-4 text-sm text-gray-400 hover:text-gray-600"
          >
            더보기
          </button>
        )}
        {isExpanded && (
          <div className="flex justify-end mt-1">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="ph:caret-up" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 mt-2 text-xs text-gray-400 border-t border-gray-200">
        <span>위의 요약이 도움이 되셨나요?</span>
        <div className="flex gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center transition-colors ${
              feedback === "like" ? "text-[#6F7173]" : "hover:text-gray-600"
            }`}
          >
            <Icon
              icon={feedback === "like" ? "ph:thumbs-up-fill" : "ph:thumbs-up"}
              className="w-5 h-5"
            />
          </button>

          <button
            onClick={handleDislike}
            className={`flex items-center transition-colors ${
              feedback === "dislike" ? "text-[#6F7173]" : "hover:text-gray-600"
            }`}
          >
            <Icon
              icon={
                feedback === "dislike"
                  ? "ph:thumbs-down-fill"
                  : "ph:thumbs-down"
              }
              className="w-5 h-5"
            />
          </button>
        </div>
      </div>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
