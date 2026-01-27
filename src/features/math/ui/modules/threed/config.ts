/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ThreeD Module Configuration
 */

import {
  defaultThreeDState,
  type MathModuleConfig,
} from "@features/math/types";
import { Layers } from "lucide-react";
export const threedConfig: MathModuleConfig = {
  id: "3d",
  label: (t: any) => t("calculus.layout.threed_surface"),
  icon: Layers,
  color: "text-purple-400",
  borderColor: "border-purple-500",
  initialState: defaultThreeDState,
};

// Auto-register on import
// registerModule(threedConfig); - Moved to centralized registration
