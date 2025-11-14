import { useState } from "react";
import helpIcon from "@/assets/helpIcon.svg";
import helpSmall from "@/assets/helpSmall.png";

interface QuestionTooltipProps {
  infoText: string;
}

function QuestionTooltip({ infoText }: QuestionTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  return (
    <div className="relative inline-block">
      <img
        src={helpIcon}
        alt="help"
        className="w-5 h-6 cursor-pointer"
        onClick={handleClick}
      />

      {showTooltip && (
        <div className="absolute left-[150%] top-[42%] -translate-y-[42%] w-94 bg-[#242628] text-white rounded-2xl text-sm leading-relaxed py-3 px-5 shadow-lg z-50">
          <div className="flex items-center gap-2 mb-2">
            <img src={helpSmall} alt="info" className="w-4 h-4" />
            <span className="text-sm font-semibold">도움말</span>
          </div>

          <p className="text-sm font-medium text-white leading-[22px] whitespace-pre-line">
            {infoText}
          </p>
        </div>
      )}
    </div>
  );
}

export default QuestionTooltip;
