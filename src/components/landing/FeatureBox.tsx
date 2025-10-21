import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import FeatureContainer from "./FeatureContainer";

function FeatureBox() {
  return (
    <section className="w-full">
      <div className="flex-col hidden sm:flex sm:flex-row">
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
      </div>

      <div className="block sm:hidden">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          speed={800}
          pagination={{ clickable: true }}
          loop={true}
          className="w-full"
        >
          <SwiperSlide>
            <FeatureContainer
              category="상품 모니터링"
              title="일하는 방법을 빠르게<br/> 바꿉니다."
              content="수작업으로 정리하던 자료 없이,<br/>경쟁사 분석부터 키컬러 트렌드까지<br/>한 곳에서 확인하며 기획의 본질에 집중하세요."
            />
          </SwiperSlide>
          <SwiperSlide>
            <FeatureContainer
              category="색상 ∙ 유형 ∙ 키워드 분석"
              title="AI로 데이터를 쉽게<br/> 정리해줍니다."
              content="브랜드별 트렌드 변화를 시각화해<br/> 불필요한 데이터 해석 과정을 줄이고,<br/> 핵심 인사이트로 기획의 효율을 높여보세요."
            />
          </SwiperSlide>
          <SwiperSlide>
            <FeatureContainer
              category="SNS ∙ 매거진 분석"
              title="트렌드를 먼저 정확하게<br/> 예측합니다."
              content="SNS와 매거진 데이터를 분석해<br/> 지금 떠오르는 무드와 룩을 한눈에 읽고,<br/> 트렌드의 흐름을 브랜드만의 시선으로 기획에 담아보세요."
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </section>
  );
}

export default FeatureBox;
