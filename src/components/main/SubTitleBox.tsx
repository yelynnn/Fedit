import type { TitleBox } from "@/types/Main";
import QuestionTooltip from "../common/QuestionTooltip";

function SubTitleBox({ title, label, infoText }: TitleBox) {
  return (
    <div className="flex gap-2 mt-8 font-semibold">
      <header className="text-lg leading-7">{title}</header>
      {/* <p className="text-base text-[#888A8C] leading-6 mt-3">{sub_title}</p> */}
      <QuestionTooltip label={label} infoText={infoText} />
    </div>
  );
}

export default SubTitleBox;
