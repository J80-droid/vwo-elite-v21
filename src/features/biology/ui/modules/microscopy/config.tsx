/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { ZoomIn } from "lucide-react";

import { BiologyModuleConfig } from "../../../types";
export const microscopyConfig: BiologyModuleConfig = {
  id: "microscopy",
  label: (t: any) => t("biology.modules.microscopy"),
  icon: ZoomIn,
  description: "Virtuele Microscoop & Catalogus",
  color: "blue",
  borderColor: "border-blue-500",
};
