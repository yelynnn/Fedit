export type FilterChipProps = {
  filter: string;
};

export type FilterTitle = {
  filterName: string;
  filterList: string[];
};

export type FilterOptionProps = {
  title: string;
  categoryList?: string[];
  typeList?: CategoryGroup[];
  colorList?: ColorGroup[];
};

type ColorGroup = {
  label: string;
  value: string;
};

type CategoryGroup = {
  category: string;
  subcategories: string[];
};

export type FilterStore = {
  selectedTab: string;
  selectedColors: string[];
  selectedGenders: string[];
  selectedTypes: string[];
  selectedDetails: string[];
  selectedPatterns: string[];
  setSelectedTab: (tab: string) => void;

  selectedYear: string;
  selectedSeason: string;
  setSelectedYear: (year: string) => void;
  setSelectedSeason: (season: string) => void;
  resetSeason: () => void;

  filterList: string[];
  addFilter: (filter: string) => void;
  removeFilter: (filter: string) => void;
  resetFilter: () => void;

  brandList: string[];
  addBrand: (brand: string) => void;
  removeBrand: (brand: string) => void;
  resetBrand: () => void;
  setBrandList: (brands: string[]) => void;

  // 무신사/29cm처럼 입점 브랜드가 100개 넘는 플랫폼을 통째로 선택할 때, 그
  // 브랜드를 하나하나 selectedBrands로 보내면 요청 헤더가 너무 커진다.
  // 이런 경우엔 개별 브랜드명 대신 platformList(selectedPlatforms)로 보낸다.
  platformList: string[];
  setPlatformList: (platforms: string[]) => void;
  resetPlatform: () => void;

  // 서버에 저장된 "관심 브랜드 10개"(고정값). brandList는 지금 화면에서
  // 필터링 중인 값이라 자유롭게 늘었다 줄었다 하지만, interestBrandPicks는
  // 저장/변경 시에만 바뀐다 — "이 브랜드를 볼 수 있는지" 허용 여부 판단은
  // brandList가 아니라 반드시 이 값을 기준으로 해야 한다.
  interestBrandPicks: string[];
  setInterestBrandPicks: (brands: string[]) => void;

  // 관심 브랜드를 마지막으로 저장(변경)한 시각(ISO). 결제 주기당 1회 변경
  // 제한을 프론트에서 판단하는 데 쓴다. 백엔드가 이 정보를 내려주게 되면
  // 그쪽 값으로 교체하는 게 맞다 — 기기별로만 유효한 임시 방편이다.
  lastBrandPicksSavedAt: string | null;
  setLastBrandPicksSavedAt: (iso: string) => void;
};

export type SunburstData = {
  name: string;
  value?: number;
  color?: string;
  children?: SunburstData[];
};

export interface KeyWordProps {
  fit?: string[];
  material?: string[];
  etc?: string[];
}

interface RowData extends KeyWordProps {
  category: string;
  count: number;
  ratio: string;
  color: string;
}

export type TypeBoxProps = {
  title: string;
  chartData: any[];
  rows: RowData[];
};

type ChartItem = {
  browser: string;
  styles: number;
  fill: string;
};

export type TypeChartProps = {
  chartData: ChartItem[];
};

export type ProductType = {
  itemcode: string;
  product_name: string;
  color_text?: string;
  color?: string;
  material?: string;
  product_image_url?: string;
};

export type ColorBoxProps = {
  brand: string;
};

export interface BrandMenuProps {
  onClose: () => void;
}

export type TypeRow = {
  category: string;
  count: number;
  ratio?: string | number;
  fit?: string[];
  material?: string[];
  etc?: string[];
};

export type BrandTypeBlock = {
  brand: string;
  total: number;
  rows: TypeRow[];
};

type ColorItem = {
  color: string;
  name: string;
  value: number;
};

export type BrandColorBlock = {
  brand: string;
  colors: ColorItem[];
};

export type BrandTypeData = BrandTypeBlock[];
