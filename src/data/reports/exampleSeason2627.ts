import type { CustomerReport } from "@/types/Report";
// 많이 산 상의 TOP 10 — 무신사 원본 상품(상품번호, 대표 이미지 경로). 순위 순
const TOP_GOODS: [string, string][] = [
  ["2149254", "20210928/2149254/2149254_17138588137724_500.jpg"],
  ["3019653", "20230111/3019653/3019653_17887700644335_500.jpg"],
  ["3562068", "20230914/3562068/3562068_17150586229620_500.jpg"],
  ["996177", "20190327/996177/996177_17845258066104_500.jpg"],
  ["1144989", "20190905/1144989/1144989_17509081256971_500.jpg"],
  ["2375962", "20220222/2375962/2375962_1_500.jpg"],
  ["2034137", "20210719/2034137/2034137_17821170123912_500.jpg"],
  ["659554", "20171025/659554/659554_17253315273762_500.jpg"],
  ["1382658", "20200402/1382658/1382658_17048730367124_500.jpg"],
  ["1558847", "20200821/1558847/1558847_17303488335987_500.jpg"],
];
const top = (i: number) => ({
  img: `https://image.msscdn.net/images/goods_img/${TOP_GOODS[i][1]}`,
  url: `https://www.musinsa.com/products/${TOP_GOODS[i][0]}`,
});

// 예시 리포트(26/27 시즌 기획) — 실제 고객사 리포트 PDF(2026-11)의 숫자를 그대로 옮긴 1차 데이터.
// 고객사는 "A 브랜드"로 가리고, 자사 상품 사진·링크도 뺐다.
// 이름이 없는 칸은 PDF 에서도 비중만 표기된 칸이다.
// 비교 브랜드도 B·C·D·E 브랜드로 가리고, 브랜드별 SKU 수·비교 브랜드 상품 사진·링크·고유 상품명은 뺐다(브랜드를 짐작할 수 있어서).

const C = {
  black: "#1F1F1F",
  offwhite: "#EEE9E1",
  blue: "#5B7FB5",
  ochre: "#B9864A",
  red: "#B03A2E",
  neutral: "#C9BCAA",
  navy: "#26324D",
  white: "#FFFFFF",
  lightgray: "#C6C6C6",
  charcoal: "#3A3E46",
  mustard: "#C9A227",
  yellow: "#E3C33A",
  greige: "#B5A796",
  terracotta: "#B0613F",
  slate: "#4E6B95",
  green: "#4E7A50",
  denim: "#4A6A96",
  gray: "#9A9A9A",
  forest: "#3F5E40",
  taupe: "#9C8B79",
};

