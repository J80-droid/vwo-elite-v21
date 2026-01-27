/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { BrainCircuit } from "lucide-react";

export const aiConfig: SettingsModuleConfig = {
  id: "ai",
  label: (t: any) => t("settings.tabs.ai"),
  icon: BrainCircuit,
  color: "text-amber-400",
  borderColor: "border-amber-500",
};

registerModule(aiConfig);
