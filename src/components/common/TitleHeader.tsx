import type { TitleBox } from "@/types/Main";

function TitleHeader({ title, sub_title }: TitleBox) {
  return (
    <div className="flex flex-col gap-2">
      <header className="text-2xl font-semibold leading-9 text-[#3D3F41]">
        {title}
      </header>
      <p className="text-[#888A8C] leading-6 text-base font-semibold">
        {sub_title}
      </p>
    </div>
  );
}

export default TitleHeader;
