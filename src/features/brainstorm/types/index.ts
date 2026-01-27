/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";
import React from "react";

// Using string for future extensibility
export type BrainstormModule = string;

export interface BrainstormModuleConfig {
  id: BrainstormModule;
  label: (t: any) => string;
  description?: string;
  icon: LucideIcon;
  color: string;
  borderColor?: string;
  // Layout Components
  StageComponent?: React.FC<any>;
  SidebarComponent?: React.FC<any>;
  component?: React.FC<any>; // Legacy fallback
}

export interface BrainstormGlobalSettings {
  theme: "dark" | "light";
}

export const defaultBrainstormGlobalSettings: BrainstormGlobalSettings = {
  theme: "dark",
};
