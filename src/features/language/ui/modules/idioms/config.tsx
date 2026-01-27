/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { LanguageModuleConfig } from "@features/language/types";
import { BookOpen } from "lucide-react";

export const idiomsConfig: LanguageModuleConfig = {
  id: "idioms",
  label: (t: any) => t("language.modules.idioms"),
  description: "Beheers complexe uitdrukkingen en grammatica",
  icon: BookOpen,
  color: "text-blue-400",
  borderColor: "border-blue-500",
};
