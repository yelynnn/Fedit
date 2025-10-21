import CategoryBox from "./CategoryBox";
import type { ContainerProps } from "./ServiceContainer";
import monitorBg from "@/assets/landing/monitorBg.svg";
import analysisBg from "@/assets/landing/analysisBg.svg";
import snsBg from "@/assets/landing/snsBg.svg";

function FeatureContainer({ category, title, content }: ContainerProps) {
  const bgMap: Record<string, string> = {
    "상품 모니터링": monitorBg,
    "색상 ∙ 유형 ∙ 키워드 분석": analysisBg,
    "SNS ∙ 매거진 분석": snsBg,
  };
  const bg = bgMap[category];

  return (
    <div
      className="flex flex-col items-center justify-center w-full text-white bg-center bg-no-repeat bg-cover h-125 md:h-175 sm:w-120"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <CategoryBox category={category} />
      <p
        className="text-2xl md:text-[32px] font-semibold mt-9 mb-19 md:mb-30 text-center"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p
        className="break-keep md:text-xl font-semibold leading-6 md:leading-[30px] text-center"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

export default FeatureContainer;
