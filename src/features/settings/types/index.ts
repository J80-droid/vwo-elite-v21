import { type TFunction } from "@shared/types/i18n";
import { LucideIcon } from "lucide-react";

export interface SettingsModuleConfig {
  id: string;
  label: (t: TFunction) => string;
  icon: LucideIcon;
  color: string;
  borderColor: string;
}
export type { AppTheme, PersonaType, UserSettings } from "@shared/types/config";
