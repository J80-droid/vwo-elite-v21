/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { FileText } from "lucide-react";

export const pwsConfig: PlannerModuleConfig = {
  id: "pws",
  label: (t: any) => t("planner.modules.pws") || "PWS",
  icon: FileText,
  description: "Manage your Profielwerkstuk project",
  color: "text-indigo-400",
  borderColor: "border-indigo-500",
};

// Auto-register on import
registerModule(pwsConfig);
