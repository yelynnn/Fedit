import { Icon } from "@iconify/react";
import type { GuideTopic } from "@/types/guide";
import GuideBlocks from "./GuideBlocks";

export default function GuideDetailView({
  topic,
  onBack,
}: {
  topic: GuideTopic;
  onBack: () => void;
}) {
  return (
    <div className="max-w-[600px] break-keep">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-tx-assistive hover:text-tx-strong transition-colors mb-4"
      >
        <Icon icon="ph:arrow-left" className="w-4 h-4" />
        가이드 목록으로
      </button>

      <h1 className="text-[24px] font-semibold leading-[133%] tracking-[-0.48px] text-[#0B0E0F]">
        {topic.title}
      </h1>
      <p className="text-[16px] font-medium leading-[150%] tracking-[-0.08px] text-[#6F7173] mt-1 mb-6">
        {topic.subtitle}
      </p>

      <GuideBlocks blocks={topic.blocks} />
    </div>
  );
}
