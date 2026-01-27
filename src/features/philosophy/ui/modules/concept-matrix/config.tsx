/* eslint-disable @typescript-eslint/no-explicit-any */
import { Layers } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const conceptMatrixConfig: PhilosophyModuleConfig = {
  id: "concept-matrix",
  label: (t: any) => t("philosophy.concept_matrix.title", "Concept Matrix"),
  icon: Layers,
  description: "Interactieve Kennissynthese",
  color: "indigo",
  borderColor: "border-indigo-500",
};
