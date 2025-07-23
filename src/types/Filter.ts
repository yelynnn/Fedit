export type FilterChipProps = {
  filter: string;
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
  filterList: string[];
  addFilter: (filter: string) => void;
  removeFilter: (filter: string) => void;
  resetFilter: () => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
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
  product_name: string;
  material: string;
  image_url: string;
  color: string;
  // id: string;
};

export type ColorBoxProps = {
  brand: string;
};

export interface BrandMenuProps {
  onClose: () => void;
}
