/* eslint-disable @typescript-eslint/no-explicit-any */
import { Lightbulb } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const logicConfig: PhilosophyModuleConfig = {
  id: "logic",
  label: (t: any) => t("philosophy.logic.title", "Logica Lab"),
  icon: Lightbulb,
  description: "Redeneerkunst & Drogredenen",
  color: "amber",
  borderColor: "border-amber-500",
};
