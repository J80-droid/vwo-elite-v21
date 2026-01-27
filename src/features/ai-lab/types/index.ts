import { LucideIcon } from "lucide-react";

export type AILabModuleId = "prompt-eng" | "architecture" | "dashboard" | "";

export interface AILabModule {
  id: AILabModuleId;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export interface AILabState {
  activeModule: AILabModuleId;
}
