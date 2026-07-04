import { useState } from "react";
import helpSmall from "@/assets/helpSmall.png";
import { Icon } from "@iconify/react";

interface QuestionTooltipProps {
  label: string;
  infoText: string;
}

function QuestionTooltip({ label, infoText }: QuestionTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className="flex items-center gap-1 px-2 py-1 border border-[#B1C9FF] bg-falling-bg rounded-full transition-all hover:bg-falling-bg active:scale-95"
      >
        <Icon
          icon="material-symbols:help-outline-rounded"
          className="w-4 text-tx-alt opacity-70"
        />
        <span className="text-tx-alt text-xs font-semibold">{label}</span>
      </button>

      {showTooltip && (
        <div className="absolute left-0 top-[calc(100%+12px)] w-max max-w-[300px] bg-fill-primary text-white rounded-2xl text-sm py-3 px-5 shadow-lg z-50">
          <div className="flex items-center gap-2 mb-2">
            <img src={helpSmall} alt="info" className="w-4 h-4" />
            <span className="text-sm font-semibold">도움말</span>
          </div>

          <p className="text-sm font-semibold text-white leading-[22px] whitespace-pre-line">
            {infoText}
          </p>

          <div className="absolute -top-1 left-6 w-2.5 h-2.5 bg-fill-primary rotate-45" />
        </div>
      )}
    </div>
  );
}

export default QuestionTooltip;
