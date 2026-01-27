/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import {
  PlannerModuleConfig,
  registerModule,
} from "@features/planner/api/registry";
import { GraduationCap } from "lucide-react";

export const somtodayModule: PlannerModuleConfig = {
  id: "somtoday",
  label: (_t: any) => "Somtoday Elite",
  icon: GraduationCap,
  description: "100% Real-time Somtoday sync (Grades, Schedule, Homework)",
  color: "text-cyan-400",
  borderColor: "border-cyan-500/50",
};

registerModule(somtodayModule);
