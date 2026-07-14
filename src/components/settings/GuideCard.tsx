interface GuideCardProps {
  title: string;
  desc: string;
  thumbnailSrc?: string;
  onClick?: () => void;
}

export default function GuideCard({
  title,
  desc,
  thumbnailSrc,
  onClick,
}: GuideCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start self-stretch overflow-hidden rounded-xl border border-[#E4E4E4] bg-white text-left transition-colors hover:bg-[rgba(11,14,15,0.05)]"
    >
      <div className="h-[120px] w-full flex-shrink-0 self-stretch bg-[#E9EBED]">
        {thumbnailSrc && (
          <img
            src={thumbnailSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col items-start gap-1.5 self-stretch p-5 break-keep">
        <p className="text-[14px] font-medium leading-[143%] tracking-[-0.07px] text-[#A1A3A5]">
          {desc}
        </p>
        <p className="text-[16px] font-semibold leading-[150%] tracking-[-0.08px] text-[#3D3F41]">
          {title}
        </p>
      </div>
    </button>
  );
}
