/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { registerModule } from "@features/settings/api/registry";
import { SettingsModuleConfig } from "@features/settings/types";
import { User } from "lucide-react";

export const profileConfig: SettingsModuleConfig = {
  id: "profile",
  label: (t: any) => t("settings.tabs.profile"),
  icon: User,
  color: "text-indigo-400",
  borderColor: "border-indigo-500",
};

registerModule(profileConfig);
