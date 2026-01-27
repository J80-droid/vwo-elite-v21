/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { HardDrive } from "lucide-react";

export const storageConfig: SettingsModuleConfig = {
  id: "storage",
  label: (t: any) => t("settings.tabs.storage"),
  icon: HardDrive,
  color: "text-slate-400",
  borderColor: "border-slate-500",
};

registerModule(storageConfig);
