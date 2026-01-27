/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { Key } from "lucide-react";

export const apiConfig: SettingsModuleConfig = {
  id: "api",
  label: (t: any) => t("settings.tabs.api"),
  icon: Key,
  color: "text-rose-400",
  borderColor: "border-rose-500",
};

registerModule(apiConfig);
