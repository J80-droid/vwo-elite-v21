/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { PsychologyModuleConfig } from "@features/psychology/types";
import { Activity } from "lucide-react";

export const cognitionConfig: PsychologyModuleConfig = {
  id: "cognition",
  label: (t: any) => t("psychology.modules.cognition"),
  icon: Activity,
  description: "Cognitieve vaardigheden",
  color: "amber",
  borderColor: "border-amber-500",
};
