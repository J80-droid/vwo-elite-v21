import { MathModuleConfig } from "@features/math/types";
import { Brain } from "lucide-react";
// import { ConceptStage } from './ConceptStage'; // Converted to dynamic stage loading

export const conceptsConfig: MathModuleConfig = {
  id: "concepts",
  label: (_t) => "The Lab",
  icon: Brain,
  description: "Conceptuele verdieping & visualisatie",
  color: "emerald",
  borderColor: "border-emerald-500",
};
