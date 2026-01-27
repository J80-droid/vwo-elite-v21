/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { PieChart } from "lucide-react";

export const analyticsConfig: PlannerModuleConfig = {
  id: "analytics",
  label: (t: any) => t("planner.modules.analytics"),
  icon: PieChart,
  description: "Track your productivity",
  color: "text-violet-400",
  borderColor: "border-violet-500",
};

// Auto-register on import
registerModule(analyticsConfig);
