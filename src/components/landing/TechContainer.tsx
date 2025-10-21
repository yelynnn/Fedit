import tagAIImgUrl from "@/assets/landing/tagAIImg.svg";
import personalizeImgUrl from "@/assets/landing/personalizeImg.svg";

export type SubContainerProps = {
  title: string;
  content: string;
};

function TechContainer({ title, content }: SubContainerProps) {
  const isAI = title === "패션 특화 데이터셋으로 학습된 AI";
  const imageSrc = isAI ? tagAIImgUrl : personalizeImgUrl;

  return (
    <section
      className={[
        "flex flex-col items-center gap-4 md:gap-9",
        isAI ? "md:translate-x-12" : "md:-translate-x-5 md:translate-y-9",
      ].join(" ")}
    >
      <div className="rounded-md sm:text-2xl font-semibold flex items-center justify-center py-2 text-white px-16 md:px-7 w-fit bg-[rgba(255,255,255,0.15)]">
        {title}
      </div>
      <img
        src={imageSrc}
        alt={"AI 이미지"}
        className="w-67 sm:w-91 h-80 sm:h-108 rounded-2xl"
      />
      <div className="w-83 sm:w-95 p-[1px] text-center box-border rounded-[12px] bg-gradient-to-r from-[#FFFFFF] to-[#3C40C1] sm:w-95 md:translate-x-15 md:-translate-y-3">
        <div
          className="flex justify-center items-center px-4 py-4 sm:py-6 rounded-xl bg-[#151515] text-white sm:text-2xl font-semibold leading-6 sm:leading-[36px]"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}

export default TechContainer;
