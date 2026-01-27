import { type TFunction } from "@shared/types/i18n";
import { LucideIcon } from "lucide-react";

export interface ExamModule {
  id: string;
  label: (t: TFunction) => string;
  icon: LucideIcon;
  description: string;
  color: string;
  borderColor: string;
}

export type ExamModuleConfig = ExamModule;

export interface ExamGlobalSettings {
  theme: "dark" | "light";
}

export const defaultExamGlobalSettings: ExamGlobalSettings = {
  theme: "dark",
};
