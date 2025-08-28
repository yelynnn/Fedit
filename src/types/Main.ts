type Keyword = {
  idx: number;
  keyword: string;
  status: number;
};

export type KeywordBox = {
  title: string;
  keywords: Keyword[];
};

export type chartProps = { charList: number[] };
