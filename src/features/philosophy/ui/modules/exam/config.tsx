/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Award } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const examConfig: PhilosophyModuleConfig = {
  id: "exam",
  label: (t: any) => t("philosophy.exam.title", "Examen Trainer"),
  icon: Award,
  description: "Exacte Examensimulatie",
  color: "rose",
  borderColor: "border-rose-500",
};
