import { useState } from "react";
import { Icon } from "@iconify/react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEEDBACK_OPTIONS = [
  "문장이 길어서 읽기 불편했어요",
  "내용이 기대만큼 도움이 되지 않았어요",
  "궁금한 내용이 포함되어 있지 않았어요",
  "상품과 관련 없는 내용처럼 느껴졌어요",
  "실무에서 사용하는 표현과 차이가 있었어요",
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isDirectInputActive, setIsDirectInputActive] = useState(false);
  const [directInput, setDirectInput] = useState("");

  if (!isOpen) return null;

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    );
  };

  // 버튼 활성화 로직 수정:
  // 1. 일반 옵션이 하나라도 선택됨 OR
  // 2. 직접 입력이 활성화되어 있고 + 내용이 비어있지 않음(공백 제외)
  const isSubmitEnabled =
    selectedOptions.length > 0 ||
    (isDirectInputActive && directInput.trim() !== "");

  const handleSubmit = () => {
    console.log("피드백 제출:", { selectedOptions, directInput });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[440px] bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-[#ECEEF0]">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-[#242628]">
            아쉬웠던 점을 선택해주세요.
          </h2>
          <button
            onClick={onClose}
            className="text-[#91929D] hover:text-black transition-colors"
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-[#56585A] mb-8">
          더 나은 서비스를 위해 자유롭게 의견을 남겨주세요.
        </p>

        {/* 간격을 위해 mb-4로 조정 */}
        <div className="flex flex-col gap-4 mb-4">
          {FEEDBACK_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={(e) => {
                e.preventDefault();
                toggleOption(option);
              }}
            >
              <div
                className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${
                  selectedOptions.includes(option)
                    ? "bg-[#4A4C4E] border-[#4A4C4E]"
                    : "border-[#D1D3D9]"
                }`}
              >
                {selectedOptions.includes(option) && (
                  <Icon icon="lucide:check" className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-[#242628] text-sm font-medium">
                {option}
              </span>
            </label>
          ))}

          <label
            className="flex items-center gap-3 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setIsDirectInputActive(!isDirectInputActive);
            }}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${
                isDirectInputActive
                  ? "bg-[#4A4C4E] border-[#4A4C4E]"
                  : "border-[#D1D3D9]"
              }`}
            >
              {isDirectInputActive && (
                <Icon icon="lucide:check" className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-[#242628] text-sm font-bold">직접 입력</span>
          </label>
        </div>

        {/* 직접 입력창 상단 마진을 mt-2로 줄여서 간격 좁힘 */}
        {isDirectInputActive && (
          <textarea
            className="w-full h-24 p-3 border border-[#ECEEF0] rounded-lg text-sm outline-none resize-none focus:border-[#4A4C4E] transition-colors"
            placeholder="아쉬웠던 점을 입력해주세요."
            value={directInput}
            onChange={(e) => setDirectInput(e.target.value)}
            autoFocus
          />
        )}

        <button
          disabled={!isSubmitEnabled}
          onClick={handleSubmit}
          className={`w-full mt-8 h-10 rounded-xl font-bold transition-colors ${
            isSubmitEnabled
              ? "bg-[#242628] text-white cursor-pointer hover:bg-black"
              : "bg-[#F6F8FA] text-[#A1A3A5] cursor-not-allowed"
          }`}
        >
          확인
        </button>
      </div>
    </div>
  );
}
