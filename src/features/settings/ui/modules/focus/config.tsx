/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { Activity } from "lucide-react";

export const focusConfig: SettingsModuleConfig = {
  id: "focus",
  label: (t: any) => t("settings.tabs.focus"),
  icon: Activity,
  color: "text-blue-400",
  borderColor: "border-blue-500",
};

registerModule(focusConfig);
