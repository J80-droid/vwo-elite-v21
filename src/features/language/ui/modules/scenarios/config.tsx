/* eslint-disable @typescript-eslint/no-explicit-any */
import { LanguageModuleConfig } from "@features/language/types";
import { MessageSquare } from "lucide-react";

export const scenariosConfig: LanguageModuleConfig = {
  id: "scenarios",
  label: (t: any) => t("language.modules.scenarios"),
  description: "Oefen gesprekken in realistische situaties met AI",
  icon: MessageSquare,
  color: "text-orange-400",
  borderColor: "border-orange-500",
};
