/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { PsychologyModuleConfig } from "@features/psychology/types";
import { Fingerprint } from "lucide-react";

export const personalityConfig: PsychologyModuleConfig = {
  id: "personality",
  label: (t: any) => t("psychology.modules.personality"),
  icon: Fingerprint,
  description: "Eigenschappen & Verschillen",
  color: "indigo",
  borderColor: "border-indigo-500",
};
