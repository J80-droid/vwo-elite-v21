/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Cpu } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const technoHumanConfig: PhilosophyModuleConfig = {
  id: "techno-human",
  label: (t: any) =>
    t("philosophy.techno_anthropology.title", "Techno-Human Lab"),
  icon: Cpu,
  description: (t: any) => t("philosophy.techno_anthropology.description"),
  color: "cyan",
  borderColor: "border-cyan-400",
};
