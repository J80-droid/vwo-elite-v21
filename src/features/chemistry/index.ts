// Public API for chemistry feature
// Only export components that are intended for cross-feature use

// UI Components for cross-feature use
export { default as ChemicalFormatter } from "./ui/ui/ChemicalFormatter";
export { ChemicalFormula } from "./ui/ui/ChemicalFormula";

// Hooks for cross-feature use
export { useModuleState } from "./hooks/ChemistryLabContext";
