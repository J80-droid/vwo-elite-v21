export type ModelVariable = {
  symbol: string; // bijv. 't', 'v', 'h'
  value: number; // Huidige waarde
  unit?: string; // bijv. 'm/s'
  isState: boolean; // Is dit een toestandsvariabele (die verandert)?
};

export type ModelConstant = {
  symbol: string; // bijv. 'g', 'm', 'C'
  value: number; // Waarde
  unit?: string;
};

export type ModelEquation = {
  lhs: string; // Left-hand side (bijv. 'F_res')
  rhs: string; // Right-hand side (bijv. 'm * g - k * v')
  latex?: string; // Voor mooie weergave
};

export interface NumericalModel {
  id: string;
  name: string;
  timeStep: number; // dt (bijv. 0.01s)
  duration: number; // Totale simulatietijd
  constants: ModelConstant[];
  initialValues: ModelVariable[];
  equations: string[]; // De ruwe regels (bijv. "v = v + a * dt")
}

export interface SimulationStep {
  t: number;
  [key: string]: number; // Dynamische waarden per tijdstap
}

export enum ErrorCategory {
  DIMENSION_MISMATCH = "DIMENSION_MISMATCH", // Appels + Peren
  MISSING_DT = "MISSING_DT", // v = v + a (Klassieke fout)
  SYNTAX = "SYNTAX", // Typefouten
}

export interface SocraticErrorContext {
  hasError: boolean;
  category?: ErrorCategory;
  technicalDetails?: string; // Voor de debug-log: "MathJS: Unit mismatch"
  studentCodeSnippet?: string; // De regel waar het misgaat: "v = v + a"
  conflictingUnits?: {
    // De botsende eenheden
    left: string; // bijv. "m/s"
    right: string; // bijv. "m/s^2"
  };
  aiSystemPrompt?: string; // De verborgen instructie voor de LLM
}

// Opslag & Scenario's
export interface SavedModelMetadata {
  id: string;
  name: string;
  description?: string; // Didactische context ("Repareer dit model")
  type: "user" | "scenario";
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Optioneel: base64 screenshot van de grafiek
}

export interface ModelStorageItem extends SavedModelMetadata {
  model: NumericalModel; // De volledige configuratie
}
