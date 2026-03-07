import RunwayContainer from "@/components/runway/RunwayContainer";
import RunwayBox from "@/components/runway/RunwayBox"; // 브랜드별 목록용
import { Icon } from "@iconify/react";
import React from "react";

const TOTAL_RUNWAY_DATA = {
  season: "2025 Spring/Summer",
  // 1. 상단 전반적 분석용 (시즌 요약)
  overall: {
    brand: "2025 S/S Trend",
    insight:
      "2025 SS는 과시 대신 여백, 구조보다 유연함으로 돌아선 시즌이다. 럭셔리는 일상을 품으며, 입는 순간 완성되는 세련됨을 새 기준으로 제시했다.",
    magazine: [
      { name: "vogue", magazine_url: "https://vogue.com" },
      { name: "elle", magazine_url: "https://elle.com" },
      { name: "w", magazine_url: "https://wkorea.com" },
      { name: "bazaar", magazine_url: "https://harpersbazaar.co.kr" },
    ],
    point_color: [
      { name: "피날레 레드", hex: "#FF3B30" },
      { name: "코발트 블루", hex: "#0047BB" },
      { name: "헌터 그린", hex: "#355E3B" },
      { name: "에그플랜트", hex: "#4E3244" },
      { name: "스톤 그레이", hex: "#8E8E93" },
      { name: "슬레이트 그레이", hex: "#636366" },
    ],
    color_insight: "뉴트럴 기반에 피날레에서 '한 번의 강렬한 색'을 더한 구성.",
    texture: [
      {
        image_url: "https://placehold.co/100x100?text=Texture1",
        name: "경량 트위드",
        detail: "프린지/크러시드 가공",
      },
      {
        image_url: "https://placehold.co/100x100?text=Texture2",
        name: "시어 실크",
        detail: "반투명 레이어링",
      },
      {
        image_url: "https://placehold.co/100x100?text=Texture3",
        name: "워시드 레더",
        detail: "빈티지 가공 테스크쳐",
      },
      {
        image_url: "https://placehold.co/100x100?text=Texture4",
        name: "스트레치 저지",
        detail: "유연한 드레이핑",
      },
    ],
    apply_point: [
      "수트 셋업: 크롭 재킷 + 로우슬렁 팬츠 구성으로 출근용 캡슐 제안.",
      "스커트 라인: 미디 기장 고정, 슬링키 실크·저지 혼방으로 착용감 강화.",
      "트위드 라인: 썸머 트위드(얇은 위사·스트레치사)로 경량화, 세트/단품 병행.",
      "핏 조정: 어깨 드롭 + 세미 크롭 비율로 국내 체형 대응.",
    ],
    items: Array.from({ length: 6 }).map((_, i) => ({
      image_url: `https://picsum.photos/400/600?random=overall_${i}`,
      name: "트렌드 키 아이템 " + (i + 1),
      detail: "2025 SS 시즌의 핵심 실루엣을 반영한 디자인 제안.",
    })),
  },

  // 2. 브랜드별 상세 데이터 (RunwayBox 탭 전환용)
  brands: [
    {
      id: "channel",
      name: "Channel",
      subTitle: "Virginie Viard 파리지앵 모던 클래식",
      description:
        "샤넬의 상징적인 트위드와 진주 디테일은 여전히 존재하지만, 이전보다 훨씬 가볍고 실용적인 방향으로 재해석되었습니다. 루즈한 재킷 실루엣과 미니 스커트가 어우러지며 경쾌한 리듬을 형성합니다.",
      points: [
        "경량화된 트위드 소재로 봄 시즌 대응",
        "미니 실루엣과 로우라이즈 스커트 강조",
        "펄과 시어 소재 믹스로 페미닌 무드",
        "클래식 디테일의 현대적 재해석",
      ],
      insight:
        "전통적인 트위드 하우스의 정체성을 유지하면서도 Z세대를 겨냥한 짧은 기장감과 가벼운 터치감이 돋보이는 컬렉션.",
      magazine: [
        { name: "vogue", magazine_url: "https://vogue.com" },
        { name: "w", magazine_url: "https://wkorea.com" },
      ],
      point_color: [
        { name: "피날레 레드", hex: "#FF3B30" },
        { name: "아이보리", hex: "#F5F5F0" },
        { name: "클래식 블랙", hex: "#000000" },
        { name: "네이비", hex: "#000080" },
        { name: "피날레 레드", hex: "#FF3B30" },
        { name: "아이보리", hex: "#F5F5F0" },
        { name: "클래식 블랙", hex: "#000000" },
        { name: "네이비", hex: "#000080" },
      ],
      color_insight: "모노톤 베이스에 샤넬 특유의 강렬한 레드를 포인트로 사용.",
      texture: [
        {
          image_url: "https://placehold.co/100x100?text=CH1",
          name: "썸머 트위드",
          detail: "얇은 위사 가공",
        },
        {
          image_url: "https://placehold.co/100x100?text=CH2",
          name: "진주 자수",
          detail: "수작업 디테일",
        },
      ],
      apply_point: [
        "크롭 트위드 재킷과 로우라이즈 데님 매치 제안",
        "실크 리본을 활용한 헤어 액세서리 포인트",
      ],
      items: Array.from({ length: 6 }).map((_, i) => ({
        image_url: `https://picsum.photos/400/600?random=ch_${i}`,
        name: i % 2 === 0 ? "크롭 트위드 재킷" : "트위드 미니 드레스",
        detail: "샤넬의 아이코닉한 소재를 현대적인 기장으로 변주한 룩.",
      })),
    },
    {
      id: "miumiu",
      name: "Miu Miu",
      subTitle: "Miuccia Prada 유스풀 프레피 룩",
      description:
        "이번 시즌 미우미우는 기능성과 미학의 경계를 허무는 실험적인 레이어링을 선보였습니다. 스포티한 나일론 소재와 섬세한 레이스를 결합하여 반전 있는 스타일을 제안합니다.",
      points: [
        "유틸리티 포켓과 기능성 소재 활용",
        "극단적인 로우라이즈와 크롭 탑의 조화",
        "빈티지한 가죽 워싱 디테일",
        "컬러풀한 삭스와 슈즈 매칭",
      ],
      insight:
        "완벽하지 않은 것에서 오는 아름다움, '걸리시함'과 '스포티함'의 경계에서 탄생한 새로운 프레피 스타일.",
      magazine: [
        { name: "elle", magazine_url: "https://elle.com" },
        { name: "bazaar", magazine_url: "https://harpersbazaar.co.kr" },
      ],
      point_color: [
        { name: "머드 브라운", hex: "#70543E" },
        { name: "더스티 블루", hex: "#8DA3B3" },
        { name: "카키 그린", hex: "#4B5320" },
        { name: "페일 핑크", hex: "#FADADD" },
      ],
      color_insight:
        "빈티지한 어스톤(Earth Tone) 위주의 차분하면서도 반항적인 컬러웨이.",
      texture: [
        {
          image_url: "https://placehold.co/100x100?text=MM1",
          name: "워시드 레더",
          detail: "크러시드 이펙트",
        },
        {
          image_url: "https://placehold.co/100x100?text=MM2",
          name: "나일론 태피터",
          detail: "테크니컬 소재",
        },
      ],
      apply_point: [
        "오버사이즈 카디건과 마이크로 팬츠의 극단적 비율 제안",
        "로고 밴딩을 노출시킨 레이어링 스타일링",
      ],
      items: Array.from({ length: 6 }).map((_, i) => ({
        image_url: `https://picsum.photos/400/600?random=mm_${i}`,
        name: i % 2 === 0 ? "유틸리티 레더 재킷" : "나일론 마이크로 스커트",
        detail: "미우미우 특유의 반항적인 소녀미를 담은 핵심 룩.",
      })),
    },
    // ... 프라다, 디올 등도 위와 같은 형식으로 추가 가능
  ],
};

