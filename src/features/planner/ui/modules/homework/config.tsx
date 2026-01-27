/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { Book } from "lucide-react";

export const homeworkConfig: PlannerModuleConfig = {
  id: "homework",
  label: (t: any) => t("planner.modules.homework") || "Huiswerk",
  icon: Book,
  description: "Track and manage your homework assignments",
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
};

// Auto-register on import
registerModule(homeworkConfig);
