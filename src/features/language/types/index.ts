import { type TFunction } from "@shared/types/i18n";
import { LucideIcon } from "lucide-react";
import React from "react";

// Using string for future extensibility
export type LanguageModule = string;

export interface LanguageModuleConfig {
  id: LanguageModule;
  label: (t: TFunction) => string;
  description?: string;
  icon: LucideIcon;
  color: string;
  borderColor?: string;
  // Layout Components
  StageComponent?: React.FC<Record<string, unknown>>;
  SidebarComponent?: React.FC<Record<string, unknown>>;
  component?: React.FC<Record<string, unknown>>; // Legacy fallback
}

export interface LanguageGlobalSettings {
  targetLanguage: "en" | "es" | "fr" | "de";
}

export const defaultLanguageGlobalSettings: LanguageGlobalSettings = {
  targetLanguage: "en",
};
