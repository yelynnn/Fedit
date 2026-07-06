import { useMemo, useState, useEffect } from "react";
import { useFilterStore } from "@/stores/FilterStore";
import { brandData } from "@/data/BrandCategories";
import {
  GenderCategories,
  ColorCategories,
  TypeCategories,
} from "@/data/FilterCategories";
import { GetDetailList, GetPatternList } from "@/apis/AnalysisAPI";

export default function useFilteredData() {
  const { filterList, selectedYear, selectedSeason } = useFilterStore(
    (state) => state
  );
  const [apiDetails, setApiDetails] = useState<string[]>([]);
  const [apiPatterns, setApiPatterns] = useState<string[]>([]);

  useEffect(() => {
    GetDetailList().then(setApiDetails);
    GetPatternList().then(setApiPatterns);
  }, []);

  const allBrands = useMemo(() => Object.values(brandData).flat(), []);
  const allColors = useMemo(() => ColorCategories.map((c) => c.label), []);
  const allGenders = useMemo(() => GenderCategories, []);
  const allDetails = useMemo(() => apiDetails, [apiDetails]);
  const allPatterns = useMemo(() => apiPatterns, [apiPatterns]);
  // const allMoods = useMemo(() => MoodCategories, []);
  const allTypes = useMemo(
    () => TypeCategories.flatMap((t) => [t.category, ...t.subcategories]),
    []
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
  const selectedCategories = useMemo(() => {
    const selected = filterList.filter((item) => allTypes.includes(item));

    const expanded = selected.flatMap((item) => {
      const match = TypeCategories.find((t) => t.category === item);
      if (match) {
        return [item];
      }
      return [item];
    });

    return [...new Set(expanded)];
  }, [filterList, allTypes]);

  const selectedSeasons = useMemo(() => {
    if (!selectedYear || !selectedSeason) return [];
    return [`${selectedYear.slice(-2)}${selectedSeason}`];
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
