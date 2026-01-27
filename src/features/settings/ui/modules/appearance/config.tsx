/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { Palette } from "lucide-react";

export const appearanceConfig: SettingsModuleConfig = {
  id: "appearance",
  label: (t: any) => t("settings.tabs.appearance"),
  icon: Palette,
  color: "text-cyan-400",
  borderColor: "border-cyan-500",
};

registerModule(appearanceConfig);
