/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { Boxes } from "lucide-react";

export const architectureConfig: SettingsModuleConfig = {
  id: "architecture",
  label: (t: any) => t("settings.tabs.architecture", "Architectuur"),
  icon: Boxes,
  color: "text-indigo-400",
  borderColor: "border-indigo-500",
};

registerModule(architectureConfig);
