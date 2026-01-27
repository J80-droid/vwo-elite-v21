/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { TreeDeciduous } from "lucide-react";

import { BiologyModuleConfig } from "../../../types";
export const ecologyConfig: BiologyModuleConfig = {
  id: "ecology",
  label: (t: any) => t("biology.modules.ecology"),
  icon: TreeDeciduous,
  description: "Ecosysteem Simulatie (Lotka-Volterra)",
  color: "lime",
  borderColor: "border-lime-500",
};
