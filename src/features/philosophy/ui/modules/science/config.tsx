/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Microscope } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const scienceConfig: PhilosophyModuleConfig = {
  id: "science",
  label: (t: any) => t("philosophy.science.title", "Science Lab"),
  icon: Microscope,
  description: (t: any) => t("philosophy.science_timeline.module_description"),
  color: "teal",
  borderColor: "border-teal-500",
};
