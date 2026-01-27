/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { GraduationCap } from "lucide-react";

export const examsConfig: PlannerModuleConfig = {
  id: "exams",
  label: (t: any) => t("planner.modules.exams") || "Examens",
  icon: GraduationCap,
  description: "Manage your exams, PTA weightings and grades",
  color: "text-red-400",
  borderColor: "border-red-500",
};

// Auto-register on import
registerModule(examsConfig);
