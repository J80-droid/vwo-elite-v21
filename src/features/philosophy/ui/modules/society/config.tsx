/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Globe2 } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const societyConfig: PhilosophyModuleConfig = {
  id: "society",
  label: (t: any) => t("philosophy.society.title", "Society Lab"),
  icon: Globe2,
  description: (t: any) => t("philosophy.identity_prism.description"),
  color: "violet",
  borderColor: "border-violet-500",
};
