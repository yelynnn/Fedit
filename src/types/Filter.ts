export type BrandChipProps = {
  brand: string;
};

export type FilterOptionProps = {
  title: string;
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
