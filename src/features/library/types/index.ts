/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";

export interface LibraryModule {
  id: string;
  label: (t: any) => string;
  icon: LucideIcon;
  description: string;
  color: string;
  borderColor: string;
}

export type LibraryModuleConfig = LibraryModule;

export interface LibraryGlobalSettings {
  theme: "dark" | "light";
}

export const defaultLibraryGlobalSettings: LibraryGlobalSettings = {
  theme: "dark",
};

export * from "@shared/types/study";
