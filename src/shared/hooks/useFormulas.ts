/* eslint-disable react-hooks/set-state-in-effect */
import { FormulaEntry, FORMULAS } from "@shared/lib/data/formulas";
import { useEffect, useMemo, useState } from "react";

export const useFormulas = () => {
  const [customFormulas, setCustomFormulas] = useState<FormulaEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem("vwo_elite_custom_formulas");
    if (savedCustom) {
      try {
        setCustomFormulas(JSON.parse(savedCustom));
      } catch (e) {
        console.error("Error loading custom formulas", e);
      }
    }

    const savedFavorites = localStorage.getItem("vwo_elite_favorite_formulas");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Error loading favorites", e);
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(
      "vwo_elite_custom_formulas",
      JSON.stringify(customFormulas),
    );
  }, [customFormulas]);

  useEffect(() => {
    localStorage.setItem(
      "vwo_elite_favorite_formulas",
      JSON.stringify(favorites),
    );
  }, [favorites]);

  const allFormulas = useMemo(() => {
    const uniqueMap = new Map();
    // First add static formulas
    FORMULAS.forEach((f) => uniqueMap.set(f.id, f));
    // Then add custom formulas (potentially overriding or adding new)
    customFormulas.forEach((f) => uniqueMap.set(f.id, f));
    return Array.from(uniqueMap.values());
  }, [customFormulas]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id],
    );
  };

  const addCustomFormula = (formula: FormulaEntry) => {
    setCustomFormulas((prev) => [...prev, formula]);
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return {
    allFormulas,
    customFormulas,
    favorites,
    toggleFavorite,
    addCustomFormula,
    isFavorite,
  };
};
