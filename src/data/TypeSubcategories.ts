// TypeFilterPanel에서 대분류(원피스/치마/바지/아우터/상의) 안의 세부 품목을
// 한 번 더 묶어서 보여주기 위한 설정. 실제 품목명은 서버(/menu/category)에서
// 내려오는 문자열이라 정확한 값을 미리 알 수 없으므로, 키워드 포함 여부로
// 매칭한다. 어떤 그룹에도 걸리지 않는 품목은 fallbackLabel(기타 OO)로 모은다.
//
// 그룹/라벨 구성은 참고 레퍼런스(경쟁 서비스 유형 필터 화면)의 실제 분류 기준을
// 그대로 따른다. 그룹은 배열 순서대로 매칭하고 이미 다른 그룹에 매칭된 품목은
// 제외하므로("used" 집합), "코트"처럼 여러 그룹이 공유하는 단어는 구체적인
// 그룹(환절기 코트, 겨울 싱글/더블 코트)을 먼저 배치하고 포괄적인 그룹(겨울 기타
// 코트)을 뒤에 둬서 겹치지 않게 나눈다.
export type SubcategoryGroupDef = { label: string; keywords: string[] };
export type SubcategoryConfig = { groups: SubcategoryGroupDef[]; fallbackLabel: string };

export const TypeSubcategoryMap: Record<string, SubcategoryConfig> = {
  바지: {
    groups: [
      { label: "데님 팬츠", keywords: ["데님", "진"] },
      { label: "트레이닝/조거 팬츠", keywords: ["트레이닝", "조거", "조깅"] },
      { label: "코튼 팬츠", keywords: ["코튼"] },
      { label: "슈트 팬츠/슬랙스", keywords: ["슈트 팬츠", "슈트팬츠", "슬랙스", "정장", "트라우저"] },
      { label: "숏 팬츠", keywords: ["숏 팬츠", "숏팬츠", "쇼츠", "반바지", "버뮤다"] },
      { label: "레깅스", keywords: ["레깅스", "타이츠"] },
      { label: "점프 슈트/오버롤", keywords: ["점프슈트", "점프 슈트", "오버롤", "오버올", "살로펫"] },
    ],
    fallbackLabel: "기타 하의",
  },
  원피스: {
    groups: [
      { label: "미니원피스", keywords: ["미니"] },
      { label: "미디원피스", keywords: ["미디"] },
      { label: "맥시원피스", keywords: ["맥시", "롱"] },
    ],
    fallbackLabel: "기타 원피스",
  },
  치마: {
    groups: [
      { label: "미니스커트", keywords: ["미니"] },
      { label: "미디스커트", keywords: ["미디"] },
      { label: "롱스커트", keywords: ["롱", "맥시"] },
    ],
    fallbackLabel: "기타 스커트",
  },
  아우터: {
    groups: [
      { label: "후드 집업", keywords: ["후드 집업", "후드집업"] },
      { label: "블루종/MA-1", keywords: ["블루종", "MA-1", "ma-1"] },
      { label: "레더/라이더스 재킷", keywords: ["레더", "라이더스"] },
      { label: "슈트/블레이저 재킷", keywords: ["슈트", "블레이저"] },
      { label: "카디건", keywords: ["카디건"] },
      { label: "경량 패딩/패딩 베스트", keywords: ["경량 패딩", "경량패딩", "패딩 베스트", "패딩베스트"] },
      { label: "사파리/헌팅 재킷", keywords: ["사파리", "헌팅"] },
      { label: "트러커 재킷", keywords: ["트러커"] },
      { label: "스타디움 재킷", keywords: ["스타디움"] },
      { label: "나일론/코치 재킷", keywords: ["나일론", "코치"] },
      { label: "트레이닝 재킷", keywords: ["트레이닝"] },
      { label: "아노락 재킷", keywords: ["아노락"] },
      { label: "플리스/뽀글이", keywords: ["플리스", "뽀글이"] },
      { label: "환절기 코트", keywords: ["환절기"] },
      { label: "베스트", keywords: ["베스트", "조끼"] },
      { label: "무스탕/퍼", keywords: ["무스탕", "퍼"] },
      { label: "겨울 싱글 코트", keywords: ["싱글 코트", "싱글코트"] },
      { label: "겨울 더블 코트", keywords: ["더블 코트", "더블코트"] },
      { label: "겨울 기타 코트", keywords: ["코트"] },
      { label: "롱패딩/헤비 아우터", keywords: ["롱패딩", "롱 패딩"] },
      { label: "숏패딩/헤비 아우터", keywords: ["숏패딩", "숏 패딩"] },
    ],
    fallbackLabel: "기타 아우터",
  },
  상의: {
    groups: [
      { label: "긴소매 티셔츠", keywords: ["긴소매", "롱슬리브", "긴팔"] },
      { label: "맨투맨/스웨트", keywords: ["맨투맨", "스웨트"] },
      { label: "후드 티셔츠", keywords: ["후드"] },
      { label: "반소매 티셔츠", keywords: ["반소매", "반팔"] },
      { label: "피케/카라 티셔츠", keywords: ["피케", "카라"] },
      { label: "탱크탑", keywords: ["탱크탑", "탱크 탑"] },
      { label: "니트/스웨터", keywords: ["니트", "스웨터"] },
      { label: "민소매 티셔츠", keywords: ["민소매", "슬리브리스", "나시"] },
      // "티셔츠"라는 단어 자체에 "셔츠"가 부분 문자열로 들어있어서, 위 그룹
      // 어디에도 안 걸리는 티셔츠(예: "오버사이즈 티셔츠", "폴로 티셔츠")를 여기서
      // 먼저 걷어내지 않으면 아래 셔츠/블라우스 그룹이 "셔츠" 키워드로 잘못
      // 채간다. 그래서 셔츠/블라우스보다 반드시 앞에 둔다.
      { label: "티셔츠", keywords: ["티셔츠"] },
      { label: "셔츠", keywords: ["셔츠"] },
      { label: "블라우스", keywords: ["블라우스"] },
    ],
    fallbackLabel: "기타 상의",
  },
};

export type SubcategoryGroup = { label: string; items: string[] };

// items는 이미 검색/키워드로 좁혀진 목록을 넘겨도 되고, 안 넘겨도 된다 —
// 앞쪽 그룹부터 먼저 매칭시켜 겹치지 않게 나눈 뒤, 남는 품목을 기타로 모은다.
// activeTab이 설정에 없는 카테고리면 null을 반환해 기존처럼 평평한 목록으로
// 보여주도록 한다.
export function groupItemsBySubcategory(
  categoryLabel: string,
  items: string[],
): SubcategoryGroup[] | null {
  const config = TypeSubcategoryMap[categoryLabel];
  if (!config) return null;

  const used = new Set<string>();
  const result: SubcategoryGroup[] = [];

  for (const group of config.groups) {
    const matched = items.filter(
      (item) => !used.has(item) && group.keywords.some((kw) => item.includes(kw)),
    );
    matched.forEach((item) => used.add(item));
    if (matched.length > 0) result.push({ label: group.label, items: matched });
  }

  const rest = items.filter((item) => !used.has(item));
  if (rest.length > 0) result.push({ label: config.fallbackLabel, items: rest });

  return result;
}
