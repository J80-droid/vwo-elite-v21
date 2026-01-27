/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Vectors Module Configuration
 */

import {
  defaultVectorsState,
  type MathModuleConfig,
} from "@features/math/types";
import { Box } from "lucide-react";
export const vectorsConfig: MathModuleConfig = {
  id: "vectors",
  label: (t: any) => t("calculus.layout.vector_space"),
  icon: Box,
  color: "text-cyan-400",
  borderColor: "border-cyan-500",
  initialState: defaultVectorsState,
};

// Auto-register on import
// registerModule(vectorsConfig); - Moved to centralized registration
