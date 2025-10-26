import CategoryBox from "./CategoryBox";
import marketImg from "@/assets/landing/marketImg.svg";
import monitoringImg from "@/assets/landing/monitoringImg.svg";
import socialMediaImg from "@/assets/landing/socialMediaImg.svg";
import analysisImg from "@/assets/landing/analysisImg.svg";

import smMarketImg from "@/assets/landing/smMarketImg.svg";
import smMonitoringImg from "@/assets/landing/smMonitoringImg.svg";
import smSocialMediaImg from "@/assets/landing/smSocialMediaImg.svg";
import smAnalysisImg from "@/assets/landing/smAnalysisImg.svg";

export type ContainerProps = {
  category: string;
  title: string;
  content: string;
};

function ServiceContainer({ category, title, content }: ContainerProps) {
  const imageMap: Record<string, { sm: string; md: string }> = {
    "Market Trends": { sm: smMarketImg, md: marketImg },
    Monitoring: { sm: smMonitoringImg, md: monitoringImg },
    "Product Analysis": { sm: smAnalysisImg, md: analysisImg },
    "Social Media": { sm: smSocialMediaImg, md: socialMediaImg },
  };

  const reverseLayout =
    category === "Monitoring" || category === "Social Media";

  const selectedImg = imageMap[category];

  return (
    <section
      className={`flex sm:justify-around flex-col gap-5 sm:gap-10 md:gap-15 xl:gap-45 ${
        reverseLayout ? "sm:flex-row-reverse" : "sm:flex-row"
      }`}
    >
      {selectedImg && (
        <picture>
          <source srcSet={selectedImg.sm} media="(max-width: 767px)" />
          <img
            src={selectedImg.md}
            alt={`${category} 이미지`}
            className="flex-none object-contain w-auto h-auto shrink-0"
          />
        </picture>
      )}
      <div className="flex flex-col justify-center gap-2 text-white md:gap-7">
        <CategoryBox category={category} />
        <p className="text-xl font-semibold md:text-4xl">{title}</p>
        <p
          className="md:text-2xl font-semibold leading-6 md:leading-[1.5]"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}

export default ServiceContainer;
