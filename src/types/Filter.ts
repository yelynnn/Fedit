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

  filterList: string[];
  addFilter: (filter: string) => void;
  removeFilter: (filter: string) => void;
  resetFilter: () => void;

  brandList: string[];
  addBrand: (brand: string) => void;
  removeBrand: (brand: string) => void;
  resetBrand: () => void;
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
