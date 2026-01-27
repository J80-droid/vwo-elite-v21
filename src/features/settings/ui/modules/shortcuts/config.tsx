/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { Monitor } from "lucide-react";

export const shortcutsConfig: SettingsModuleConfig = {
  id: "shortcuts",
  label: (t: any) => t("settings.tabs.shortcuts"),
  icon: Monitor,
  color: "text-matrix-green",
  borderColor: "border-matrix-green",
};

registerModule(shortcutsConfig);
