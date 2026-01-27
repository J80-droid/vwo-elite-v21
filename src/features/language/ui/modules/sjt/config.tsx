/* eslint-disable @typescript-eslint/no-explicit-any */
import { LanguageModuleConfig } from "@features/language/types";
import { Scale } from "lucide-react";

export const sjtConfig: LanguageModuleConfig = {
  id: "sjt",
  label: (t: any) => t("language.modules.sjt"),
  description: "Situational Judgement Tests en culturele analyse",
  icon: Scale,
  color: "text-teal-400",
  borderColor: "border-teal-500",
};