export const exampleSeason2627: CustomerReport = {
  id: "example-2627-season",
  title: "A 브랜드 시즌 기획 리포트",
  eyebrow: "FEDIT DATA REPORT · 26/27 SEASON PLANNING",
  publishedAt: "2026년 11월",
  ownBrand: "A 브랜드",
  compareBrands: ["B 브랜드", "C 브랜드", "D 브랜드", "E 브랜드"],
  basis: "무신사·29CM·W컨셉·자사몰 상품, 무신사 리뷰·구매 데이터, 플랫폼 검색어 기준",
  summary: [
    "색상: 블랙이 50%로 시장(32%)보다 과다하고, 시장 3위 블루(21%)와 2위 오프화이트·그레이지 계열이 상위 5색에 없어요.",
    "트렌드 컬러: 옐로·네이비는 4개사가 동시에 출시 중이고, A 브랜드가 전개하지 않은 블루 계열이 상위권이에요.",
    "유형: 시장 공동 1위 니트(28%)가 구성에 없고 데님팬츠가 45%로 편중돼 있어요.",
    "고객: 데님 구매자는 상의를 무신사 스탠다드(71.8%)·유니온블루·엘무드에서 사요. 셔츠·니트 확장 여지가 있어요.",
    "수요: 검색어 상위권은 경량패딩·후리스 같은 계절 아우터와 가디건·니트에 몰려 있어요.",
  ],
  sections: [
    {
      kind: "stack",
      id: "color",
      eyebrow: "COLOR",
      title: "색상 — A 브랜드 블랙 50%, 시장(32%) 대비 과다·블루 계열 부재",
      desc: "막대 색은 실제 상품 색 계열 기준이에요(상위 5색 = 100%). 시장 3위 색(블루 21%)과 2위 색상군(오프화이트·그레이지 27%)이 A 브랜드 상위 5색에 없어요.",
      rows: [
        { label: "시장 전체", segments: [
          { name: "블랙", pct: 32, hex: C.black }, { name: "오프화이트", pct: 27, hex: C.offwhite },
          { name: "블루", pct: 21, hex: C.blue }, { name: "오커", pct: 17, hex: C.ochre }, { pct: 3, hex: C.red } ] },
        { label: "A 브랜드", own: true, segments: [
          { name: "블랙", pct: 50, hex: C.black }, { name: "뉴트럴", pct: 20, hex: C.neutral },
          { name: "오커", pct: 16, hex: C.ochre }, { pct: 12, hex: C.navy }, { pct: 2, hex: C.white } ] },
        { label: "B 브랜드", segments: [
          { name: "라이트 그레이", pct: 32, hex: C.lightgray }, { name: "잉크 차콜", pct: 28, hex: C.charcoal },
          { name: "블루", pct: 24, hex: C.blue }, { pct: 12, hex: C.mustard }, { pct: 4, hex: C.red } ] },
        { label: "C 브랜드", segments: [
          { name: "블랙", pct: 36, hex: C.black }, { name: "오프화이트", pct: 29, hex: C.offwhite },
          { name: "블루", pct: 18, hex: C.blue }, { pct: 11, hex: C.yellow }, { pct: 6, hex: C.red } ] },
        { label: "D 브랜드", segments: [
          { name: "블랙", pct: 37, hex: C.black }, { name: "웜 그레이지", pct: 31, hex: C.greige },
          { name: "블루", pct: 21, hex: C.blue }, { pct: 9, hex: C.white }, { pct: 2, hex: C.navy } ] },
        { label: "E 브랜드", segments: [
          { name: "블랙", pct: 37, hex: C.black }, { name: "테라코타", pct: 28, hex: C.terracotta },
          { name: "화이트", pct: 19, hex: C.white }, { pct: 12, hex: C.slate }, { pct: 4, hex: C.green } ] },
      ],
    },
    {
      kind: "bars",
      id: "trend-colors",
      eyebrow: "TREND COLORS",
      title: "경쟁사 동시 출시 색상 — 옐로·데님 블루·네이비",
      desc: "여러 경쟁사가 소량으로 동시 출시 중인 색상이에요(출시 아이템 수 기준). A 브랜드가 전개하지 않은 블루 계열이 상위권이에요.",
      swatches: true,
      rows: [
        { label: "옐로", value: 137, display: "137개 · 4개사 동시", hex: C.yellow },
        { label: "데님 블루", value: 88, display: "88개 · 3개사", hex: C.denim },
        { label: "미디엄 그레이", value: 86, display: "86개 · 2개사", hex: C.gray },
        { label: "블루", value: 85, display: "85개 · 3개사", hex: C.blue },
        { label: "네이비", value: 81, display: "81개 · 4개사 동시", hex: C.navy },
        { label: "포레스트 그린", value: 51, display: "51개 · 3개사", hex: C.forest },
        { label: "토프", value: 49, display: "49개 · 2개사", hex: C.taupe },
      ],
    },
    {
      kind: "stack",
      id: "category",
      eyebrow: "CATEGORY",
      title: "유형 — 시장 공동 1위 니트(28%)가 A 브랜드 구성에 부재",
      desc: "A 브랜드는 데님팬츠 45%에 편중돼 있어요. 니트는 C·E 브랜드의 주력이자 F/W 수요(가디건·니트 검색어 상위)를 받는 핵심 카테고리예요.",
      legend: [
        { label: "니트", hex: "#3566C4" },
        { label: "데님팬츠", hex: "#1F7A4A" },
        { label: "그 외 유형", hex: "#E9EAEA" },
      ],
      rows: [
        { label: "시장 전체", sub: "약 2.3만 SKU", segments: [
          { name: "반소매 티", pct: 28 }, { name: "니트", pct: 28, highlight: "a" }, { name: "셔츠", pct: 21 },
          { name: "데님", pct: 13, highlight: "b" }, { pct: 10 } ] },
        { label: "A 브랜드", own: true, segments: [
          { name: "데님팬츠", pct: 45, highlight: "b" }, { name: "셔츠", pct: 23 }, { name: "반소매", pct: 14 },
          { pct: 11 }, { pct: 7 } ] },
        { label: "B 브랜드", segments: [
          { name: "티셔츠", pct: 31 }, { name: "반소매 티", pct: 26 }, { name: "후드", pct: 18 },
          { pct: 13 }, { pct: 12, highlight: "b" } ] },
        { label: "C 브랜드", segments: [
          { name: "반소매 티", pct: 30 }, { name: "니트", pct: 26, highlight: "a" }, { name: "스웨트", pct: 16 },
          { name: "후드", pct: 16 }, { pct: 12 } ] },
        { label: "D 브랜드", segments: [
          { name: "셔츠", pct: 35 }, { name: "반소매 티", pct: 24 }, { name: "데님", pct: 15, highlight: "b" },
          { pct: 13 }, { pct: 13 } ] },
        { label: "E 브랜드", segments: [
          { name: "니트", pct: 28, highlight: "a" }, { name: "셔츠", pct: 28 }, { name: "반소매", pct: 18 },
          { pct: 14 }, { pct: 12 } ] },
      ],
    },
    {
      kind: "cross",
      id: "pants-buyers",
      eyebrow: "PANTS BUYERS · CROSS-PURCHASE",
      title: "바지 고객 — 상의는 어디서 사고, 무엇을 원하나",
      desc: "FEDIT 자체 분석 데이터로 본 A 브랜드 데님 구매자의 교차 구매 브랜드·아이템이에요.",
      brandsTitle: "상의 구매 브랜드 — 베이직은 무신사 스탠다드, 셔츠·니트는 유니온블루·엘무드·쿠어",
      brands: [
        { label: "무신사 스탠다드", value: 71.8, display: "366명 · 71.8%" },
        { label: "유니온블루", value: 44.3, display: "226명 · 44.3%" },
        { label: "엘무드", value: 38.6, display: "197명 · 38.6%" },
        { label: "드로우핏", value: 36.3, display: "185명 · 36.3%" },
        { label: "수아레", value: 35.7, display: "182명 · 35.7%" },
        { label: "쿠어", value: 33.3, display: "170명 · 33.3%" },
        { label: "아웃스탠딩", value: 23.9, display: "122명 · 23.9%" },
        { label: "미나브", value: 22.7, display: "116명 · 22.7%" },
      ],
      paragraph:
        "같은 구매자들이 바지를 살 때는 무신사 스탠다드(75.3%)를 기본으로 두고 브랜디드(49.8%), 제로(34.3%), 토피(26.3%)를 함께 구매해요. 이 네 브랜드가 A 브랜드 데님과 같은 장바구니 안에서 비교되는 경쟁군이에요. 아우터는 무신사 스탠다드(53.7%)에 이어 엘무드(31.6%), 쿠어(30.6%) 순으로, 상의에서 고른 브랜드에서 아우터까지 이어 사는 흐름을 보여요.",
      kinds: [
        { kind: "티셔츠", pct: "92.9%", keywords: "오버·릴렉스 핏 69.6% · 2팩/세트 62.5% · 무지 베이직 62.0%" },
        { kind: "셔츠", pct: "85.3%", keywords: "오버·릴렉스 핏 56.1% · 체크 51.8% · 스트라이프 44.3% · 옥스포드 30.8%" },
        { kind: "니트·스웨터", pct: "83.7%", keywords: "울·캐시미어 50.4% · 오버·릴렉스 핏 45.3% · 카라 41.2% · 브이넥 29.2%" },
        { kind: "맨투맨", pct: "63.1%", keywords: "오버·릴렉스 핏 30.4% · 그래픽 로고 26.7% · 피그먼트 워싱 15.7%" },
        { kind: "후드", pct: "56.1%", keywords: "그래픽 로고 22.9% · 오버·릴렉스 핏 17.6%" },
        { kind: "폴로·카라", pct: "18.6%", keywords: "카라 18.6% · 오버·릴렉스 핏 2.9%" },
      ],
      top: [
        { rank: 1, brand: "무신사 스탠다드", name: "베이식 긴소매 티셔츠 2팩", type: "긴소매 티", rating: "4.89", price: "₩26,990", buyers: 56, ...top(0) },
        { rank: 2, brand: "엘무드", name: "화란 세미오버 니트 블랙", type: "니트", rating: "4.91", price: "₩71,900", buyers: 54, ...top(1) },
        { rank: 3, brand: "유니온블루", name: "KENSINGTON SHIRT", type: "셔츠", rating: "5.00", price: "₩77,900", buyers: 47, ...top(2) },
        { rank: 4, brand: "무신사 스탠다드", name: "릴렉스 핏 크루 넥 티셔츠 [화이트]", type: "반소매 티", rating: "4.80", price: "₩15,090", buyers: 46, ...top(3) },
        { rank: 5, brand: "무신사 스탠다드", name: "베이식 긴소매 티셔츠 [화이트]", type: "긴소매 티", rating: "4.65", price: "₩18,890", buyers: 46, ...top(4) },
        { rank: 6, brand: "유니온블루", name: "LAUNDRY SHIRT (LAVENDER)", type: "셔츠", rating: "4.91", price: "₩59,000", buyers: 42, ...top(5) },
        { rank: 7, brand: "무신사 스탠다드", name: "릴렉스 핏 크루 넥 티셔츠 2팩", type: "반소매 티", rating: "4.92", price: "₩29,790", buyers: 42, ...top(6) },
        { rank: 8, brand: "이에스엔", name: "하프 폴라 니트 티셔츠 세트", type: "니트", rating: "4.64", price: "₩39,780", buyers: 40, ...top(7) },
        { rank: 9, brand: "무신사 스탠다드", name: "레이어드 크루 넥 티셔츠 [화이트]", type: "반소매 티", rating: "4.62", price: "₩15,090", buyers: 36, ...top(8) },
        { rank: 10, brand: "수아레", name: "하프 터틀넥 니트 세트", type: "니트", rating: "4.60", price: "₩24,900", buyers: 36, ...top(9) },
      ],
      reviews: [
        { tone: "good", product: "유니온블루 · KENSINGTON SHIRT", meta: "추가구매율 78.7% · 별점 5.0", quote: "1·2차 때 구매 실패하고 재입고만 기다렸다. 겨울에도 아우터랑 레이어드해서 입을 생각." },
        { tone: "good", product: "리우아 · 오버핏 긴팔티", meta: "추가구매율 81.2% · 별점 4.92", quote: "흐르는 듯한 예쁜 핏. 빨래를 마구 돌려도 수축 하나 없고 목 늘어남도 없다." },
        { tone: "good", product: "엘무드 · YOUNG 실켓 반팔", meta: "추가구매율 76.2% · 별점 4.86", quote: "면 100%인데 폴리같이 매끈하면서 부들부들하고 몸에 착 감긴다. 터콰이즈 색감 미쳤다." },
        { tone: "good", product: "쿠어 · 탑필 울 라운드 니트", meta: "추가구매율 75.0% · 별점 4.91", quote: "원단도 좋고 그냥 입어도 불편함 없는 옷. 오래 입을 것 같다." },
        { tone: "bad", product: "이에스엔 · 하프 폴라 니트", meta: "불만 리뷰 20.3% — 아쉬운 상의 1위", quote: "신축성이 엄청 많아서 줄어들지 않을까 걱정 · 아이보리는 약간의 비침이 있다" },
        { tone: "bad", product: "비바스튜디오 · LOCATION CREWNECK", meta: "불만 리뷰 18.5%", quote: "좋긴 하지만 입다 보면 실밥 떨어지고 보풀 생기고 — 보풀·마감이 니트·스웨트 불만의 공통 원인" },
      ],
    },
    {
      kind: "bars",
      id: "bestsellers",
      eyebrow: "25FW BESTSELLERS",
      title: "전년 동기 경쟁사 핫 아이템",
      desc: "지난해 같은 시즌(25FW) 판매량 기준이에요. C 브랜드 부클 가디건(블랙)이 압도적 1위이고, A 브랜드 대표 상품은 600개예요.",
      muted: true,
      rows: [
        { brand: "C 브랜드", label: "오버사이즈 부클 가디건 (블랙)", value: 16000, display: "16,000" },
        { brand: "C 브랜드", label: "오버사이즈 부클 가디건 (네이비)", value: 3200, display: "3,200" },
        { brand: "C 브랜드", label: "오버사이즈 부클 가디건 (아이보리)", value: 3100, display: "3,100" },
        { brand: "C 브랜드", label: "아플리케 후드", value: 2800, display: "2,800" },
        { brand: "C 브랜드", label: "코튼 후드 집업", value: 2400, display: "2,400" },
        { brand: "C 브랜드", label: "트랙 팬츠 (블랙)", value: 2200, display: "2,200" },
        { brand: "C 브랜드", label: "캐시미어 블렌드 니트", value: 1700, display: "1,700" },
        { brand: "C 브랜드", label: "칼라 트랙 집업 자켓 (컬러 1)", value: 1500, display: "1,500" },
        { brand: "C 브랜드", label: "칼라 트랙 집업 자켓 (컬러 2)", value: 1300, display: "1,300" },
        { brand: "C 브랜드", label: "오버사이즈 부클 가디건 (기타 컬러)", value: 1200, display: "1,200" },
        { brand: "C 브랜드", label: "아플리케 캐시미어 후드", value: 900, display: "900" },
        { brand: "C 브랜드", label: "로고 스웨트셔츠", value: 900, display: "900" },
        { brand: "A 브랜드", label: "와이드 데님 팬츠 (대표 상품)", value: 600, display: "600", own: true },
      ],
    },
    {
      kind: "keywords",
      id: "market-keywords",
      eyebrow: "MARKET KEYWORDS",
      title: "시장 수요 — 검색어 상위권은 계절 아우터·니트에 집중",
      columns: [
        { platform: "네이버", items: [{ text: "경량패딩" }, { text: "후리스" }, { text: "트위드자켓" }, { text: "후드집업" }, { text: "스웨이드자켓" }] },
        { platform: "무신사", items: [{ text: "경량패딩" }, { text: "후리스" }, { text: "후드집업" }, { text: "후드티" }, { text: "패딩" }] },
        { platform: "W컨셉", items: [{ text: "하객룩" }, { text: "하프코트" }, { text: "경량패딩" }, { text: "가디건", hl: true }, { text: "트위드자켓" }] },
        { platform: "핀터레스트", items: [{ text: "짧은 교복 치마" }, { text: "하객룩 11월" }, { text: "초겨울 코디" }, { text: "떡볶이 코트 코디" }, { text: "갈색 자켓 코디" }] },
      ],
    },
  ],
};
