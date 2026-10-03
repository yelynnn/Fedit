import { useMemo, useState, useEffect } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { brandData } from "@/data/BrandCategories";
import { GenderCategories, ColorCategories } from "@/data/FilterCategories";
import {
  GetDetailList,
  GetPatternList,
  GetCategoryList,
  GetSeasonList,
  type CategoryGroup,
} from "@/apis/AnalysisAPI";

export default function useFilteredData() {
  const { filterList, selectedYear, selectedSeason } = useFilterStore(
    (state) => state
  );
  const [apiDetails, setApiDetails] = useState<string[]>([]);
  const [apiPatterns, setApiPatterns] = useState<string[]>([]);
  const [apiCategories, setApiCategories] = useState<CategoryGroup[]>([]);
  // "23FW"·"25SS"처럼 "YY"+시즌 조합 코드 원본 목록 — 연도/시즌을 따로
  // 골랐을 때 실제로 존재하는 코드로 풀어 보내는 데 쓴다.
  const [apiSeasons, setApiSeasons] = useState<string[]>([]);

  useEffect(() => {
    GetDetailList().then(setApiDetails);
    GetPatternList().then(setApiPatterns);
    GetCategoryList().then(setApiCategories);
    GetSeasonList().then(setApiSeasons);
  }, []);

  const allBrands = useMemo(() => Object.values(brandData).flat(), []);
  const allColors = useMemo(() => ColorCategories.map((c) => c.label), []);
  const allGenders = useMemo(() => GenderCategories, []);
  const allDetails = useMemo(() => apiDetails, [apiDetails]);
  const allPatterns = useMemo(() => apiPatterns, [apiPatterns]);
  // const allMoods = useMemo(() => MoodCategories, []);
  const allTypes = useMemo(
    () => apiCategories.flatMap((c) => [c.label, ...c.items]),
    [apiCategories]
  );

  const selectedBrands = useMemo(
    () => filterList.filter((item) => allBrands.includes(item)),
    [filterList, allBrands]
  );
  const selectedColors = useMemo(
    () => filterList.filter((item) => allColors.includes(item)),
    [filterList, allColors]
  );
  const selectedGenders = useMemo(
    () => filterList.filter((item) => allGenders.includes(item)),
    [filterList, allGenders]
  );
  const selectedDetails = useMemo(
    () => filterList.filter((item) => allDetails.includes(item)),
    [filterList, allDetails]
  );
  const selectedPatterns = useMemo(
    () => filterList.filter((item) => allPatterns.includes(item)),
    [filterList, allPatterns]
  );
  // const selectedMoods = useMemo(
  //   () => filterList.filter((item) => allMoods.includes(item)),
  //   [filterList, allMoods]
  // );
  const selectedCategories = useMemo(
    () => filterList.filter((item) => allTypes.includes(item)),
    [filterList, allTypes]
  );

  // 백엔드는 "26FW"처럼 연도+시즌이 합쳐진 코드로만 필터링한다. 연도나
  // 시즌 중 하나만 고른 경우, 예전엔 "FW"나 "26"처럼 반쪽짜리 코드를 그대로
  // 보내서 어떤 실제 코드와도 안 맞아 결과가 하나도 안 왔다 — 실제로 존재하는
  // 코드 목록(apiSeasons)에서 맞는 것들을 다 찾아 배열로 보낸다.
  const selectedSeasons = useMemo(() => {
    if (selectedYear && selectedSeason) {
      return [`${selectedYear.slice(-2)}${selectedSeason}`];
    }
    if (selectedYear) {
      return apiSeasons.filter((s) => s.startsWith(selectedYear.slice(-2)));
    }
    if (selectedSeason) {
      return apiSeasons.filter((s) => s.endsWith(selectedSeason));
    }
    return [];
  }, [selectedYear, selectedSeason, apiSeasons]);

  return {
    selectedBrands,
    selectedColors,
    selectedGenders,
    selectedDetails,
    selectedPatterns,
    selectedCategories,
    selectedSeasons,
  };
}
