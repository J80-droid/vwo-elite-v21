/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";

export interface ResearchModule {
  id: string;
  label: (t: any) => string;
  icon: LucideIcon;
  description: string;
  color: string;
  borderColor: string;
}

export type ResearchModuleConfig = ResearchModule;

export interface ResearchGlobalSettings {
  theme: "dark" | "light";
}

export const defaultResearchGlobalSettings: ResearchGlobalSettings = {
  theme: "dark",
};
