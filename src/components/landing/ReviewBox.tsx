import type { SubContainerProps } from "./TechContainer";

function ReviewBox({ title, content }: SubContainerProps) {
  return (
    <div
      className="
          flex flex-col text-white items-start font-semibold
          w-85 px-6 py-8 h-61
          rounded-[20px]
          bg-[linear-gradient(0deg,#FFF_-179.14%,#FFF_-165.63%,#000_100%)]
          shadow-[inset_0_5px_4px_rgba(255,255,255,0.25),inset_0_10px_9.3px_rgba(255,255,255,0.25),inset_0_2px_12.1px_rgba(255,255,255,0.80)]
        "
    >
      <div className="relative inline-block mb-5">
        <p className="text-[22px] mb-3">{title}</p>
        <span className="absolute left-0 bottom-0 w-full h-[2px] bg-gradient-to-r from-white/80 to-transparent rounded-full" />
      </div>
      <p
        className="text-xl font-semibold leading-[30px] "
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

export default ReviewBox;
