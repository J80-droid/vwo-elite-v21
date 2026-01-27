/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Formulas Module Configuration
 */

import {
  FormulasModuleState,
  type MathModuleConfig,
} from "@features/math/types";
import { Book } from "lucide-react";

export const defaultFormulasState: FormulasModuleState = {
  search: "",
  browserOpen: false,
  activeCategory: null,
  selectedFormulaId: null,
  formulaInputs: {},
  targetVar: null,
  calculatedResult: null,
  binasVisConfig: null,
};

export const formulasConfig: MathModuleConfig = {
  id: "formulas",
  label: (t: any) => t("calculus.modules.formulas"),
  icon: Book,
  color: "text-pink-400",
  borderColor: "border-pink-500",
  initialState: defaultFormulasState,
};

// registerModule(formulasConfig); - Moved to centralized registration
