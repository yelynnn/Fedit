import CategoryBox from "./CategoryBox";
import marketImg from "@/assets/landing/marketImg.svg";
import monitoringImg from "@/assets/landing/monitoringImg.svg";
import socialMediaImg from "@/assets/landing/socialMediaImg.svg";
import analysisImg from "@/assets/landing/analysisImg.svg";

export type ContainerProps = {
  category: string;
  title: string;
  content: string;
};

function ServiceContainer({ category, title, content }: ContainerProps) {
  const imageMap: Record<string, string> = {
    "Market Trends": marketImg,
    Monitoring: monitoringImg,
    "Product Analysis": analysisImg,
    "Social Media": socialMediaImg,
  };

  const reverseLayout =
    category === "Monitoring" || category === "Social Media";

  const src = imageMap[category];

  return (
    <section
      className={`flex sm:justify-around flex-col gap-5 sm:gap-10 md:gap-15 xl:gap-45 ${
        reverseLayout ? "sm:flex-row-reverse" : "sm:flex-row"
      }`}
    >
      {src && (
        <img
          src={src}
          alt={`${category} 이미지`}
          className="flex-none shrink-0 object-contain w-[335px] sm:w-[460px] h-auto"
        />
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