function RunwayPage() {
  return (
    <div className="min-h-screen px-16 mx-auto">
      <div className="mb-2">
        <h1 className="text-[28px] font-semibold text-[#111] tracking-tight">
          Fashion Week Runway Analysis
        </h1>
        <p className="text-[#6F7173] text-base font-semibold mt-2">
          주요 브랜드 런웨이 비교 분석 & 시즌 트렌드 인사이트
        </p>
      </div>

      <div className="w-full bg-[#242628] rounded-lg px-6 py-3 flex items-center justify-between mt-5 cursor-pointer hover:bg-[#1a1a1a] transition-colors">
        <div className="flex items-center gap-9">
          <span className="text-white text-[14px] font-medium">
            Season Select
          </span>
          <span className="text-base font-semibold text-white">
            {TOTAL_RUNWAY_DATA.season}
          </span>
        </div>
        <Icon icon="ph:caret-down-bold" className="w-5 h-5 text-white" />
      </div>

      <div className="w-full h-[1px] bg-[#E4E4E4] my-6" />

      {/* 첫 번째: 전반적인 시즌 분석 (RunwayContainer) */}
      <section className="mb-20">
        <RunwayContainer data={TOTAL_RUNWAY_DATA.overall} />
      </section>

      {/* 두 번째: 브랜드별 상세 목록 (RunwayBox) */}
      <section className="mb-20">
        <RunwayBox brands={TOTAL_RUNWAY_DATA.brands} />
      </section>
    </div>
  );
}

export default RunwayPage;
