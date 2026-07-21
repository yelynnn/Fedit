import { useState, useRef, useLayoutEffect, useEffect } from "react";
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
  const storageKey = `ai-feedback-${itemcode}`;
  const [feedback, setFeedback] = useState<"none" | "like" | "dislike">(() => {
    const stored = localStorage.getItem(storageKey);
    return (stored as "none" | "like" | "dislike") || "none";
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAIInfo, setShowAIInfo] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const handleShowAIInfo = () => {
    setShowAIInfo(true);
    setTimeout(() => setShowAIInfo(false), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem(`ai-feedback-${itemcode}`);
    setFeedback((stored as "none" | "like" | "dislike") || "none");
  }, [itemcode]);

  const saveFeedback = (value: "none" | "like" | "dislike") => {
    setFeedback(value);
    if (value === "none") {
      localStorage.removeItem(`ai-feedback-${itemcode}`);
    } else {
      localStorage.setItem(`ai-feedback-${itemcode}`, value);
    }
  };

  const handleLike = () => {
    const next = feedback === "like" ? "none" : "like";
    saveFeedback(next);
    if (next === "like") {
      PostJudge({
        itemcode,
        column: "ai_description",
        judge: 1,
        feedback: null,
      }).catch(() => {});
    }
  };

  const handleDislike = () => {
    if (feedback === "dislike") {
      saveFeedback("none");
    } else {
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = (selectedFeedback: string[]) => {
    saveFeedback("dislike");
    PostJudge({
      itemcode,
      column: "ai_description",
      judge: -1,
      feedback: selectedFeedback,
    }).catch(() => {});
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
    <div className="bg-[#FBFAFF] rounded-xl p-3 mb-4 border border-surface-base">
      <div className="flex items-center justify-between">
        <div className="relative flex items-center gap-1.5 font-semibold text-gray-800 mb-3 text-sm">
          AI 개요
          <button
            type="button"
            onClick={handleShowAIInfo}
            className="flex items-center justify-center w-4 h-4"
          >
            <Icon icon="ph:question" className="w-4 h-4 text-gray-400" />
          </button>
          {showAIInfo && (
            <>
              <div
                className="absolute z-50 w-3 h-2 overflow-hidden"
                style={{ left: 60, top: 19 }}
              >
                <div className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[rgba(0,0,0,0.75)]" />
              </div>
              <div
                className="absolute z-50 flex flex-col items-center justify-center gap-2.5 w-[320px] rounded-lg bg-[rgba(0,0,0,0.75)] px-3 py-2 shadow-[0_4px_16px_0_rgba(0,0,0,0.10)]"
                style={{ left: 0, top: 27 }}
              >
                <span className="text-center break-keep type-body-xsmall text-tx-inverse">
                  AI가 상품의 디자인 특징과 트렌드 요소를 분석해 핵심 내용을
                  한눈에 정리하고, 상품 기획에 필요한 인사이트를 제공해요.
                </span>
              </div>
            </>
          )}
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
              feedback === "like" ? "text-tx-alt" : "hover:text-gray-600"
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
              feedback === "dislike" ? "text-tx-alt" : "hover:text-gray-600"
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
