/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { PhilosophyModuleConfig } from "@features/philosophy/types";
import { Highlighter } from "lucide-react";

export const analysisConfig: PhilosophyModuleConfig = {
  id: "analysis",
  label: (t: any) => t("philosophy.analysis.title", "Tekst Analyse"),
  icon: Highlighter,
  description: "Lezen & Interpreteren",
  color: "fuchsia",
  borderColor: "border-fuchsia-500",
};
