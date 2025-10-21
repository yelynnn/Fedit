import Marquee from "react-fast-marquee";
import QuestionBox from "./QuestionBox";

function QuestionContainer() {
  return (
    <article className="flex flex-col justify-center gap-6">
      <div className="flex-col justify-center hidden gap-6 md:flex">
        <div className="flex justify-center translate-x-10 gap-14">
          <QuestionBox text="트렌드 적용도를 높이고 싶어" />
          <QuestionBox text="누가 경쟁사 신상 좀 대신 정리해주면 좋겠다" />
        </div>

        <div className="flex justify-center gap-16 -translate-x-25">
          <QuestionBox text="내년 트렌드는 뭘까?" />
          <QuestionBox text="경쟁사는 요즘에 어떤 옷을 낼까?" />
        </div>

        <div className="flex justify-center translate-x-15 gap-18">
          <QuestionBox text="매출이 왜 낮을까?" />
          <QuestionBox text="우리 회사만의 맞춤 기획 대시보드가 필요해" />
        </div>
      </div>

      <div className="block overflow-visible md:hidden">
        <Marquee
          speed={40}
          gradient={false}
          pauseOnHover
          className="overflow-visible"
        >
          <div className="flex flex-col justify-center gap-6">
            <div className="flex justify-center translate-x-5 gap-14">
              <QuestionBox text="트렌드 적용도를 높이고 싶어" />
              <QuestionBox text="누가 경쟁사 신상 좀 대신 정리해주면 좋겠다" />
            </div>

            <div className="flex justify-center gap-16 -translate-x-25">
              <QuestionBox text="내년 트렌드는 뭘까?" />
              <QuestionBox text="경쟁사는 요즘에 어떤 옷을 낼까?" />
            </div>

            <div className="flex justify-center translate-x-15 gap-18">
              <QuestionBox text="매출이 왜 낮을까?" />
              <QuestionBox text="우리 회사만의 맞춤 기획 대시보드가 필요해" />
            </div>
          </div>
        </Marquee>
      </div>
    </article>
  );
}

export default QuestionContainer;
