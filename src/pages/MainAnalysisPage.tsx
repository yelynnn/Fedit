import BubbleChart from "@/components/chart/BubbleChart";
import MainKeywordBox from "@/components/main/MainKeywordBox";
import { MockKeywordData } from "@/data/mock/MockKeywordData";
import naverCloud from "@/data/mock/NaverCloudMockImg.png";
import topColor1 from "@/data/mock/MockColorImg1.png";
import topColor2 from "@/data/mock/MockColorImg2.png";
import DoubleChart from "@/components/chart/DoubleChart";
import ItemTrendBox from "@/components/main/ItemTrendBox";

function MainAnalysisPage() {
  const musinsaKeywords =
    MockKeywordData.find((item) => item.brand === "무신사")?.keywords || [];
  const wConceptKeywords =
    MockKeywordData.find((item) => item.brand === "W컨셉")?.keywords || [];
  const naverKeywords =
    MockKeywordData.find((item) => item.brand === "네이버")?.keywords || [];
  return (
    <div className="px-10 py-6 overflow-hidden">
      <section
        className="grid grid-cols-2 gap-6"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))",
        }}
      >
        <article className="flex flex-col">
          <header className="pl-4 mb-2 text-xl font-semibold leading-7">
            네이버 키워드
          </header>
          <div className="w-125 h-68 bg-[#F7F9FB] rounded-3xl border border-gray-200 p-3 items-center justify-center flex gap-5">
            <div className="overflow-hidden w-70 h-50 rounded-2xl">
              <img
                src={naverCloud}
                alt="네이버 클라우드"
                className="object-cover w-full h-full"
              />
            </div>
            <MainKeywordBox title="키워드 순위" keywords={naverKeywords} />
          </div>
        </article>
        <article className="flex flex-col">
          <header className="pl-4 mb-2 text-xl font-semibold leading-7">
            플랫폼 키워드
          </header>
          <div className="w-125 h-68 bg-[#F7F9FB] rounded-3xl border border-gray-200 p-3 items-center justify-center flex gap-5">
            <MainKeywordBox title="무신사" keywords={musinsaKeywords} />
            <MainKeywordBox title="W컨셉" keywords={wConceptKeywords} />
          </div>
        </article>
        <article className="flex flex-col">
          <header className="pl-4 mb-2 text-xl font-semibold leading-7">
            급상승 컬러
          </header>
          <div className="w-125 h-68 bg-[#F7F9FB] rounded-3xl border border-gray-200 pr-5 items-center justify-center flex">
            <BubbleChart />
            <div className="flex flex-col w-46">
              <img
                src={topColor1}
                alt="top_color1"
                className="max-w-full max-h-30"
              />
              <img
                src={topColor2}
                alt="top_color2"
                className="max-w-full max-h-30"
              />
            </div>
          </div>
        </article>
        <article className="flex flex-col">
          <header className="pl-4 mb-2 text-xl font-semibold leading-7">
            급상승 유형
          </header>
          <div className="w-125 h-68 bg-[#F7F9FB] rounded-3xl border border-gray-200 py-3 items-center justify-center">
            <DoubleChart />
          </div>
        </article>
      </section>
      <ItemTrendBox />
    </div>
  );
}

export default MainAnalysisPage;
