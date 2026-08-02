import { useMemo, useState, useEffect } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { brandData } from "@/data/BrandCategories";
import { GenderCategories, ColorCategories } from "@/data/FilterCategories";
import {
  GetDetailList,
  GetPatternList,
  GetCategoryList,
  type CategoryGroup,
} from "@/apis/AnalysisAPI";

export default function useFilteredData() {
  const { filterList, selectedYear, selectedSeason } = useFilterStore(
    (state) => state
  );
  const [apiDetails, setApiDetails] = useState<string[]>([]);
  const [apiPatterns, setApiPatterns] = useState<string[]>([]);
  const [apiCategories, setApiCategories] = useState<CategoryGroup[]>([]);

  useEffect(() => {
    GetDetailList().then(setApiDetails);
    GetPatternList().then(setApiPatterns);
    GetCategoryList().then(setApiCategories);
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

  const selectedSeasons = useMemo(() => {
    if (selectedYear && selectedSeason) {
      return [`${selectedYear.slice(-2)}${selectedSeason}`];
    }
    if (selectedYear) return [selectedYear.slice(-2)];
    if (selectedSeason) return [selectedSeason];
    return [];
  }, [selectedYear, selectedSeason]);

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
