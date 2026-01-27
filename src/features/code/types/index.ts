/* eslint-disable @typescript-eslint/no-explicit-any */

import { LucideIcon } from "lucide-react";
import React from "react";

// Using string for future extensibility
export type CodeModule = string;

export interface CodeModuleConfig {
  id: CodeModule;
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

export interface CodeGlobalSettings {
  theme: "dark" | "light";
}

export const defaultCodeGlobalSettings: CodeGlobalSettings = {
  theme: "dark",
};
