/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Dna } from "lucide-react";

import { BiologyModuleConfig } from "../../../types";
export const genomicsConfig: BiologyModuleConfig = {
  id: "genomics",
  label: (t: any) => t("biology.modules.genomics"),
  icon: Dna,
  description: "DNA Sequentie Editor & PDB Viewer",
  color: "emerald",
  borderColor: "border-emerald-500",
};
