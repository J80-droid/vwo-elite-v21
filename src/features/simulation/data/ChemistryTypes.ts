/* eslint-disable @typescript-eslint/no-explicit-any */
export type EnvironmentType = "neutral" | "acid" | "base";

export interface RedoxStructuredSide {
  electrons: number;
  reactants: { species: string; coeff: number }[];
  products: { species: string; coeff: number }[];
}

export interface RedoxEntry {
  v0: number;
  type: "oxidator" | "reductor" | "both";
  halfReaction: string;
  structured?: RedoxStructuredSide;
}

export interface ReactantDef {
  id: string;
  name: string;
  formula: string;
  state: "s" | "l" | "g" | "aq";
  color: string;
  category: "acid" | "base" | "salt" | "metal" | "oxide" | "other";
  ions?: [string, string];
  tags?: string[];
  redox?: RedoxEntry | RedoxEntry[];
}

export interface ReactionDef {
  reactants: string[];
  products: string;
  observation: string;
  observationKey?: string;
  observationData?: Record<string, any>;
  type: string;
  typeKey?: string;
  equation?: string;
  conditions?: string;
  resultColor?: string;
  visualMix?: boolean;
}
