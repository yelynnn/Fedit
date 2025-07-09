export type BrandChipProps = {
  brand: string;
};

export type FilterOptionProps = {
  title: string;
  categoryList?: string[];
  typeList?: CategoryGroup[];
};

export type CategoryGroup = {
  category: string;
  subcategories: string[];
};

export type BrandStore = {
  brandList: string[];
  addBrand: (brand: string) => void;
  removeBrand: (brand: string) => void;
};

export type SunburstData = {
  name: string;
  value?: number;
  color?: string;
  children?: SunburstData[];
};
