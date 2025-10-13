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

  const img = imageMap[category];

  const reverseLayout =
    category === "Monitoring" || category === "Social Media";

  return (
    <section
      className={`flex gap-45 ${reverseLayout ? "flex-row-reverse" : ""}`}
    >
      {img && (
        <img
          src={img}
          alt={`${category} 이미지`}
          className="object-contain w-115 h-90"
        />
      )}
      <div className="flex flex-col justify-center text-white gap-7">
        <CategoryBox category={category} />
        <p className="text-4xl font-semibold">{title}</p>
        <p
          className="text-2xl font-semibold leading-[1.5]"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}

export default ServiceContainer;
