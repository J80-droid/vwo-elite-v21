/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { Settings } from "lucide-react";

export const settingsConfig: PlannerModuleConfig = {
  id: "settings",
  label: (t: any) => t("planner.modules.settings") || "Instellingen",
  icon: Settings,
  description: "Configure bio-rhythm and planner preferences",
  color: "text-slate-400",
  borderColor: "border-slate-500",
};

// Auto-register on import
registerModule(settingsConfig);
