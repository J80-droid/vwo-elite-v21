export interface StructuredReactionData {
  electrons: number;
  reactants: { species: string; coeff: number }[];
  products: { species: string; coeff: number }[];
}

export interface RedoxEntry {
  v0: number;
  type: "oxidator" | "reductor" | "both";
  halfReaction: string;
  structured: StructuredReactionData;
}

// --- NEW SIMULATOR INTERFACES ---
export interface RedoxCouple {
  id: string;
  oxidator: string; // Ruwe string: "MnO4- + 8H+ + 5e-"
  reductor: string; // Ruwe string: "Mn2+ + 4H2O"
  potential: number;
}

export interface SimulationResult {
  canOccur: boolean;
  canReact?: boolean; // Alias for canOccur in some contexts
  deltaV: number;
  factors: { ox: number; red: number }; // Coëfficiënten voor balans
  log: string[]; // Uitleg voor de leerling
  totalReaction: string;
}
