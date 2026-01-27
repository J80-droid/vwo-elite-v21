import { UploadedMaterial } from "@shared/types/index";
import { useCallback } from "react";

// Configuratie per vak: Eenvoudig uitbreidbaar
const SUBJECT_RULES: Record<
  string,
  { requiredKeywords: string[]; missingMsg: string }
> = {
  geschiedenis: {
    requiredKeywords: ["tijdlijn"],
    missingMsg: "Geen tijdlijn gevonden (Cruciaal voor chronologie).",
  },
  wiskunde: {
    requiredKeywords: ["formule", "rekenregels"],
    missingMsg: "Geen formuleblad of rekenregels gedetecteerd.",
  },
  aardrijkskunde: {
    requiredKeywords: ["kaart", "atlas"],
    missingMsg: "Geen kaartmateriaal gevonden.",
  },
};

export const useGapAnalysis = (
  subject: string,
  allMaterials: UploadedMaterial[],
  selectedIds: Set<string>,
) => {
  const runAnalysis = useCallback((): string[] => {
    // Filter alleen de geselecteerde materialen
    const selectedTitles = allMaterials
      .filter((m) => selectedIds.has(m.id))
      .map((m) => m.name);

    const gaps: string[] = [];

    // 1. Numerieke Analyse (detecteert gaten in reeksen zoals H1, H3)
    const numbers = selectedTitles
      .map((t) => (t || "").match(/(?:hoofdstuk|h|week|sectie)\s*(\d+)/i))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => parseInt(m[1]!, 10))
      .sort((a, b) => a - b);

    if (numbers.length > 1) {
      for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i + 1]! > numbers[i]! + 1) {
          gaps.push(
            `Hoofdstuk/Deel ${numbers[i]! + 1} lijkt te ontbreken tussen ${numbers[i]!} en ${numbers[i + 1]!}.`,
          );
        }
      }
    }

    // 2. Vak-specifieke Context Checks
    const rules = SUBJECT_RULES[subject.toLowerCase()];
    if (rules) {
      const combinedText = selectedTitles.join(" ").toLowerCase();
      const hasKeyword = rules.requiredKeywords.some((kw) =>
        combinedText.includes(kw),
      );

      if (!hasKeyword) {
        gaps.push(rules.missingMsg);
      }
    }

    return gaps;
  }, [subject, allMaterials, selectedIds]);

  return { runAnalysis };
};
