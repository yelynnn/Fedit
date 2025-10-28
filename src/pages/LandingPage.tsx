import logo from "@/assets/logo/whiteLogo.png";
import outlineLogo from "@/assets/logo/outlineLogo.png";
import silverLogo from "@/assets/logo/silverLogo.svg";
import smSilverLogo from "@/assets/logo/smSilverLogo.svg";
import questionFrame from "@/assets/landing/questionFrame.svg";
import closeBar from "@/assets/landing/closeBar.svg";
import eclipseFrame from "@/assets/landing/eclipseFrame.svg";
import rectangle from "@/assets/landing/rectangleBg.svg";
import CategoryBox from "@/components/landing/CategoryBox";
import roundLine from "@/assets/landing/roundLine.svg";
import gradationFrame from "@/assets/landing/gradationFrame.svg";
import fashionAI from "@/assets/landing/FashionAIImg.svg";
import ServiceContainer from "@/components/landing/ServiceContainer";
import TechContainer from "@/components/landing/TechContainer";
import { useNavigate } from "react-router-dom";
import FeatureBox from "@/components/landing/FeatureBox";
import ReviewContainer from "@/components/landing/ReviewContainer";
import QuestionContainer from "@/components/landing/QuestionContainer";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-auto hide-scrollbar min-h-screen bg-[#151515] flex flex-col pb-46">
      <header className="flex items-center justify-between px-12 py-4">
        <img
          onClick={() => navigate("/")}
          src={logo}
          alt="fedit icon"
          className="h-8"
        />
        <button
          onClick={() => navigate("/ask")}
          className="hidden leading-6 cursor-pointer md:flex rounded-lg items-center justify-center bg-white w-fit h-fit px-3 py-2 text-[#242628] text-sm font-semibold"
        >
          FEDIT 문의하기
        </button>
      </header>
      <section className="relative flex flex-col items-center justify-center overflow-hidden md:mt-35 mt-22">
        <div className="flex flex-col items-center justify-center gap-3 mb-8 font-semibold md:gap-6 sm:mb-27">
          <span className="text-3xl sm:text-5xl text-white leading-9 sm:leading-[65px]">
            패션을 보는 눈
          </span>
          <div className="relative inline-block">
            <img
              src={rectangle}
              alt="rectangle"
              className="absolute inset-0 hidden pointer-events-none sm:block -left-2 sm:-left-8 sm:-top-4 -top-2 w-31 sm:w-55"
            />
            <span className="relative text-3xl font-semibold text-white sm:text-black sm:px-6 sm:text-5xl">
              데이터
            </span>
            <span className="text-3xl sm:text-5xl text-white leading-9 sm:leading-[65px]">
              를 통해 선택하다.
            </span>
          </div>

          <p className="break-keep px-12 text-center sm:text-2xl text-[#888A8C] leading-6 sm:leading-9">
            국내 브랜드 데이터를 전략으로 바꾸는 유일한 패션 트렌드 솔루션
          </p>
        </div>
        <div className="z-10 flex gap-3 mb-47 sm:mb-64">
          <button
            onClick={() => navigate("/ask")}
            className="cursor-pointer flex rounded-full items-center justify-center bg-white sm:w-54 w-28 h-8 sm:h-13 text-[#242628] sm:text-xl font-semibold"
          >
            개인 플랜 문의
          </button>
          <button
            onClick={() => navigate("/ask")}
            className="flex items-center justify-center h-8 font-semibold text-white bg-transparent border border-white rounded-full cursor-pointer sm:text-xl sm:w-54 w-28 sm:h-13"
          >
            기업 플랜 문의
          </button>
        </div>
        <img
          src={outlineLogo}
          alt="outline logo"
          className="absolute -translate-x-1/2 pointer-events-none top-40 sm:top-72 left-1/2 sm:left-10 sm:translate-x-0 w-86 sm:w-158"
        />
        <img
          src={outlineLogo}
          alt="outline logo"
          className="absolute hidden pointer-events-none lg:block -right-70 top-72 w-158"
        />
      </section>

      <section className="mx-4 md:mx-20 mb-62">
        <div className="relative w-full">
          <img
            src={questionFrame}
            alt="questionFrame"
            className="invisible w-full h-auto opacity-0 md:opacity-100 md:visible"
          />

          <div className="absolute inset-0 z-10 flex flex-col items-center text-white top-15 lg:top-27">
            <p
              className="mb-3 sm:mb-2 text-center font-semibold 
                   text-[clamp(16px,2.2vw,24px)]
                   bg-[linear-gradient(0deg,#FFF_31.25%,#6A6A6A_100%)] 
                   bg-clip-text text-transparent break-keep"
            >
              패션 업계에서 일하는
            </p>

            <p
              className="mb-10 sm:mb-15 text-center text-white font-semibold break-keep
                    leading-[1.35] md:leading-[60px]
                    text-2xl sm:text-[clamp(22px,5vw,40px)] w-full max-w-[90%]"
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

            <section className="relative flex justify-center w-full lg:justify-between md:px-16">
              <img
                src={closeBar}
                alt="closeBar"
                className="hidden lg:block h-[100px] md:h-89 w-14"
              />
              <QuestionContainer />
              <img
                src={closeBar}
                alt="closeBar"
                className="hidden lg:block h-[100px] md:h-89 w-14 rotate-180"
              />
            </section>
            <div className="absolute hidden sm:block -bottom-73 sm:-bottom-32 md:-bottom-13 lg:-bottom-20 flex flex-col justify-center items-center text-center w-auto px-6 lg:px-30 py-4 lg:py-8 rounded-xl lg:rounded-[20px] bg-[radial-gradient(50%_50%_at_50%_50%,#FFF_65.87%,#F3F3F3_100%)] shadow-[0_0_37px_rgba(255,255,255,0.5)] lg:text-[32px] font-semibold leading-6 lg:leading-[50px] text-[#151515] ">
              국내 브랜드 데이터를 전략으로 바꾸는 <br />
              <span className="whitespace-nowrap">
                유일한 패션 트렌드 솔루션<span className="mx-2">—</span>
                <span className="text-[#242628] font-extrabold">FEDIT</span>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col items-center w-full mt-33 sm:mt-0 mb-23">
        <picture>
          <source srcSet={smSilverLogo} media="(max-width: 639px)" />
          <img src={silverLogo} alt="fedit icon" />
        </picture>{" "}
        <div className="-translate-y-7 sm:-translate-y-12">
          <CategoryBox category="Features" />
        </div>
        <div className="mb-6 sm:mb-8 h-12 w-full flex items-center justify-center flex-shrink-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0)_100%)] text-2xl sm:text-[40px] font-semibold leading-9 sm:leading-[36px] text-white">
          FEDIT의 서비스
        </div>
        <p className="sm:text-2xl text-center text-[#888A8C] leading-6 sm:leading-9 mb-15 sm:mb-39">
          브랜드 데이터를 분석해, 한발 앞선 트렌드 전략을 완성합니다.
        </p>
        <div className="flex flex-col gap-9 sm:gap-22">
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
          className="absolute inset-0 object-cover object-top w-full h-full"
        />

        <div className="relative flex flex-col items-center pb-20 text-white pt-30 sm:pt-40">
          <CategoryBox category="Tech" />
          <h2 className="text-2xl sm:text-[40px] font-semibold my-6 sm:my-7">
            AI-Based 분석
          </h2>

          <p className="sm:text-2xl text-[#888A8C] leading-6 sm:leading-9 mb-15 text-center break-keep">
            보세부터 명품까지 다양한 패션 제품으로 훈련된
            <br /> 패션업계 특화 AI로 정확하게 분석하고 제안합니다.
          </p>

          <div className="flex flex-col items-center w-full gap-11 md:gap-8 md:flex-row md:justify-around xl:justify-center">
            <TechContainer
              title="패션 특화 데이터셋으로 학습된 AI"
              content="실무에서 확인하는 세부 태깅 값 패션<br/> 특화된 라벨링 기술"
            />
            <img
              src={fashionAI}
              alt="fashionAI"
              className="hidden -translate-y-10 xl:block w-118"
            />
            <TechContainer
              title="AI 기반 개인화 패션 데이터 분석 "
              content="MD,디자이너 사용자별 다른 상황과 니즈에 맞는 데이터와 분석을 제공"
            />
          </div>
        </div>
      </section>
      <section className="flex flex-col">
        <div className="flex flex-col gap-[14px] items-center mb-7 sm:mb-14">
          <p
            className="mb-2 text-center font-semibold 
                   text-[clamp(16px,2.2vw,35px)]
                   bg-[linear-gradient(0deg,#FFF_31.25%,#6A6A6A_100%)] 
                   bg-clip-text text-transparent break-keep"
          >
            거시적인 시장부터
          </p>
          <div className="bg-white rounded-full size-2 sm:size-3" />
          <div className="bg-white rounded-full size-3 sm:size-4" />
          <p className="text-2xl font-semibold sm:text-[35px] text-white">
            경쟁사까지
          </p>
        </div>
        <img
          src={roundLine}
          alt="roundLine"
          className="hidden object-cover w-full h-auto sm:block"
        />
        <p
          className="mb-10 sm:mb-21 text-center text-white font-semibold break-keep
              leading-7 sm:leading-[75px] text-xl
              sm:text-[clamp(20px,5vw,40px)]"
        >
          실시간 모니터링하며
          <br />
          <span className="relative inline-block">
            <span
              className="hidden sm:block absolute bottom-3 left-0 sm:w-full h-[14px] md:h-[18px] rounded-[20px]
     bg-[linear-gradient(90deg,#D9D9D9_0%,#151515_100%)]"
            />
            <span className="relative z-10">패션 기획의 새로운 기준</span>
          </span>
          을 제시합니다.
        </p>
      </section>
      <FeatureBox />
      <ReviewContainer />
      <section className="relative flex flex-col items-center justify-center w-full mt-40 mb-45 md:mt-0">
        <div className="flex justify-center w-full">
          <img
            src={gradationFrame}
            alt="gradationFrame"
            className="hidden lg:block w-[90%] h-[230px] object-fill lg:h-auto"
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <img src={logo} alt="fedit icon" className="mb-8 h-17 sm:h-22" />
          <p className="mb-13 text-center text-white font-semibold leading-9 sm:leading-[60px] text-2xl sm:text-[40px]">
            트렌드의 방향이 명확해지는 순간
            <br /> 바로 여기, FEDIT에서.
          </p>
          <div className="z-10 flex gap-3">
            <button
              onClick={() => navigate("/ask")}
              className="cursor-pointer flex rounded-full items-center justify-center bg-white sm:w-54 w-28 h-8 sm:h-13 text-[#242628] sm:text-xl font-semibold"
            >
              개인 플랜 문의
            </button>
            <button
              onClick={() => navigate("/ask")}
              className="flex items-center justify-center h-8 font-semibold text-white bg-transparent border border-white rounded-full cursor-pointer sm:text-xl sm:w-54 w-28 sm:h-13"
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
