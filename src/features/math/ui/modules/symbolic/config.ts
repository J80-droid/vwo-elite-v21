/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Symbolic Module Configuration
 */

import {
  type MathModuleConfig,
  SymbolicModuleState,
} from "@features/math/types";
import { BrainCircuit } from "lucide-react";

export const defaultSymbolicState: SymbolicModuleState = {
  expression: "",
  history: [],
};

export const symbolicConfig: MathModuleConfig = {
  id: "symbolic",
  label: (t: any) => t("calculus.modules.symbolic"),
  icon: BrainCircuit,
  color: "text-amber-400",
  borderColor: "border-amber-500",
  initialState: defaultSymbolicState,
};

// registerModule(symbolicConfig); - Moved to centralized registration
