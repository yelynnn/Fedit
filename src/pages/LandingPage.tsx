import logo from "@/assets/logo/whiteLogo.png";
import outlineLogo from "@/assets/logo/outlineLogo.png";
import silverLogo from "@/assets/logo/silverLogo.svg";
import questionFrame from "@/assets/landing/questionFrame.svg";
import closeBar from "@/assets/landing/closeBar.svg";
import eclipseFrame from "@/assets/landing/eclipseFrame.svg";
import rectangle from "@/assets/landing/rectangleBg.svg";
import QuestionBox from "@/components/landing/QuestionBox";
import CategoryBox from "@/components/landing/CategoryBox";
import roundLine from "@/assets/landing/roundLine.svg";
import gradationFrame from "@/assets/landing/gradationFrame.svg";
import fashionAI from "@/assets/landing/FashionAIImg.svg";
import ServiceContainer from "@/components/landing/ServiceContainer";
import TechContainer from "@/components/landing/TechContainer";
import FeatureContainer from "@/components/landing/FeatureContainer";
import ReviewBox from "@/components/landing/ReviewBox";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-auto hide-scrollbar min-h-screen bg-[#151515] flex flex-col pb-46">
      <header className="flex items-center justify-between px-12 py-4">
        <img
          onClick={() => navigate("/landing")}
          src={logo}
          alt="fedit icon"
          className="h-8"
        />
        <button
          onClick={() => navigate("/ask")}
          className="leading-6 cursor-pointer flex rounded-lg items-center justify-center bg-white w-fit h-fit px-3 py-2 text-[#242628] text-sm font-semibold"
        >
          FEDIT 문의하기
        </button>
      </header>
      <section className="relative flex flex-col items-center justify-center overflow-hidden mt-35">
        <div className="flex flex-col items-center justify-center gap-6 font-semibold mb-27">
          <span className="text-5xl text-white leading-[65px]">
            패션을 보는 눈
          </span>
          <div className="relative inline-block">
            <img
              src={rectangle}
              alt="rectangle"
              className="absolute inset-0 pointer-events-none -left-8 -top-4"
            />
            <span className="relative px-6 text-5xl font-semibold text-black">
              데이터
            </span>
            <span className="text-5xl text-white leading-[65px]">
              를 통해 선택하다.
            </span>
          </div>

          <p className="text-2xl text-[#888A8C] leading-9">
            국내 브랜드 데이터를 전략으로 바꾸는 유일한 패션 트렌드 솔루션
          </p>
        </div>
        <div className="z-10 flex gap-3 mb-64">
          <button
            onClick={() => navigate("/ask")}
            className="cursor-pointer flex rounded-full items-center justify-center bg-white w-54 h-13 text-[#242628] text-xl font-semibold"
          >
            개인 플랜 문의
          </button>
          <button
            onClick={() => navigate("/ask")}
            className="flex items-center justify-center text-xl font-semibold text-white bg-transparent border border-white rounded-full cursor-pointer w-54 h-13"
          >
            기업 플랜 문의
          </button>
        </div>
        <img
          src={outlineLogo}
          alt="outline logo"
          className="absolute pointer-events-none top-72 left-10 w-158"
        />
        <img
          src={outlineLogo}
          alt="outline logo"
          className="absolute pointer-events-none -right-70 top-65 w-158"
        />
      </section>

      <section className="mx-4 md:mx-20 mb-62">
        <div className="relative w-full">
          <img
            src={questionFrame}
            alt="questionFrame"
            className="block w-full h-auto"
          />

          <div className="absolute inset-0 z-10 flex flex-col items-center text-white top-27">
            <p
              className="mb-2 text-center font-semibold 
                   text-[clamp(16px,2.2vw,24px)]
                   bg-[linear-gradient(0deg,#FFF_31.25%,#6A6A6A_100%)] 
                   bg-clip-text text-transparent break-keep"
            >
              패션 업계에서 일하는
            </p>

            <p
              className="mb-15 text-center text-white font-semibold break-keep
                    leading-[1.35] md:leading-[60px]
                    text-[clamp(22px,5vw,40px)] w-full max-w-[90%]"
            >
              우리는 평소에 어떤 것이 궁금하고,
              <br />
              <span className="relative inline-block">
                <span
                  className="absolute bottom-0 left-0 w-full h-[14px] md:h-[18px] rounded-[20px]
                       bg-[linear-gradient(90deg,#D9D9D9_0%,#151515_100%)]"
                />
                <span className="relative z-10">기획∙디자인에</span>
              </span>{" "}
              어떤 것이 필요할까요?
            </p>

            <section className="flex justify-between w-full md:px-16">
              <img
                src={closeBar}
                alt="closeBar"
                className="h-[100px] md:h-89 w-14"
              />
              <article className="flex flex-col justify-center gap-6">
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
              </article>
              <img
                src={closeBar}
                alt="closeBar"
                className="h-[100px] md:h-89 w-14 rotate-180"
              />
            </section>
            <div className="absolute -bottom-20 flex flex-col justify-center items-center text-center w-auto px-30 py-8 rounded-[20px] bg-[radial-gradient(50%_50%_at_50%_50%,#FFF_65.87%,#F3F3F3_100%)] shadow-[0_0_37px_rgba(255,255,255,0.5)] text-[32px] font-semibold leading-[50px] text-[#151515] ">
              국내 브랜드 데이터를 전략으로 바꾸는 <br />
              <span className="whitespace-nowrap">
                유일한 패션 트렌드 솔루션<span className="mx-2">—</span>
                <span className="text-[#242628] font-extrabold">FEDIT</span>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col items-center w-full mb-23">
        <img src={silverLogo} alt="fedit icon" className="w-147 mb-15" />
        <CategoryBox category="Features" />
        <div className="my-8 h-12 w-full flex items-center justify-center flex-shrink-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0)_100%)] text-[40px] font-semibold leading-[36px] text-white">
          FEDIT의 서비스
        </div>
        <p className="text-2xl text-[#888A8C] leading-9 mb-39">
          브랜드 데이터를 분석해, 한발 앞선 트렌드 전략을 완성합니다.
        </p>
        <div className="flex flex-col gap-22">
          <ServiceContainer
            category="Market Trends"
            title="시장 트렌드 분석"
            content="패션 런웨이,매거진부터 빅데이터까지 함께 분석해<br/> 예측하는 시장 트렌드"
          />
          <ServiceContainer
            category="Monitoring"
            title="시장 모니터링"
            content="보세부터 명품까지 국내외 브랜드 실시간 모니터링<br/>주요 컬렉션 및 시장 움직임 추적"
          />
          <ServiceContainer
            category="Product Analysis"
            title="디테일 분석"
            content="아이템 별 색상, 유형, 키워드 추출 통한 비교 데이터<br/> 제안"
          />
          <ServiceContainer
            category="Social Media"
            title="SNS 분석"
            content="급상승 유형·컬러 실시간 분석<br/> 해외 선행 트렌드 감지 및 로컬화된 인사이트 제공"
          />
        </div>
      </section>
      <section className="relative w-full">
        <img
          src={eclipseFrame}
          alt="eclipse"
          className="object-cover w-full h-auto"
        />
        <div className="absolute inset-0 flex flex-col items-center text-white top-40">
          <CategoryBox category="Tech" />
          <h2 className="text-[40px] font-semibold my-7">AI-Based 분석</h2>
          <p className="text-2xl text-[#888A8C] leading-9 mb-15">
            보세부터 명품까지 다양한 패션 제품으로 훈련된
            <br /> 패션업계 특화 AI로 정확하게 분석하고 제안합니다.
          </p>
          <div className="flex justify-center w-full">
            <TechContainer
              title="패션 특화 데이터셋으로 학습된 AI"
              content="실무에서 확인하는 세부 태깅 값 패션<br/> 특화된 라벨링 기술"
            />
            <img
              src={fashionAI}
              alt="fashionAI"
              className="-translate-y-17 w-118"
            />
            <TechContainer
              title="AI 기반 개인화 패션 데이터 분석 "
              content="MD,디자이너 사용자별 다른 상황과 니즈에 맞는 데이터와 분석을 제공"
            />
          </div>
        </div>
      </section>
      <section className="flex flex-col">
        <div className="flex flex-col gap-[14px] items-center mb-14">
          <p
            className="mb-2 text-center font-semibold 
                   text-[clamp(16px,2.2vw,35px)]
                   bg-[linear-gradient(0deg,#FFF_31.25%,#6A6A6A_100%)] 
                   bg-clip-text text-transparent break-keep"
          >
            거시적인 시장부터
          </p>
          <div className="bg-white rounded-full size-3" />
          <div className="bg-white rounded-full size-4" />
          <p className="font-semibold text-[35px] text-white">경쟁사까지</p>
        </div>
        <img
          src={roundLine}
          alt="roundLine"
          className="object-cover w-full h-auto"
        />
        <p
          className="mb-21 text-center text-white font-semibold break-keep
              leading-[75px]
              text-[clamp(22px,5vw,40px)]"
        >
          실시간 모니터링하며
          <br />
          <span className="relative inline-block">
            <span
              className="absolute bottom-0 left-0 w-full h-[14px] md:h-[18px] rounded-[20px]
                 bg-[linear-gradient(90deg,#D9D9D9_0%,#151515_100%)]"
            />
            <span className="relative z-10">패션 기획의 새로운 기준</span>
          </span>
          을 제시합니다.
        </p>
      </section>
      <section className="flex">
        <FeatureContainer
          category="상품 모니터링"
          title="일하는 방법을 빠르게<br/> 바꿉니다."
          content="수작업으로 정리하던 자료 없이,<br/>경쟁사 분석부터 키컬러 트렌드까지<br/>한 곳에서 확인하며 기획의 본질에 집중하세요."
        />
        <FeatureContainer
          category="색상 ∙ 유형 ∙ 키워드 분석"
          title="AI로 데이터를 쉽게<br/> 정리해줍니다."
          content="브랜드별 트렌드 변화를 시각화해<br/> 불필요한 데이터 해석 과정을 줄이고,<br/> 핵심 인사이트로 기획의 효율을 높여보세요."
        />
        <FeatureContainer
          category="SNS ∙ 매거진 분석"
          title="트렌드를 먼저 정확하게<br/> 예측합니다."
          content="SNS와 매거진 데이터를 분석해<br/> 지금 떠오르는 무드와 룩을 한눈에 읽고,<br/> 트렌드의 흐름을 브랜드만의 시선으로 기획에 담아보세요."
        />
      </section>
      <section className="flex flex-col items-center mt-50 mb-110">
        <CategoryBox category="Review" />
        <p className="mt-6 mb-26 text-center text-white font-semibold leading-[60px] text-[40px]">
          FEDIT 사용자가 직접 전하는
          <br /> 생생한 후기
        </p>
        <div className="grid grid-cols-1 gap-15 md:grid-cols-3">
          <ReviewBox
            title="SPA 브랜드 MD"
            content="시장 내 상품이 자동으로 정리돼 훨씬<br/> 수월해졌습니다. 트렌드를 빠르게<br/> 파악하고 스팟 상품을 디자인하는데<br/> 특히나 도움이 많이 되어서 좋아요."
          />
          <ReviewBox
            title="준명품 브랜드 MD"
            content="한 번에 시즌별 패션쇼부터 트렌드<br/> 검색어까지 전체 흐름을 볼 수 있어서<br/> 효율적입니다. 팀이랑 공유할 때 훨씬<br/> 수월해졌어요!"
          />
          <ReviewBox
            title="대기업 MD"
            content="시장조사, 트렌드 분석에서 FEDIT로<br/> 더 구체적인 경쟁사 조사를 할 수 있게<br/> 되었어요. 보고 싶은 데이터를 맞춤으로 만들어줘 앞으로가 더 기대됩니다."
          />
          <ReviewBox
            title="개인 브랜드 대표"
            content="단순히 ‘팔릴 것 같다’는 감이 아니라,<br/> FEDIT 데이터로 크로스 체크하고 확신 가지고 기획하는 느낌이 들어서 훨씬 만족하고 사용하고 있습니다."
          />
          <ReviewBox
            title="스포츠 브랜드 MD"
            content="그냥 잘 팔리는 상품을 넘어서, 시즌별 반복되는 패턴과 시장 맥락까지 이해할 수 있어 ‘리서치 파트너’ 같은 역할을 해주는 것 같아요!"
          />
          <ReviewBox
            title="여성 브랜드 디자이너"
            content="핀터레스트에서 아이템을 디깅하고 모으는 시간을 확실히 줄이면서 효율적으로 작업을 할 수 있게 되었습니다!"
          />
        </div>
      </section>
      <section className="relative flex flex-col items-center justify-center w-full">
        <img
          src={gradationFrame}
          alt="gradationFrame"
          className="block w-90% h-auto"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <img src={logo} alt="fedit icon" className="mb-8 h-22" />
          <p className="mb-13 text-center text-white font-semibold leading-[60px] text-[40px]">
            트렌드의 방향이 명확해지는 순간
            <br /> 바로 여기, FEDIT에서.
          </p>
          <div className="z-10 flex gap-3">
            <button
              onClick={() => navigate("/ask")}
              className="cursor-pointer flex rounded-full items-center justify-center bg-white w-54 h-13 text-[#242628] text-xl font-semibold"
            >
              개인 플랜 문의
            </button>
            <button
              onClick={() => navigate("/ask")}
              className="flex items-center justify-center text-xl font-semibold text-white bg-transparent border border-white rounded-full cursor-pointer w-54 h-13"
            >
              기업 플랜 문의
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
