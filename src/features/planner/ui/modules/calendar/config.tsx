/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { CalendarDays } from "lucide-react";

export const calendarConfig: PlannerModuleConfig = {
  id: "calendar",
  label: (t: any) => t("planner.modules.calendar") || "Kalender",
  icon: CalendarDays,
  description: "Visual weekly/monthly calendar view",
  color: "text-indigo-400",
  borderColor: "border-indigo-500",
};

// Auto-register on import
registerModule(calendarConfig);
