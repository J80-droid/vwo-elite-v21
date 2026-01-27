/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { Database } from "lucide-react";

export const dataConfig: SettingsModuleConfig = {
  id: "data",
  label: (t: any) => t("settings.tabs.data"),
  icon: Database,
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
};

registerModule(dataConfig);
