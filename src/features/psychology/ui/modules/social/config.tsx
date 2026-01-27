/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { PsychologyModuleConfig } from "@features/psychology/types";
import { Users } from "lucide-react";

export const socialConfig: PsychologyModuleConfig = {
  id: "social",
  label: (t: any) => t("psychology.modules.social"),
  icon: Users,
  description: "Sociale dynamiek & Invloed",
  color: "rose",
  borderColor: "border-rose-500",
};
