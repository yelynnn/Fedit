import type { TitleBox } from "@/types/Main";

function SubTitleBox({ title, sub_title }: TitleBox) {
  return (
    <div className="mt-8 font-semibold">
      <header className="text-xl leading-7">{title}</header>
      <p className="text-base text-[#888A8C] leading-6 mt-3">{sub_title}</p>
    </div>
  );
}

export default SubTitleBox;
