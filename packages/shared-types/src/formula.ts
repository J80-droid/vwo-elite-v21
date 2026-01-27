// --- FORMULA ENGINE TYPES ---
export interface FormulaUnit {
  symbol: string;
  unit: string;
  name: string;
}

export interface Formula {
  id: string;
  name: string;
  formula: string; // Display LaTeX
  description: string;
  variables: string[]; // e.g. ["F", "m", "a"]
  units: { symbol: string; unit: string; name: string }[];
  category?: "Natuurkunde" | "Scheikunde" | "Wiskunde B";
  keywords?: string[];

  // New Elite Fields
  symbolic?: string; // Nerdamer parsable format (e.g. "F=m*a")
  binasTable?: string; // Reference to Binas table (e.g. "35-A1")
}

// Alias for backward compatibility if needed, or if they are the same
export type FormulaEntry = Formula;

export interface CalculusLog {
  id: string;
  timestamp: number;
  problem: string; // De ruwe input, bijv: "int x^2"
  cleanFunction: string; // De functie om te plotten: "x^2"
  category: "diff" | "int" | "lim" | "algebra";
  ruleUsed: string; // Bijv: "Kettingregel"
  difficulty: "easy" | "medium" | "hard";
}
