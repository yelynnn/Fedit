function QuestionBox({ text }: { text: string }) {
  return (
    <div
      className="border-box inline-flex px-10 py-4 justify-center items-center gap-[10px] rounded-full
        bg-[linear-gradient(180deg,#A7A7A7_2.4%,#C8C8C8_5.29%,#F2F2F2_30.77%,#FFF_100%)]
        shadow-[0_0_11.1px_rgba(255,255,255,0.70),0_-26px_4px_rgba(255,255,255,0.25)_inset,0_9px_4px_rgba(255,255,255,0.50)_inset]
        text-[#151515] font-semibold text-2xl leading-8
      "
    >
      {text}
    </div>
  );
}

export default QuestionBox;
