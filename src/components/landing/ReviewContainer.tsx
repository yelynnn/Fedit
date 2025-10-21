import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import ReviewBox from "./ReviewBox";
import CategoryBox from "./CategoryBox";
import { useRef } from "react";

const reviews = [
  {
    title: "SPA 브랜드 MD",
    content:
      "시장 내 상품이 자동으로 정리돼 훨씬<br/> 수월해졌습니다. 트렌드를 빠르게<br/> 파악하고 스팟 상품을 디자인하는데<br/> 특히나 도움이 많이 되어서 좋아요.",
  },
  {
    title: "준명품 브랜드 MD",
    content:
      "한 번에 시즌별 패션쇼부터 트렌드<br/> 검색어까지 전체 흐름을 볼 수 있어서<br/> 효율적입니다. 팀이랑 공유할 때 훨씬<br/> 수월해졌어요!",
  },
  {
    title: "대기업 MD",
    content:
      "시장조사, 트렌드 분석에서 FEDIT로<br/> 더 구체적인 경쟁사 조사를 할 수 있게<br/> 되었어요. 보고 싶은 데이터를 맞춤으로 만들어줘 앞으로가 더 기대됩니다.",
  },
  {
    title: "개인 브랜드 대표",
    content:
      "단순히 ‘팔릴 것 같다’는 감이 아니라,<br/> FEDIT 데이터로 크로스 체크하고 확신 가지고 기획하는 느낌이 들어서 훨씬 만족하고 사용하고 있습니다.",
  },
  {
    title: "스포츠 브랜드 MD",
    content:
      "그냥 잘 팔리는 상품을 넘어서, 시즌별 반복되는 패턴과 시장 맥락까지 이해할 수 있어 ‘리서치 파트너’ 같은 역할을 해주는 것 같아요!",
  },
  {
    title: "여성 브랜드 디자이너",
    content:
      "핀터레스트에서 아이템을 디깅하고 모으는 시간을 확실히 줄이면서 효율적으로 작업을 할 수 있게 되었습니다!",
  },
];

function ReviewContainer() {
  const paginationRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="flex flex-col items-center mt-30 sm:mt-50 mb-37 sm:mb-110">
      <CategoryBox category="Review" />
      <p className="mt-3 sm:mt-6 mb-3 sm:mb-26 text-center text-white font-semibold leading-9 sm:leading-[60px] text-2xl sm:text-[40px]">
        FEDIT 사용자가 직접 전하는
        <br /> 생생한 후기
      </p>

      <div className="relative z-10 block w-full overflow-visible sm:hidden">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          loop
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          speed={700}
          onBeforeInit={(swiper) => {
            swiper.params.pagination = {
              el: paginationRef.current!,
              clickable: true,
            };
          }}
          className="relative w-full"
        >
          {reviews.map((r) => (
            <SwiperSlide key={r.title} className="!h-auto">
              <div className="flex justify-center">
                <ReviewBox title={r.title} content={r.content} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div
          ref={paginationRef}
          className="absolute z-50 -translate-x-1/2 pointer-events-auto left-1/2 -bottom-8"
        />
      </div>

      <div className="hidden grid-cols-1 gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3 md:gap-15px">
        {reviews.map((r) => (
          <ReviewBox key={r.title} title={r.title} content={r.content} />
        ))}
      </div>
    </section>
  );
}

export default ReviewContainer;
