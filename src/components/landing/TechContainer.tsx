export type SubContainerProps = {
  title: string;
  content: string;
};

function TechContainer({ title, content }: SubContainerProps) {
  const isAI = title === "패션 특화 데이터셋으로 학습된 AI";

  return (
    <section
      className={[
        "flex flex-col gap-9",
        isAI ? "translate-x-12" : "-translate-x-5 translate-y-9",
      ].join(" ")}
    >
      <div className="rounded-md text-2xl font-semibold flex items-center justify-center py-2 text-white px-7 w-fit bg-[rgba(255,255,255,0.15)]">
        {title}
      </div>
      <div className="bg-gray-200 w-91 h-108 rounded-2xl" />
      <div
        className={[
          "p-[1px] box-border rounded-[12px] bg-gradient-to-r from-[#FFFFFF] to-[#3C40C1] w-95",
          isAI ? "translate-x-15 -translate-y-3" : "-translate-x-35",
        ].join(" ")}
      >
        <div
          className="flex justify-center items-center px-4 py-6 rounded-xl bg-[#151515] text-white text-2xl font-semibold leading-[36px]"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}

export default TechContainer;
