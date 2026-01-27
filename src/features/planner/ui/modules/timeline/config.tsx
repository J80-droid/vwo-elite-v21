/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { CalendarDays } from "lucide-react";

export const timelineConfig: PlannerModuleConfig = {
  id: "timeline",
  label: (t: any) => t("planner.modules.timeline"),
  icon: CalendarDays,
  description: "View your schedule",
  color: "text-blue-400",
  borderColor: "border-blue-500",
};

// Auto-register on import
registerModule(timelineConfig);
