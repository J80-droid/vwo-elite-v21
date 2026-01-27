/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";

export interface PlannerModule {
  id: string;
  label: (t: any) => string;
  icon: LucideIcon;
  description: string;
  color: string;
  borderColor: string;
}

export type PlannerModuleConfig = PlannerModule;

export interface PlannerGlobalSettings {
  theme: "dark" | "light";
  showCompleted: boolean;
}

export const defaultPlannerGlobalSettings: PlannerGlobalSettings = {
  theme: "dark",
  showCompleted: true,
};
