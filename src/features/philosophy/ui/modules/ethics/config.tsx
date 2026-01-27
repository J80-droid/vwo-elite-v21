/* eslint-disable @typescript-eslint/no-explicit-any */
import { Scale } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const ethicsConfig: PhilosophyModuleConfig = {
  id: "ethics",
  label: (t: any) => t("philosophy.ethics.title", "Ethiek Lab"),
  icon: Scale,
  description: "Morele Dilemma's",
  color: "emerald",
  borderColor: "border-emerald-500",
};
