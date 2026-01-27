import {
  PlannerModuleConfig,
  registerModule,
} from "@features/planner/api/registry";
import { Calculator } from "lucide-react";

export const gradesModule: PlannerModuleConfig = {
  id: "grades",
  label: (_t: unknown) => "Cijferoverzicht",
  icon: Calculator,
  description: "Handmatig cijferoverzicht en gemiddelden",
  color: "text-emerald-400",
  borderColor: "border-emerald-500/50",
};

registerModule(gradesModule);
