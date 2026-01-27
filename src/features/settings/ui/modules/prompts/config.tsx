/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { Cpu } from "lucide-react";

export const promptsConfig: SettingsModuleConfig = {
  id: "prompts",
  label: (t: any) => t("settings.tabs.prompts"),
  icon: Cpu,
  color: "text-violet-400",
  borderColor: "border-violet-500",
};

registerModule(promptsConfig);
