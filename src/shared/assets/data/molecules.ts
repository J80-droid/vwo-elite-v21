// VWO Chemistry Molecules Database
// Ball-and-stick models for stereo-isomerie training

export type Element = "C" | "H" | "O" | "N" | "Cl" | "Br" | "F" | "S" | "P";
export type Vec3 = [number, number, number];

export interface Atom {
  element: Element;
  position: Vec3;
}

export interface Bond {
  from: number;
  to: number;
  type: "single" | "double" | "triple";
}

export interface Molecule {
  name: string;
  nameDutch: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
  chiralCenters: number[]; // Indices of chiral carbon atoms
  rsConfiguration?: Record<number, "R" | "S">; // R/S config per chiral center index
  difficulty: "easy" | "medium" | "hard";
  smiles?: string;
}

// Atom colors following CPK convention
export const ATOM_COLORS: Record<Element, string> = {
  C: "#333333", // Dark gray
  H: "#ffffff", // White
  O: "#ff0000", // Red
  N: "#0000ff", // Blue
  Cl: "#00ff00", // Green
  Br: "#8b0000", // Dark red
  F: "#90ee90", // Light green
  S: "#ffff00", // Yellow
  P: "#ffa500", // Orange
};

// Atom radii (relative scale)
export const ATOM_RADII: Record<Element, number> = {
  C: 0.3,
  H: 0.2,
  O: 0.28,
  N: 0.28,
  Cl: 0.35,
  Br: 0.4,
  F: 0.25,
  S: 0.35,
  P: 0.35,
};

// Valence rules for chemical validity
const VALENCE_RULES: Record<Element, number> = {
  C: 4,
  H: 1,
  O: 2,
  N: 3,
  Cl: 1,
  Br: 1,
  F: 1,
  S: 2, // Can be 4 or 6, but 2 is baseline for simple VWO organic
  P: 3, // Baseline
};

export interface ValidationError {
  atomIndex: number;
  element: Element;
  currentBonds: number;
  expectedBonds: number;
  message: string;
}

/**
 * Validates a molecule structure against valence rules.
 */
export const validateMolecule = (molecule: Molecule): ValidationError[] => {
  const errors: ValidationError[] = [];
  const bondCounts = new Array(molecule.atoms.length).fill(0);

  molecule.bonds.forEach((bond) => {
    const value = bond.type === "triple" ? 3 : bond.type === "double" ? 2 : 1;
    bondCounts[bond.from] += value;
    bondCounts[bond.to] += value;
  });

  molecule.atoms.forEach((atom, i) => {
    const expected = VALENCE_RULES[atom.element];
    const actual = bondCounts[i];

    if (expected && actual !== expected) {
      // S and P special cases (hypervalent) - VWO level often sticks to 2 for S and 3 for P, but allow 6/5
      if (
        (atom.element === "S" && actual === 6) ||
        (atom.element === "P" && actual === 5)
      ) {
        return; // Valid hypervalent exceptions
      }

      errors.push({
        atomIndex: i,
        element: atom.element,
        currentBonds: actual,
        expectedBonds: expected,
        message: `${atom.element} (atoom #${i + 1}) heeft ${actual} verbindingen, verwacht ${expected}.`,
      });
    }
  });

  return errors;
};

// --- Simple Molecules (VWO Scheikunde Level) ---

export const MOLECULES: Molecule[] = [
  // Easy - Simple chiral center
  {
    name: "Lactic Acid",
    nameDutch: "Melkzuur",
    formula: "C₃H₆O₃",
    difficulty: "easy",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" }, // L-Lactic Acid is S-configuration
    smiles: "CC(O)C(=O)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH carbon
      { element: "C", position: [-1.5, 0, 0] }, // 2: CH3
      { element: "O", position: [2.3, 1, 0] }, // 3: =O
      { element: "O", position: [2.3, -1, 0] }, // 4: -OH
      { element: "O", position: [0, 1.5, 0] }, // 5: -OH on chiral
      { element: "H", position: [0, -1, 0.8] }, // 6: H on chiral
      { element: "H", position: [-2, 0.8, 0.5] }, // 7: CH3
      { element: "H", position: [-2, -0.8, 0.5] }, // 8: CH3
      { element: "H", position: [-2, 0, -1] }, // 9: CH3
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 3, type: "double" },
      { from: 1, to: 4, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
    ],
  },
  // Easy - Alanine
  {
    name: "Alanine",
    nameDutch: "Alanine (aminozuur)",
    formula: "C₃H₇NO₂",
    difficulty: "easy",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" }, // L-Alanine is S-configuration
    smiles: "CC(N)C(=O)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.5, 0, 0] }, // 2: CH3
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH
      { element: "H", position: [0, -1, 0.8] }, // 6: H on chiral
      { element: "H", position: [-2, 0.8, 0.5] }, // 7-9: CH3
      { element: "H", position: [-2, -0.8, 0.5] },
      { element: "H", position: [-2, 0, -1] },
      { element: "H", position: [0.5, 2.2, 0.5] }, // 10-11: NH2
      { element: "H", position: [-0.5, 2.2, -0.5] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 3, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
    ],
  },
  // Medium - 2-Butanol
  {
    name: "2-Butanol",
    nameDutch: "2-Butanol",
    formula: "C₄H₁₀O",
    difficulty: "medium",
    chiralCenters: [1],
    rsConfiguration: { 1: "R" }, // (R)-2-Butanol
    smiles: "CCC(C)O",
    atoms: [
      { element: "C", position: [-1.5, 0, 0] }, // 0: CH3
      { element: "C", position: [0, 0, 0] }, // 1: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 2: CH2
      { element: "C", position: [3, 0, 0] }, // 3: CH3
      { element: "O", position: [0, 1.5, 0] }, // 4: OH
      { element: "H", position: [0, -1, 0.8] }, // 5: H on chiral
      { element: "H", position: [-2, 0.8, 0] }, // 6-8: first CH3
      { element: "H", position: [-2, -0.4, 0.8] },
      { element: "H", position: [-2, -0.4, -0.8] },
      { element: "H", position: [1.5, 0.8, 0.8] }, // 9-10: CH2
      { element: "H", position: [1.5, -0.8, 0.8] },
      { element: "H", position: [3.5, 0.8, 0] }, // 11-13: last CH3
      { element: "H", position: [3.5, -0.4, 0.8] },
      { element: "H", position: [3.5, -0.4, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 1, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
      { from: 3, to: 12, type: "single" },
      { from: 3, to: 13, type: "single" },
    ],
  },
  // Medium - Glyceraldehyde
  {
    name: "Glyceraldehyde",
    nameDutch: "Glyceraldehyde",
    formula: "C₃H₆O₃",
    difficulty: "medium",
    chiralCenters: [1],
    rsConfiguration: { 1: "R" }, // D-Glyceraldehyde is R-configuration
    smiles: "OCC(O)C=O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: CHO
      { element: "C", position: [1.5, 0, 0] }, // 1: Chiral CHOH
      { element: "C", position: [3, 0, 0] }, // 2: CH2OH
      { element: "O", position: [-0.5, 1.2, 0] }, // 3: =O aldehyde
      { element: "H", position: [-0.8, -0.8, 0] }, // 4: H aldehyde
      { element: "O", position: [1.5, 1.5, 0] }, // 5: OH on chiral
      { element: "H", position: [1.5, -1, 0.8] }, // 6: H on chiral
      { element: "O", position: [4, 0.8, 0] }, // 7: CH2OH oxygen
      { element: "H", position: [3, 0.8, 0.8] }, // 8-9: CH2
      { element: "H", position: [3, -0.8, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 0, to: 3, type: "double" },
      { from: 0, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
    ],
  },
  // Hard - 2-Chlorobutane
  {
    name: "2-Chlorobutane",
    nameDutch: "2-Chloorbutaan",
    formula: "C₄H₉Cl",
    difficulty: "hard",
    chiralCenters: [1],
    rsConfiguration: { 1: "S" }, // (S)-2-Chlorobutane
    smiles: "CCC(C)Cl",
    atoms: [
      { element: "C", position: [-1.5, 0, 0] }, // 0: CH3
      { element: "C", position: [0, 0, 0] }, // 1: Chiral CHCl
      { element: "C", position: [1.5, 0, 0] }, // 2: CH2
      { element: "C", position: [3, 0, 0] }, // 3: CH3
      { element: "Cl", position: [0, 1.8, 0] }, // 4: Cl
      { element: "H", position: [0, -1, 0.8] }, // 5: H on chiral
      { element: "H", position: [-2, 0.8, 0] }, // 6-8: first CH3
      { element: "H", position: [-2, -0.4, 0.8] },
      { element: "H", position: [-2, -0.4, -0.8] },
      { element: "H", position: [1.5, 0.8, 0.8] }, // 9-10: CH2
      { element: "H", position: [1.5, -0.8, 0.8] },
      { element: "H", position: [3.5, 0.8, 0] }, // 11-13: last CH3
      { element: "H", position: [3.5, -0.4, 0.8] },
      { element: "H", position: [3.5, -0.4, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 1, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
      { from: 3, to: 12, type: "single" },
      { from: 3, to: 13, type: "single" },
    ],
  },

  // --- Additional Amino Acids ---
  // Serine (S-configuration)
  {
    name: "Serine",
    nameDutch: "Serine (aminozuur)",
    formula: "C₃H₇NO₃",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    smiles: "C(C(C(=O)O)N)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0.5, 0.5] }, // 2: CH2OH
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH carboxyl
      { element: "O", position: [-2.2, 0.3, 0.8] }, // 6: -OH hydroxyl
      { element: "H", position: [0, -1, 0.8] }, // 7: H on chiral
      { element: "H", position: [-1.2, 1.4, 0] }, // 8: CH2
      { element: "H", position: [-1.2, 0.3, 1.5] }, // 9: CH2
      { element: "H", position: [0.5, 2.2, 0.5] }, // 10: NH2
      { element: "H", position: [-0.5, 2.2, -0.5] }, // 11: NH2
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 3, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
    ],
  },

  // Valine (S-configuration)
  {
    name: "Valine",
    nameDutch: "Valine (aminozuur)",
    formula: "C₅H₁₁NO₂",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    smiles: "CC(C)C(C(=O)O)N",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0, 0.8] }, // 2: CH(CH3)2
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH
      { element: "C", position: [-2.2, 0.8, 0.2] }, // 6: CH3
      { element: "C", position: [-1.5, -0.8, 1.5] }, // 7: CH3
      { element: "H", position: [0, -1, -0.8] }, // 8: H on chiral
      { element: "H", position: [-1, 0.6, 1.6] }, // 9: CH
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 3, to: 10, type: "single" },
    ],
  },

  // Phenylalanine (S-configuration)
  {
    name: "Phenylalanine",
    nameDutch: "Fenylalanine (aminozuur)",
    formula: "C₉H₁₁NO₂",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    smiles: "C1=CC=C(C=C1)CC(C(=O)O)N",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0.5, 0] }, // 2: CH2
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH
      { element: "C", position: [-2.5, 0, 0] }, // 6: Phenyl C1
      { element: "C", position: [-3.2, 1.1, 0] }, // 7: Phenyl C2
      { element: "C", position: [-4.6, 1.1, 0] }, // 8: Phenyl C3
      { element: "C", position: [-5.3, 0, 0] }, // 9: Phenyl C4
      { element: "C", position: [-4.6, -1.1, 0] }, // 10: Phenyl C5
      { element: "C", position: [-3.2, -1.1, 0] }, // 11: Phenyl C6
      { element: "H", position: [0, -1, 0.8] }, // 12: H on chiral
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 12, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 7, to: 8, type: "single" },
      { from: 8, to: 9, type: "double" },
      { from: 9, to: 10, type: "single" },
      { from: 10, to: 11, type: "double" },
      { from: 11, to: 6, type: "single" },
    ],
  },

  // --- Alcohols ---
  // 2-Propanol (no chiral center - for comparison)
  {
    name: "Isopropanol",
    nameDutch: "2-Propanol (isopropylalcohol)",
    formula: "C₃H₈O",
    difficulty: "easy",
    chiralCenters: [],
    smiles: "CC(C)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Central C
      { element: "C", position: [-1.5, 0, 0] }, // 1: CH3
      { element: "C", position: [1.5, 0, 0] }, // 2: CH3
      { element: "O", position: [0, 1.3, 0] }, // 3: OH
      { element: "H", position: [0, -1, 0] }, // 4: H
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
    ],
  },

  // Mandelic Acid (R-configuration)
  {
    name: "Mandelic Acid",
    nameDutch: "Mandelzuur",
    formula: "C₈H₈O₃",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "R" },
    smiles: "C1=CC=C(C=C1)C(C(=O)O)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0.5, 0] }, // 2: Phenyl C1
      { element: "O", position: [0, -1.3, 0.5] }, // 3: OH
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH carboxyl
      { element: "C", position: [-2.0, 1.5, 0.5] }, // 6: Phenyl C2
      { element: "C", position: [-3.3, 1.8, 0.5] }, // 7: Phenyl C3
      { element: "C", position: [-4.0, 0.8, 0] }, // 8: Phenyl C4
      { element: "C", position: [-3.2, -0.2, -0.5] }, // 9: Phenyl C5
      { element: "C", position: [-1.9, 0, -0.5] }, // 10: Phenyl C6
      { element: "H", position: [0.3, 0.8, 0.8] }, // 11: H on chiral
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 11, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "double" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 8, type: "double" },
      { from: 8, to: 9, type: "single" },
      { from: 9, to: 10, type: "double" },
      { from: 10, to: 2, type: "single" },
    ],
  },

  // --- Halogenoalkanes ---
  // 2-Bromobutane (R-configuration)
  {
    name: "2-Bromobutane",
    nameDutch: "2-Broombutaan",
    formula: "C₄H₉Br",
    difficulty: "hard",
    chiralCenters: [1],
    rsConfiguration: { 1: "R" },
    smiles: "CCC(C)Br",
    atoms: [
      { element: "C", position: [-1.5, 0, 0] }, // 0: CH3
      { element: "C", position: [0, 0, 0] }, // 1: Chiral CHBr
      { element: "C", position: [1.5, 0, 0] }, // 2: CH2
      { element: "C", position: [3, 0, 0] }, // 3: CH3
      { element: "Br", position: [0, 1.9, 0] }, // 4: Br
      { element: "H", position: [0, -1, 0.8] }, // 5: H on chiral
      { element: "H", position: [-2, 0.8, 0] }, // 6-8: first CH3
      { element: "H", position: [-2, -0.4, 0.8] },
      { element: "H", position: [-2, -0.4, -0.8] },
      { element: "H", position: [1.5, 0.8, 0.8] }, // 9-10: CH2
      { element: "H", position: [1.5, -0.8, 0.8] },
      { element: "H", position: [3.5, 0.8, 0] }, // 11-13: last CH3
      { element: "H", position: [3.5, -0.4, 0.8] },
      { element: "H", position: [3.5, -0.4, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 1, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
      { from: 3, to: 12, type: "single" },
      { from: 3, to: 13, type: "single" },
    ],
  },

  // 1-Chloro-2-propanol (S-configuration)
  {
    name: "1-Chloro-2-propanol",
    nameDutch: "1-Chloor-2-propanol",
    formula: "C₃H₇ClO",
    difficulty: "medium",
    chiralCenters: [1],
    rsConfiguration: { 1: "S" },
    smiles: "CC(O)CCl",
    atoms: [
      { element: "C", position: [-1.5, 0, 0] }, // 0: CH2Cl
      { element: "C", position: [0, 0, 0] }, // 1: Chiral CHOH
      { element: "C", position: [1.5, 0, 0] }, // 2: CH3
      { element: "Cl", position: [-2.5, 1, 0] }, // 3: Cl
      { element: "O", position: [0, 1.5, 0] }, // 4: OH
      { element: "H", position: [0, -1, 0.8] }, // 5: H on chiral
      { element: "H", position: [-1.5, -0.8, 0.8] }, // 6: CH2
      { element: "H", position: [-1.5, -0.8, -0.8] }, // 7: CH2
      { element: "H", position: [2, 0.8, 0.5] }, // 8-10: CH3
      { element: "H", position: [2, -0.8, 0.5] },
      { element: "H", position: [2, 0, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 1, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
    ],
  },

  // --- Sugars (simplified) ---
  // D-Ribose (simplified - 1 chiral center shown)
  {
    name: "Ribose",
    nameDutch: "Ribose (suiker)",
    formula: "C₅H₁₀O₅",
    difficulty: "hard",
    chiralCenters: [1],
    rsConfiguration: { 1: "R" },
    smiles: "C(C(C(C(C=O)O)O)O)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: CHO
      { element: "C", position: [1.5, 0, 0] }, // 1: Chiral CHOH
      { element: "C", position: [3, 0, 0] }, // 2: CHOH
      { element: "C", position: [4.5, 0, 0] }, // 3: CHOH
      { element: "C", position: [6, 0, 0] }, // 4: CH2OH
      { element: "O", position: [-0.5, 1.2, 0] }, // 5: =O aldehyde
      { element: "O", position: [1.5, 1.5, 0] }, // 6: OH
      { element: "O", position: [3, 1.5, 0] }, // 7: OH
      { element: "O", position: [4.5, 1.5, 0] }, // 8: OH
      { element: "O", position: [7, 0.5, 0] }, // 9: OH
      { element: "H", position: [-0.8, -0.8, 0] }, // 10: H aldehyde
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 0, to: 5, type: "double" },
      { from: 1, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 3, to: 8, type: "single" },
      { from: 4, to: 9, type: "single" },
      { from: 0, to: 10, type: "single" },
    ],
  },

  // Leucine (S-configuration)
  {
    name: "Leucine",
    nameDutch: "Leucine (aminozuur)",
    formula: "C₆H₁₃NO₂",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    smiles: "CC(C)CC(C(=O)O)N",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0.3, 0.5] }, // 2: CH2
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH
      { element: "C", position: [-2.5, -0.2, 0] }, // 6: CH(CH3)2
      { element: "C", position: [-3.5, 0.8, 0.5] }, // 7: CH3
      { element: "C", position: [-3, -1.5, -0.5] }, // 8: CH3
      { element: "H", position: [0, -1, 0.8] }, // 9: H on chiral
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 6, to: 8, type: "single" },
    ],
  },

  // Cysteine (R-configuration)
  {
    name: "Cysteine",
    nameDutch: "Cysteïne (aminozuur)",
    formula: "C₃H₇NO₂S",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "R" },
    smiles: "C(C(C(=O)O)N)S",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0.3, 0.5] }, // 2: CH2
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH
      { element: "S", position: [-2.5, -0.2, 0] }, // 6: SH (thiol)
      { element: "H", position: [0, -1, 0.8] }, // 7: H on chiral
      { element: "H", position: [-1.2, 1.2, 0.8] }, // 8: CH2
      { element: "H", position: [-1.2, 0.2, 1.5] }, // 9: CH2
      { element: "H", position: [-3.2, 0.5, 0.5] }, // 10: SH
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 6, to: 10, type: "single" },
    ],
  },

  // Threonine (2 chiral centers)
  {
    name: "Threonine",
    nameDutch: "Threonine (aminozuur)",
    formula: "C₄H₉NO₃",
    difficulty: "hard",
    chiralCenters: [0, 2],
    rsConfiguration: { 0: "S", 2: "R" },
    smiles: "CC(C(C(=O)O)N)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center (alpha)
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0.3, 0.5] }, // 2: Chiral center (beta)
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH carboxyl
      { element: "O", position: [-1.5, 1.5, 0.8] }, // 6: OH on beta carbon
      { element: "C", position: [-2.5, -0.5, 0] }, // 7: CH3
      { element: "H", position: [0, -1, 0.8] }, // 8: H on alpha
      { element: "H", position: [-1, 0, 1.5] }, // 9: H on beta
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 9, type: "single" },
    ],
  },

  // Isoleucine (2 chiral centers)
  {
    name: "Isoleucine",
    nameDutch: "Isoleucine (aminozuur)",
    formula: "C₆H₁₃NO₂",
    difficulty: "hard",
    chiralCenters: [0, 2],
    rsConfiguration: { 0: "S", 2: "S" },
    smiles: "CCC(C)C(C(=O)O)N",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: Chiral center (alpha)
      { element: "C", position: [1.5, 0, 0] }, // 1: COOH
      { element: "C", position: [-1.2, 0.3, 0.5] }, // 2: Chiral center (beta)
      { element: "N", position: [0, 1.5, 0] }, // 3: NH2
      { element: "O", position: [2.3, 1, 0] }, // 4: =O
      { element: "O", position: [2.3, -1, 0] }, // 5: -OH
      { element: "C", position: [-2, 1.2, 1.2] }, // 6: CH3 on beta
      { element: "C", position: [-2.2, -0.5, -0.5] }, // 7: CH2
      { element: "C", position: [-3.5, -0.2, -1] }, // 8: CH3 terminal
      { element: "H", position: [0, -1, 0.8] }, // 9: H on alpha
      { element: "H", position: [-0.8, 0, 1.4] }, // 10: H on beta
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 7, to: 8, type: "single" },
    ],
  },

  // 2-Fluorobutane (S-configuration)
  {
    name: "2-Fluorobutane",
    nameDutch: "2-Fluorbutaan",
    formula: "C₄H₉F",
    difficulty: "easy",
    chiralCenters: [1],
    rsConfiguration: { 1: "S" },
    atoms: [
      { element: "C", position: [-1.5, 0, 0] }, // 0: CH3
      { element: "C", position: [0, 0, 0] }, // 1: Chiral CHF
      { element: "C", position: [1.5, 0, 0] }, // 2: CH2
      { element: "C", position: [3, 0, 0] }, // 3: CH3
      { element: "F", position: [0, 1.4, 0] }, // 4: F
      { element: "H", position: [0, -1, 0.8] }, // 5: H on chiral
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 1, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
    ],
  },

  // Malic Acid (S-configuration - appelzuur)
  {
    name: "Malic Acid",
    nameDutch: "Appelzuur",
    formula: "C₄H₆O₅",
    difficulty: "medium",
    chiralCenters: [1],
    rsConfiguration: { 1: "S" },
    smiles: "C(C(C(=O)O)O)C(=O)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: COOH
      { element: "C", position: [1.5, 0, 0] }, // 1: Chiral CHOH
      { element: "C", position: [3, 0, 0] }, // 2: CH2
      { element: "C", position: [4.5, 0, 0] }, // 3: COOH
      { element: "O", position: [-0.5, 1.2, 0] }, // 4: =O
      { element: "O", position: [-0.5, -1.2, 0] }, // 5: -OH
      { element: "O", position: [1.5, 1.5, 0] }, // 6: OH on chiral
      { element: "O", position: [5, 1.2, 0] }, // 7: =O
      { element: "O", position: [5, -1.2, 0] }, // 8: -OH
      { element: "H", position: [1.5, -1, 0.8] }, // 9: H on chiral
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 0, to: 4, type: "double" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 1, to: 9, type: "single" },
      { from: 3, to: 7, type: "double" },
      { from: 3, to: 8, type: "single" },
    ],
  },

  // Tartaric Acid (2 chiral centers - R,R configuration)
  {
    name: "Tartaric Acid",
    nameDutch: "Wijnsteenzuur",
    formula: "C₄H₆O₆",
    difficulty: "hard",
    chiralCenters: [1, 2],
    rsConfiguration: { 1: "R", 2: "R" },
    smiles: "C(C(C(=O)O)O)(C(=O)O)O",
    atoms: [
      { element: "C", position: [0, 0, 0] }, // 0: COOH
      { element: "C", position: [1.5, 0, 0] }, // 1: Chiral CHOH
      { element: "C", position: [3, 0, 0] }, // 2: Chiral CHOH
      { element: "C", position: [4.5, 0, 0] }, // 3: COOH
      { element: "O", position: [-0.5, 1.2, 0] }, // 4: =O
      { element: "O", position: [-0.5, -1.2, 0] }, // 5: -OH
      { element: "O", position: [1.5, 1.5, 0] }, // 6: OH
      { element: "O", position: [3, 1.5, 0] }, // 7: OH
      { element: "O", position: [5, 1.2, 0] }, // 8: =O
      { element: "O", position: [5, -1.2, 0] }, // 9: -OH
      { element: "H", position: [1.5, -1, 0.8] }, // 10: H
      { element: "H", position: [3, -1, 0.8] }, // 11: H
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 0, to: 4, type: "double" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 1, to: 10, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 11, type: "single" },
      { from: 3, to: 8, type: "double" },
      { from: 3, to: 9, type: "single" },
    ],
  },

  // --- Batch 2: More Amino Acids ---
  {
    name: "Methionine",
    nameDutch: "Methionine (aminozuur)",
    formula: "C₅H₁₁NO₂S",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.3, 0.5] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-2.5, -0.2, 0] },
      { element: "S", position: [-3.8, 0.5, 0.5] },
      { element: "C", position: [-5, -0.3, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 8, type: "single" },
    ],
  },
  {
    name: "Tryptophan",
    nameDutch: "Tryptofaan (aminozuur)",
    formula: "C₁₁H₁₂N₂O₂",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "N", position: [-3.2, 1.2, 0] },
      { element: "C", position: [-3.5, -1, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 6, to: 8, type: "double" },
    ],
  },
  {
    name: "Histidine",
    nameDutch: "Histidine (aminozuur)",
    formula: "C₆H₉N₃O₂",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "N", position: [-3.5, 0.8, 0] },
      { element: "N", position: [-3, -1.2, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
    ],
  },
  {
    name: "Asparagine",
    nameDutch: "Asparagine (aminozuur)",
    formula: "C₄H₈N₂O₃",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "O", position: [-3.2, 1, 0] },
      { element: "N", position: [-3, -1, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
    ],
  },
  {
    name: "Glutamine",
    nameDutch: "Glutamine (aminozuur)",
    formula: "C₅H₁₀N₂O₃",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "C", position: [-3.8, 0.5, 0] },
      { element: "O", position: [-4.5, 1.5, 0] },
      { element: "N", position: [-4.3, -0.5, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 10, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 8, type: "double" },
      { from: 7, to: 9, type: "single" },
    ],
  },
  {
    name: "Aspartic Acid",
    nameDutch: "Asparaginezuur",
    formula: "C₄H₇NO₄",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "O", position: [-3.2, 1, 0] },
      { element: "O", position: [-3, -1, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
    ],
  },
  {
    name: "Glutamic Acid",
    nameDutch: "Glutaminezuur",
    formula: "C₅H₉NO₄",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "C", position: [-3.8, 0.5, 0] },
      { element: "O", position: [-4.5, 1.5, 0] },
      { element: "O", position: [-4.3, -0.5, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 10, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 8, type: "double" },
      { from: 7, to: 9, type: "single" },
    ],
  },
  {
    name: "Proline",
    nameDutch: "Proline (aminozuur)",
    formula: "C₅H₉NO₂",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1, 0.8, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "C", position: [-1.5, 2, 0] },
      { element: "C", position: [-0.5, 2.5, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 1, to: 4, type: "double" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 3, type: "single" },
    ],
  },
  {
    name: "Glycine",
    nameDutch: "Glycine (aminozuur)",
    formula: "C₂H₅NO₂",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "N", position: [0, 1.5, 0] },
      { element: "O", position: [2.3, 1, 0] },
      { element: "O", position: [2.3, -1, 0] },
      { element: "H", position: [-0.5, -0.5, 0.7] },
      { element: "H", position: [-0.5, -0.5, -0.7] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 3, type: "double" },
      { from: 1, to: 4, type: "single" },
    ],
  },
  {
    name: "Citric Acid",
    nameDutch: "Citroenzuur",
    formula: "C₆H₈O₇",
    difficulty: "hard",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-2, 0, 0] },
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [2, 0, 0] },
      { element: "C", position: [0, 1.5, 0] },
      { element: "O", position: [-2.8, 1, 0] },
      { element: "O", position: [-2.8, -1, 0] },
      { element: "O", position: [2.8, 1, 0] },
      { element: "O", position: [2.8, -1, 0] },
      { element: "O", position: [0.8, 2.3, 0] },
      { element: "O", position: [-0.8, 2.3, 0] },
      { element: "O", position: [0, -1.3, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 1, to: 3, type: "single" },
      { from: 1, to: 10, type: "single" },
      { from: 0, to: 4, type: "double" },
      { from: 0, to: 5, type: "single" },
      { from: 2, to: 6, type: "double" },
      { from: 2, to: 7, type: "single" },
      { from: 3, to: 8, type: "double" },
      { from: 3, to: 9, type: "single" },
    ],
  },
  // --- Batch 3: Sugars and Pharmaceuticals ---
  {
    name: "Glucose",
    nameDutch: "Glucose (druivensuiker)",
    formula: "C₆H₁₂O₆",
    difficulty: "hard",
    chiralCenters: [1, 2, 3, 4],
    rsConfiguration: { 1: "R", 2: "S", 3: "R", 4: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [3, 0, 0] },
      { element: "C", position: [4.5, 0, 0] },
      { element: "C", position: [6, 0, 0] },
      { element: "C", position: [7.5, 0, 0] },
      { element: "O", position: [-0.5, 1.2, 0] },
      { element: "O", position: [1.5, 1.3, 0] },
      { element: "O", position: [3, 1.3, 0] },
      { element: "O", position: [4.5, 1.3, 0] },
      { element: "O", position: [6, 1.3, 0] },
      { element: "O", position: [8.3, 0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 0, to: 6, type: "double" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
      { from: 5, to: 11, type: "single" },
    ],
  },
  {
    name: "Fructose",
    nameDutch: "Fructose (vruchtensuiker)",
    formula: "C₆H₁₂O₆",
    difficulty: "hard",
    chiralCenters: [2, 3, 4],
    rsConfiguration: { 2: "R", 3: "R", 4: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [3, 0, 0] },
      { element: "C", position: [4.5, 0, 0] },
      { element: "C", position: [6, 0, 0] },
      { element: "C", position: [7.5, 0, 0] },
      { element: "O", position: [0, 1.3, 0] },
      { element: "O", position: [1.5, 1.3, 0] },
      { element: "O", position: [3, 1.3, 0] },
      { element: "O", position: [4.5, 1.3, 0] },
      { element: "O", position: [6, 1.3, 0] },
      { element: "O", position: [8.3, 0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 7, type: "double" },
      { from: 2, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
      { from: 5, to: 11, type: "single" },
    ],
  },
  {
    name: "Galactose",
    nameDutch: "Galactose (melksuiker)",
    formula: "C₆H₁₂O₆",
    difficulty: "hard",
    chiralCenters: [1, 2, 3, 4],
    rsConfiguration: { 1: "R", 2: "S", 3: "S", 4: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [3, 0, 0] },
      { element: "C", position: [4.5, 0, 0] },
      { element: "C", position: [6, 0, 0] },
      { element: "C", position: [7.5, 0, 0] },
      { element: "O", position: [-0.5, 1.2, 0] },
      { element: "O", position: [1.5, 1.3, 0] },
      { element: "O", position: [3, -1.3, 0] },
      { element: "O", position: [4.5, 1.3, 0] },
      { element: "O", position: [6, 1.3, 0] },
      { element: "O", position: [8.3, 0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 0, to: 6, type: "double" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
      { from: 5, to: 11, type: "single" },
    ],
  },
  {
    name: "Mannose",
    nameDutch: "Mannose",
    formula: "C₆H₁₂O₆",
    difficulty: "hard",
    chiralCenters: [1, 2, 3, 4],
    rsConfiguration: { 1: "S", 2: "S", 3: "R", 4: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [3, 0, 0] },
      { element: "C", position: [4.5, 0, 0] },
      { element: "C", position: [6, 0, 0] },
      { element: "C", position: [7.5, 0, 0] },
      { element: "O", position: [-0.5, 1.2, 0] },
      { element: "O", position: [1.5, -1.3, 0] },
      { element: "O", position: [3, 1.3, 0] },
      { element: "O", position: [4.5, 1.3, 0] },
      { element: "O", position: [6, 1.3, 0] },
      { element: "O", position: [8.3, 0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 0, to: 6, type: "double" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
      { from: 5, to: 11, type: "single" },
    ],
  },
  {
    name: "Ibuprofen",
    nameDutch: "Ibuprofen (pijnstiller)",
    formula: "C₁₃H₁₈O₂",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "C", position: [2.3, 1.2, 0] },
      { element: "O", position: [3, 2, 0] },
      { element: "O", position: [2.8, 0.3, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "C", position: [-3.2, 1.2, 0] },
      { element: "C", position: [-4.5, 1.2, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 3, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 7, to: 8, type: "single" },
    ],
  },
  {
    name: "Naproxen",
    nameDutch: "Naproxen (ontstekingsremmer)",
    formula: "C₁₄H₁₄O₃",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "C", position: [2.3, 1, 0] },
      { element: "O", position: [3, 1.8, 0] },
      { element: "O", position: [2.8, 0.2, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "O", position: [-3.5, 0.8, 0] },
      { element: "C", position: [-3, -1.2, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 3, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 6, to: 8, type: "double" },
    ],
  },
  {
    name: "Ketoprofen",
    nameDutch: "Ketoprofen",
    formula: "C₁₆H₁₄O₃",
    difficulty: "hard",
    chiralCenters: [0],
    rsConfiguration: { 0: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.2, 0.5, 0] },
      { element: "C", position: [2.3, 1, 0] },
      { element: "O", position: [3, 1.8, 0] },
      { element: "O", position: [2.8, 0.2, 0] },
      { element: "C", position: [-2.5, 0, 0] },
      { element: "C", position: [-3.5, 0.8, 0] },
      { element: "O", position: [-4, 1.8, 0] },
      { element: "H", position: [0, -1, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 1, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 3, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 8, type: "double" },
    ],
  },
  {
    name: "Menthol",
    nameDutch: "Menthol",
    formula: "C₁₀H₂₀O",
    difficulty: "medium",
    chiralCenters: [0, 1, 2],
    rsConfiguration: { 0: "R", 1: "R", 2: "S" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "O", position: [0, -1.3, 0] },
      { element: "C", position: [2.2, -1.2, 0] },
      { element: "C", position: [-2, 1.2, 0] },
      { element: "H", position: [0.5, 0.5, 0.9] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 5, to: 8, type: "single" },
    ],
  },
  {
    name: "Limonene",
    nameDutch: "Limoneen (citrusgeur)",
    formula: "C₁₀H₁₆",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [0, -1.5, 0] },
      { element: "C", position: [-1.2, -2, 0] },
      { element: "C", position: [1.2, -2, 0] },
      { element: "H", position: [0.5, 0.5, 0.9] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 6, to: 8, type: "double" },
    ],
  },
  {
    name: "Carvone",
    nameDutch: "Carvon (komijnzaadolie)",
    formula: "C₁₀H₁₄O",
    difficulty: "medium",
    chiralCenters: [0],
    rsConfiguration: { 0: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "O", position: [-1.5, 1.2, 0] },
      { element: "C", position: [0, -1.5, 0] },
      { element: "C", position: [-1.2, -2, 0] },
      { element: "H", position: [0.5, 0.5, 0.9] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "single" },
      { from: 5, to: 6, type: "double" },
      { from: 0, to: 7, type: "single" },
      { from: 7, to: 8, type: "double" },
    ],
  },

  // --- Batch 3: Vitamins & Bio-active ---
  {
    name: "Vitamin C",
    nameDutch: "Vitamine C (ascorbinezuur)",
    formula: "C₆H₈O₆",
    difficulty: "hard",
    chiralCenters: [4, 5],
    rsConfiguration: { 4: "S", 5: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "O", position: [-0.7, 1.2, 0] },
      { element: "O", position: [-0.8, -0.8, 0] },
      { element: "O", position: [3.4, 1.2, 0] },
      { element: "C", position: [2.2, 3.6, 0] },
      { element: "O", position: [1.5, 4.8, 0] },
      { element: "O", position: [-0.8, 3.2, 0] },
      { element: "H", position: [0.5, 0.5, 0.9] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 2, to: 7, type: "double" },
      { from: 3, to: 8, type: "single" },
      { from: 8, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
    ],
  },
  {
    name: "Dopamine",
    nameDutch: "Dopamine (neurotransmitter)",
    formula: "C₈H₁₁NO₂",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "O", position: [3.4, 1.2, 0] },
      { element: "O", position: [2.2, 3.6, 0] },
      { element: "C", position: [-1.5, -0.8, 0] },
      { element: "C", position: [-2.5, -1.8, 0] },
      { element: "N", position: [-3.5, -0.8, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "double" },
      { from: 2, to: 6, type: "single" },
      { from: 3, to: 7, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 8, to: 9, type: "single" },
      { from: 9, to: 10, type: "single" },
    ],
  },
  {
    name: "Adrenaline",
    nameDutch: "Adrenaline",
    formula: "C₉H₁₃NO₃",
    difficulty: "medium",
    chiralCenters: [8],
    rsConfiguration: { 8: "R" },
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "O", position: [3.4, 1.2, 0] },
      { element: "O", position: [2.2, 3.6, 0] },
      { element: "C", position: [-1.5, -0.8, 0] },
      { element: "O", position: [-1, -2, 0] },
      { element: "C", position: [-3, -0.8, 0] },
      { element: "N", position: [-4, -2, 0] },
      { element: "C", position: [-5, -1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "double" },
      { from: 2, to: 6, type: "single" },
      { from: 3, to: 7, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 8, to: 9, type: "single" },
      { from: 8, to: 10, type: "single" },
      { from: 10, to: 11, type: "single" },
      { from: 11, to: 12, type: "single" },
    ],
  },
  {
    name: "Serotonin",
    nameDutch: "Serotonine (gelukshormoon)",
    formula: "C₁₀H₁₂N₂O",
    difficulty: "hard",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "O", position: [3.4, 1.2, 0] },
      { element: "N", position: [-1.5, -0.8, 0] },
      { element: "C", position: [-0.8, -1.8, 0] },
      { element: "C", position: [0.5, -1.2, 0] },
      { element: "C", position: [1.5, -2, 0] },
      { element: "C", position: [2.5, -1.2, 0] },
      { element: "N", position: [3.5, -2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "double" },
      { from: 2, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 7, to: 8, type: "single" },
      { from: 8, to: 9, type: "double" },
      { from: 9, to: 0, type: "single" },
      { from: 9, to: 10, type: "single" },
      { from: 10, to: 11, type: "single" },
      { from: 11, to: 12, type: "single" },
    ],
  },
  {
    name: "Vanillin",
    nameDutch: "Vanilline",
    formula: "C₈H₈O₃",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [3.4, 1.2, 0] },
      { element: "O", position: [4.2, 0.5, 0] },
      { element: "O", position: [2.2, 3.6, 0] },
      { element: "C", position: [1.5, 4.4, 0] },
      { element: "O", position: [-1.8, 1.2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "double" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 3, to: 8, type: "single" },
      { from: 8, to: 9, type: "single" },
      { from: 5, to: 10, type: "single" },
    ],
  },
  {
    name: "Cinnamaldehyde",
    nameDutch: "Kaneelaldehyde",
    formula: "C₉H₈O",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [3.6, 1.2, 0] },
      { element: "C", position: [4.6, 0.5, 0] },
      { element: "C", position: [6, 1.2, 0] },
      { element: "O", position: [7, 0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "double" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 7, to: 8, type: "single" },
      { from: 8, to: 9, type: "double" },
    ],
  },
  {
    name: "Aspirin",
    nameDutch: "Aspirine (acetylsalicylzuur)",
    formula: "C₉H₈O₄",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.2, 1.2, 0] },
      { element: "C", position: [1.5, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [3.6, 1.2, 0] },
      { element: "O", position: [4.4, 0.5, 0] },
      { element: "O", position: [3.8, 2.4, 0] },
      { element: "O", position: [-1.8, 1.2, 0] },
      { element: "C", position: [-2.6, 0.5, 0] },
      { element: "O", position: [-2.2, -0.6, 0] },
      { element: "C", position: [-4, 0.8, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "double" },
      { from: 2, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
      { from: 5, to: 9, type: "single" },
      { from: 9, to: 10, type: "single" },
      { from: 10, to: 11, type: "double" },
      { from: 10, to: 12, type: "single" },
    ],
  },
  {
    name: "Ethanol",
    nameDutch: "Ethanol (alcohol)",
    formula: "C₂H₆O",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "O", position: [2.3, 1.2, 0] },
      { element: "H", position: [-0.5, 0.5, 0.5] },
      { element: "H", position: [-0.5, -0.5, 0.5] },
      { element: "H", position: [-0.5, 0, -0.8] },
      { element: "H", position: [1.5, -1, 0] },
      { element: "H", position: [1.5, 1, -0.8] },
      { element: "H", position: [3, 1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
    ],
  },
  {
    name: "Methanol",
    nameDutch: "Methanol (giftig)",
    formula: "CH₄O",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "O", position: [1.3, 0.5, 0] },
      { element: "H", position: [-0.5, 0.5, 0.5] },
      { element: "H", position: [-0.5, -0.5, 0.5] },
      { element: "H", position: [-0.5, 0, -0.8] },
      { element: "H", position: [2, 0, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
    ],
  },
  {
    name: "Acetic Acid",
    nameDutch: "Azijnzuur",
    formula: "C₂H₄O₂",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "O", position: [2.3, 1.2, 0] },
      { element: "O", position: [2.3, -1.2, 0] },
      { element: "H", position: [-0.5, 0.5, 0.5] },
      { element: "H", position: [-0.5, -0.5, 0.5] },
      { element: "H", position: [-0.5, 0, -0.8] },
      { element: "H", position: [3, -1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 1, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 3, to: 7, type: "single" },
    ],
  },
  {
    name: "Acetone",
    nameDutch: "Aceton",
    formula: "C₃H₆O",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [-1.5, 0, 0] },
      { element: "O", position: [0, 1.5, 0] },
      { element: "H", position: [1.8, 0.8, 0] },
      { element: "H", position: [1.8, -0.8, 0] },
      { element: "H", position: [1.8, 0, 0.8] },
      { element: "H", position: [-1.8, 0.8, 0] },
      { element: "H", position: [-1.8, -0.8, 0] },
      { element: "H", position: [-1.8, 0, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "double" },
      { from: 1, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
    ],
  },
  {
    name: "Formic Acid",
    nameDutch: "Mierenzuur",
    formula: "CH₂O₂",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "O", position: [1.2, 0.8, 0] },
      { element: "O", position: [1.2, -0.8, 0] },
      { element: "H", position: [-1, 0, 0] },
      { element: "H", position: [2, -0.8, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 2, to: 4, type: "single" },
    ],
  },
  {
    name: "Benzene",
    nameDutch: "Benzeen",
    formula: "C₆H₆",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [1.4, 0, 0] },
      { element: "C", position: [0.7, 1.2, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [-1.4, 0, 0] },
      { element: "C", position: [-0.7, -1.2, 0] },
      { element: "C", position: [0.7, -1.2, 0] },
      { element: "H", position: [2.5, 0, 0] },
      { element: "H", position: [1.2, 2.1, 0] },
      { element: "H", position: [-1.2, 2.1, 0] },
      { element: "H", position: [-2.5, 0, 0] },
      { element: "H", position: [-1.2, -2.1, 0] },
      { element: "H", position: [1.2, -2.1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
      { from: 5, to: 11, type: "single" },
    ],
  },
  {
    name: "Phenol",
    nameDutch: "Fenol",
    formula: "C₆H₆O",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [1.4, 0, 0] },
      { element: "C", position: [0.7, 1.2, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [-1.4, 0, 0] },
      { element: "C", position: [-0.7, -1.2, 0] },
      { element: "C", position: [0.7, -1.2, 0] },
      { element: "O", position: [2.5, 0.5, 0] },
      { element: "H", position: [3, 0, 0] },
      { element: "H", position: [1.2, 2.1, 0] },
      { element: "H", position: [-1.2, 2.1, 0] },
      { element: "H", position: [-2.5, 0, 0] },
      { element: "H", position: [-1.2, -2.1, 0] },
      { element: "H", position: [1.2, -2.1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 1, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 3, to: 10, type: "single" },
      { from: 4, to: 11, type: "single" },
      { from: 5, to: 12, type: "single" },
    ],
  },
  {
    name: "Toluene",
    nameDutch: "Tolueen",
    formula: "C₇H₈",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [1.4, 0, 0] },
      { element: "C", position: [0.7, 1.2, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [-1.4, 0, 0] },
      { element: "C", position: [-0.7, -1.2, 0] },
      { element: "C", position: [0.7, -1.2, 0] },
      { element: "C", position: [2.5, 0, 0] },
      { element: "H", position: [1.2, 2.1, 0] },
      { element: "H", position: [-1.2, 2.1, 0] },
      { element: "H", position: [-2.5, 0, 0] },
      { element: "H", position: [-1.2, -2.1, 0] },
      { element: "H", position: [1.2, -2.1, 0] },
      { element: "H", position: [3, 0.8, 0] },
      { element: "H", position: [3, -0.8, 0] },
      { element: "H", position: [3.3, 0, 0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
      { from: 5, to: 11, type: "single" },
      { from: 6, to: 12, type: "single" },
      { from: 6, to: 13, type: "single" },
      { from: 6, to: 14, type: "single" },
    ],
  },
  {
    name: "Benzoic Acid",
    nameDutch: "Benzoëzuur",
    formula: "C₇H₆O₂",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [1.4, 0, 0] },
      { element: "C", position: [0.7, 1.2, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [-1.4, 0, 0] },
      { element: "C", position: [-0.7, -1.2, 0] },
      { element: "C", position: [0.7, -1.2, 0] },
      { element: "C", position: [2.8, 0, 0] },
      { element: "O", position: [3.5, 1, 0] },
      { element: "O", position: [3.5, -1, 0] },
      { element: "H", position: [1.2, 2.1, 0] },
      { element: "H", position: [-1.2, 2.1, 0] },
      { element: "H", position: [-2.5, 0, 0] },
      { element: "H", position: [-1.2, -2.1, 0] },
      { element: "H", position: [1.2, -2.1, 0] },
      { element: "H", position: [4.2, -0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
      { from: 1, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
      { from: 4, to: 12, type: "single" },
      { from: 5, to: 13, type: "single" },
      { from: 8, to: 14, type: "single" },
    ],
  },
  {
    name: "Naphthalene",
    nameDutch: "Naftaleen (mottenballen)",
    formula: "C₁₀H₈",
    difficulty: "hard",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0.7, 0, 0] },
      { element: "C", position: [1.4, 1.2, 0] },
      { element: "C", position: [2.8, 1.2, 0] },
      { element: "C", position: [3.5, 0, 0] },
      { element: "C", position: [2.8, -1.2, 0] },
      { element: "C", position: [1.4, -1.2, 0] },
      { element: "C", position: [-0.7, 1.2, 0] },
      { element: "C", position: [-2.1, 1.2, 0] },
      { element: "C", position: [-2.8, 0, 0] },
      { element: "C", position: [-2.1, -1.2, 0] },
      { element: "C", position: [-0.7, -1.2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "double" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "double" },
      { from: 0, to: 10, type: "single" },
      { from: 10, to: 9, type: "double" },
      { from: 9, to: 8, type: "single" },
      { from: 8, to: 7, type: "double" },
      { from: 7, to: 6, type: "single" },
      { from: 6, to: 0, type: "single" },
    ],
  },
  {
    name: "Cyclohexane",
    nameDutch: "Cyclohexaan",
    formula: "C₆H₁₂",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [1.5, 0, 0.5] },
      { element: "C", position: [0.7, 1.3, -0.5] },
      { element: "C", position: [-0.7, 1.3, 0.5] },
      { element: "C", position: [-1.5, 0, -0.5] },
      { element: "C", position: [-0.7, -1.3, 0.5] },
      { element: "C", position: [0.7, -1.3, -0.5] },
      { element: "H", position: [1.5, 0, 1.5] },
      { element: "H", position: [2.5, 0, 0] },
      { element: "H", position: [0.7, 1.3, -1.5] },
      { element: "H", position: [0.7, 2.3, -0.5] },
      { element: "H", position: [-0.7, 1.3, 1.5] },
      { element: "H", position: [-0.7, 2.3, 0.5] },
      { element: "H", position: [-1.5, 0, -1.5] },
      { element: "H", position: [-2.5, 0, -0.5] },
      { element: "H", position: [-0.7, -1.3, 1.5] },
      { element: "H", position: [-0.7, -2.3, 0.5] },
      { element: "H", position: [0.7, -1.3, -1.5] },
      { element: "H", position: [0.7, -2.3, -0.5] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 1, to: 8, type: "single" },
      { from: 1, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 2, to: 11, type: "single" },
      { from: 3, to: 12, type: "single" },
      { from: 3, to: 13, type: "single" },
      { from: 4, to: 14, type: "single" },
      { from: 4, to: 15, type: "single" },
      { from: 5, to: 16, type: "single" },
      { from: 5, to: 17, type: "single" },
    ],
  },
  {
    name: "Urea",
    nameDutch: "Ureum",
    formula: "CH₄N₂O",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "O", position: [0, 1.2, 0] },
      { element: "N", position: [1.2, -0.8, 0] },
      { element: "N", position: [-1.2, -0.8, 0] },
      { element: "H", position: [1.2, -1.5, 0] },
      { element: "H", position: [2, -0.5, 0] },
      { element: "H", position: [-1.2, -1.5, 0] },
      { element: "H", position: [-2, -0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 2, to: 4, type: "single" },
      { from: 2, to: 5, type: "single" },
      { from: 3, to: 6, type: "single" },
      { from: 3, to: 7, type: "single" },
    ],
  },
  {
    name: "Ammonia",
    nameDutch: "Ammoniak",
    formula: "NH₃",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "N", position: [0, 0, 0] },
      { element: "H", position: [0, -1, 0] },
      { element: "H", position: [0.8, 0.5, 0.2] },
      { element: "H", position: [-0.8, 0.5, 0.2] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
    ],
  },

  // --- Batch 4: Plastics, Fatty Acids, & More ---
  {
    name: "Styrene",
    nameDutch: "styreen (monomeer)",
    formula: "C₈H₈",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0.5, 0] },
      { element: "C", position: [2.5, 1.5, 0] },
      { element: "C", position: [1.3, 2.8, 0] },
      { element: "C", position: [0, 2.8, 0] },
      { element: "C", position: [-1.2, 1.5, 0] },
      { element: "C", position: [-1.2, -1, 0] },
      { element: "C", position: [-2.4, -1.8, 0] },
      { element: "H", position: [-0.5, -1.5, 0] },
      { element: "H", position: [-3, -1.5, 0] },
      { element: "H", position: [-2.5, -2.8, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
      { from: 7, to: 9, type: "single" },
      { from: 7, to: 10, type: "single" },
    ],
  },
  {
    name: "Vinyl Chloride",
    nameDutch: "Vinylchloride (PVC monomeer)",
    formula: "C₂H₃Cl",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "Cl", position: [2.5, 1.2, 0] },
      { element: "H", position: [-0.5, 0.8, 0] },
      { element: "H", position: [-0.5, -0.8, 0] },
      { element: "H", position: [1.5, -1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
    ],
  },
  {
    name: "Ethene",
    nameDutch: "Etheen",
    formula: "C₂H₄",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "H", position: [-0.5, 0.8, 0] },
      { element: "H", position: [-0.5, -0.8, 0] },
      { element: "H", position: [2, 0.8, 0] },
      { element: "H", position: [2, -0.8, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 1, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
    ],
  },
  {
    name: "Propene",
    nameDutch: "Propeen",
    formula: "C₃H₆",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.5, 1.2, 0] },
      { element: "H", position: [-0.5, 0.8, 0] },
      { element: "H", position: [-0.5, -0.8, 0] },
      { element: "H", position: [1.5, -1, 0] },
      { element: "H", position: [2.2, 2.2, 0] },
      { element: "H", position: [3.5, 1.2, 0] },
      { element: "H", position: [2.5, 1.2, 1] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 2, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
    ],
  },
  {
    name: "Butadiene",
    nameDutch: "1,3-butadieen",
    formula: "C₄H₆",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.5, 1.2, 0] },
      { element: "C", position: [4, 1.2, 0] },
      { element: "H", position: [-0.5, 0.8, 0] },
      { element: "H", position: [-0.5, -0.8, 0] },
      { element: "H", position: [1.5, -1, 0] },
      { element: "H", position: [2.5, 2.2, 0] },
      { element: "H", position: [4.5, 0.4, 0] },
      { element: "H", position: [4.5, 2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 3, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
    ],
  },
  {
    name: "Isoprene",
    nameDutch: "Isopreen (natuurrubber)",
    formula: "C₅H₈",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "C", position: [2.5, 1.2, 0] },
      { element: "C", position: [4, 1.2, 0] },
      { element: "C", position: [1.5, -1.5, 0] },
      { element: "H", position: [-0.5, 0.8, 0] },
      { element: "H", position: [-0.5, -0.8, 0] },
      { element: "H", position: [2.5, 2.2, 0] },
      { element: "H", position: [4.5, 0.4, 0] },
      { element: "H", position: [4.5, 2, 0] },
      { element: "H", position: [0.5, -1.5, 0] },
      { element: "H", position: [2.5, -1.5, 0] },
      { element: "H", position: [1.5, -1.5, 1] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 1, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 3, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
      { from: 4, to: 10, type: "single" },
      { from: 4, to: 11, type: "single" },
      { from: 4, to: 12, type: "single" },
    ],
  },
  {
    name: "Formaldehyde",
    nameDutch: "Methanal (Formaldehyde)",
    formula: "CH₂O",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "O", position: [1.2, 0, 0] },
      { element: "H", position: [-0.6, 0.8, 0] },
      { element: "H", position: [-0.6, -0.8, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
    ],
  },
  {
    name: "Acetaldehyde",
    nameDutch: "Ethanal (Acetaldehyde)",
    formula: "C₂H₄O",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0, 0] },
      { element: "O", position: [2.3, 1.2, 0] },
      { element: "H", position: [-0.5, 0.5, 0.5] },
      { element: "H", position: [-0.5, -0.5, 0.5] },
      { element: "H", position: [-0.5, 0, -0.8] },
      { element: "H", position: [1.5, -1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
    ],
  },
  {
    name: "Chloroform",
    nameDutch: "Trichloormethaan",
    formula: "CHCl₃",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "Cl", position: [1.5, 0, 0] },
      { element: "Cl", position: [-0.8, 1.2, 0] },
      { element: "Cl", position: [-0.8, -1.2, 0] },
      { element: "H", position: [0, 0, 1.2] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
    ],
  },
  {
    name: "Carbon Tetrachloride",
    nameDutch: "Tetrachloormethaan",
    formula: "CCl₄",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "Cl", position: [1.5, 0, 0] },
      { element: "Cl", position: [-0.8, 1.2, 0] },
      { element: "Cl", position: [-0.8, -1.2, 0] },
      { element: "Cl", position: [0, 0, 1.6] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
    ],
  },
  {
    name: "Methane",
    nameDutch: "Methaan",
    formula: "CH₄",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "H", position: [1, 1, 1] },
      { element: "H", position: [-1, -1, 1] },
      { element: "H", position: [-1, 1, -1] },
      { element: "H", position: [1, -1, -1] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
    ],
  },
  {
    name: "Ethane",
    nameDutch: "Ethaan",
    formula: "C₂H₆",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-0.7, 0, 0] },
      { element: "C", position: [0.7, 0, 0] },
      { element: "H", position: [-1.2, 1, 0] },
      { element: "H", position: [-1.2, -0.5, 0.8] },
      { element: "H", position: [-1.2, -0.5, -0.8] },
      { element: "H", position: [1.2, 1, 0] },
      { element: "H", position: [1.2, -0.5, 0.8] },
      { element: "H", position: [1.2, -0.5, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
    ],
  },
  {
    name: "Propane",
    nameDutch: "Propaan",
    formula: "C₃H₈",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-1.4, 0, 0] },
      { element: "C", position: [0, 0.8, 0] },
      { element: "C", position: [1.4, 0, 0] },
      { element: "H", position: [-1.4, 1, 0] },
      { element: "H", position: [-2, -0.5, 0.8] },
      { element: "H", position: [-2, -0.5, -0.8] },
      { element: "H", position: [0, 0.8, 1.2] },
      { element: "H", position: [0, 0.8, -1.2] },
      { element: "H", position: [1.4, 1, 0] },
      { element: "H", position: [2, -0.5, 0.8] },
      { element: "H", position: [2, -0.5, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
    ],
  },
  {
    name: "Butane",
    nameDutch: "Butaan",
    formula: "C₄H₁₀",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-2, 0, 0] },
      { element: "C", position: [-0.6, 0.8, 0] },
      { element: "C", position: [0.6, -0.8, 0] },
      { element: "C", position: [2, 0, 0] },
      { element: "H", position: [-2, 1, 0] },
      { element: "H", position: [-2.6, -0.5, 0.8] },
      { element: "H", position: [-2.6, -0.5, -0.8] },
      { element: "H", position: [-0.6, 1.4, 0.8] },
      { element: "H", position: [-0.6, 1.4, -0.8] },
      { element: "H", position: [0.6, -1.4, 0.8] },
      { element: "H", position: [0.6, -1.4, -0.8] },
      { element: "H", position: [2, 1, 0] },
      { element: "H", position: [2.6, -0.5, 0.8] },
      { element: "H", position: [2.6, -0.5, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 1, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
      { from: 3, to: 12, type: "single" },
      { from: 3, to: 13, type: "single" },
    ],
  },
  {
    name: "Pentane",
    nameDutch: "Pentaan",
    formula: "C₅H₁₂",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-3, 0, 0] },
      { element: "C", position: [-1.5, 1, 0] },
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 1, 0] },
      { element: "C", position: [3, 0, 0] },
      { element: "H", position: [-3, 1, 0] },
      { element: "H", position: [-3.5, -0.5, 0.8] },
      { element: "H", position: [-3.5, -0.5, -0.8] },
      { element: "H", position: [-1.5, 1.8, 0.8] },
      { element: "H", position: [-1.5, 1.8, -0.8] },
      { element: "H", position: [0, -0.8, 0.8] },
      { element: "H", position: [0, -0.8, -0.8] },
      { element: "H", position: [1.5, 1.8, 0.8] },
      { element: "H", position: [1.5, 1.8, -0.8] },
      { element: "H", position: [3, 1, 0] },
      { element: "H", position: [3.5, -0.5, 0.8] },
      { element: "H", position: [3.5, -0.5, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 1, to: 8, type: "single" },
      { from: 1, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 2, to: 11, type: "single" },
      { from: 3, to: 12, type: "single" },
      { from: 3, to: 13, type: "single" },
      { from: 4, to: 14, type: "single" },
      { from: 4, to: 15, type: "single" },
      { from: 4, to: 16, type: "single" },
    ],
  },
  {
    name: "Hexane",
    nameDutch: "Hexaan",
    formula: "C₆H₁₄",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-3.7, 0, 0] },
      { element: "C", position: [-2.2, 1, 0] },
      { element: "C", position: [-0.7, 0, 0] },
      { element: "C", position: [0.7, 1, 0] },
      { element: "C", position: [2.2, 0, 0] },
      { element: "C", position: [3.7, 1, 0] },
      { element: "H", position: [-3.7, 1, 0] },
      { element: "H", position: [-4.2, -0.5, 0.8] },
      { element: "H", position: [-4.2, -0.5, -0.8] },
      { element: "H", position: [-2.2, 1.8, 0.8] },
      { element: "H", position: [-2.2, 1.8, -0.8] },
      { element: "H", position: [-0.7, -0.8, 0.8] },
      { element: "H", position: [-0.7, -0.8, -0.8] },
      { element: "H", position: [0.7, 1.8, 0.8] },
      { element: "H", position: [0.7, 1.8, -0.8] },
      { element: "H", position: [2.2, -0.8, 0.8] },
      { element: "H", position: [2.2, -0.8, -0.8] },
      { element: "H", position: [3.7, 2, 0] },
      { element: "H", position: [4.2, 0.5, 0.8] },
      { element: "H", position: [4.2, 0.5, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 0, to: 8, type: "single" },
      { from: 1, to: 9, type: "single" },
      { from: 1, to: 10, type: "single" },
      { from: 2, to: 11, type: "single" },
      { from: 2, to: 12, type: "single" },
      { from: 3, to: 13, type: "single" },
      { from: 3, to: 14, type: "single" },
      { from: 4, to: 15, type: "single" },
      { from: 4, to: 16, type: "single" },
      { from: 5, to: 17, type: "single" },
      { from: 5, to: 18, type: "single" },
      { from: 5, to: 19, type: "single" },
    ],
  },
  {
    name: "Cyclopropane",
    nameDutch: "Cyclopropaan",
    formula: "C₃H₆",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 1.2, 0] },
      { element: "C", position: [-1, -0.6, 0] },
      { element: "C", position: [1, -0.6, 0] },
      { element: "H", position: [0, 1.8, 0.8] },
      { element: "H", position: [0, 1.8, -0.8] },
      { element: "H", position: [-1.6, -1, 0.8] },
      { element: "H", position: [-1.6, -1, -0.8] },
      { element: "H", position: [1.6, -1, 0.8] },
      { element: "H", position: [1.6, -1, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 0, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 2, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
    ],
  },
  {
    name: "Cyclobutane",
    nameDutch: "Cyclobutaan",
    formula: "C₄H₈",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-1, 1, 0] },
      { element: "C", position: [1, 1, 0.5] },
      { element: "C", position: [1, -1, 0] },
      { element: "C", position: [-1, -1, 0.5] },
      { element: "H", position: [-1.5, 1.5, 0] },
      { element: "H", position: [-0.5, 0.5, -0.8] },
      { element: "H", position: [1.5, 1.5, 0] },
      { element: "H", position: [0.5, 0.5, 1.2] },
      { element: "H", position: [1.5, -1.5, 0] },
      { element: "H", position: [0.5, -0.5, -0.8] },
      { element: "H", position: [-1.5, -1.5, 0] },
      { element: "H", position: [-0.5, -0.5, 1.2] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 0, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 3, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
    ],
  },
  {
    name: "Cyclopentane",
    nameDutch: "Cyclopentaan",
    formula: "C₅H₁₀",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 1.5, 0] },
      { element: "C", position: [1.4, 0.5, 0.3] },
      { element: "C", position: [0.9, -1.2, -0.3] },
      { element: "C", position: [-0.9, -1.2, 0.3] },
      { element: "C", position: [-1.4, 0.5, -0.3] },
      { element: "H", position: [0, 2.2, 0.8] },
      { element: "H", position: [0, 2.2, -0.8] },
      { element: "H", position: [2, 0.8, 1] },
      { element: "H", position: [2, 0.8, -0.4] },
      { element: "H", position: [1.2, -1.8, 0.4] },
      { element: "H", position: [1.2, -1.8, -1] },
      { element: "H", position: [-1.2, -1.8, 1] },
      { element: "H", position: [-1.2, -1.8, -0.4] },
      { element: "H", position: [-2, 0.8, 0.4] },
      { element: "H", position: [-2, 0.8, -1] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 0, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 1, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
      { from: 3, to: 12, type: "single" },
      { from: 4, to: 13, type: "single" },
      { from: 4, to: 14, type: "single" },
    ],
  },
  {
    name: "Methylamine",
    nameDutch: "Methylamine",
    formula: "CH₅N",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "N", position: [1.5, 0, 0] },
      { element: "H", position: [-0.5, 0.5, 0.5] },
      { element: "H", position: [-0.5, -0.5, 0.5] },
      { element: "H", position: [-0.5, 0, -0.8] },
      { element: "H", position: [2, 0.5, 0] },
      { element: "H", position: [2, -0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 1, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
    ],
  },

  // --- Batch 5: Polymers, Bio-molecules & More ---
  {
    name: "Glycerol",
    nameDutch: "Glycerol (Propaan-1,2,3-triol)",
    formula: "C₃H₈O₃",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-1.2, 0, 0] },
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.2, 0, 0] },
      { element: "O", position: [-1.2, 1.2, 0] },
      { element: "O", position: [0, -1.2, 0] },
      { element: "O", position: [1.2, 1.2, 0] },
      { element: "H", position: [-1.2, -0.8, 0] },
      { element: "H", position: [-2, 0, 0] },
      { element: "H", position: [0, 0.8, 0] },
      { element: "H", position: [2, 0, 0] },
      { element: "H", position: [1.2, -0.8, 0] },
      { element: "H", position: [-1.2, 2, 0] },
      { element: "H", position: [0, -2, 0] },
      { element: "H", position: [1.2, 2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 1, to: 4, type: "single" },
      { from: 2, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 1, to: 8, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 2, to: 10, type: "single" },
      { from: 3, to: 11, type: "single" },
      { from: 4, to: 12, type: "single" },
      { from: 5, to: 13, type: "single" },
    ],
  },
  {
    name: "Paracetamol",
    nameDutch: "Paracetamol",
    formula: "C₈H₉NO₂",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0.5, 0] },
      { element: "C", position: [1.3, 1.9, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-1.3, 1.9, 0] },
      { element: "C", position: [-1.3, 0.5, 0] },
      { element: "O", position: [0, 3.7, 0] },
      { element: "N", position: [0, -1.3, 0] },
      { element: "C", position: [0, -2.6, 0] },
      { element: "O", position: [1.2, -3.1, 0] },
      { element: "C", position: [-1.2, -3.4, 0] },
      { element: "H", position: [2.2, 0, 0] },
      { element: "H", position: [2.2, 2.4, 0] },
      { element: "H", position: [-2.2, 2.4, 0] },
      { element: "H", position: [-2.2, 0, 0] },
      { element: "H", position: [0, 4.2, 0] },
      { element: "H", position: [-0.8, -1, 0] },
      { element: "H", position: [-1.2, -4.4, 0] },
      { element: "H", position: [-2.1, -3, 0] },
      { element: "H", position: [-1.2, -3, 1] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 3, to: 6, type: "single" },
      { from: 0, to: 7, type: "single" },
      { from: 7, to: 8, type: "single" },
      { from: 8, to: 9, type: "double" },
      { from: 8, to: 10, type: "single" },
      { from: 1, to: 11, type: "single" },
      { from: 2, to: 12, type: "single" },
      { from: 4, to: 13, type: "single" },
      { from: 5, to: 14, type: "single" },
      { from: 6, to: 15, type: "single" },
      { from: 7, to: 16, type: "single" },
      { from: 10, to: 17, type: "single" },
      { from: 10, to: 18, type: "single" },
      { from: 10, to: 19, type: "single" },
    ],
  },
  {
    name: "Caffeine",
    nameDutch: "Coffeïne",
    formula: "C₈H₁₀N₄O₂",
    difficulty: "hard",
    chiralCenters: [],
    atoms: [
      { element: "N", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0, 0] },
      { element: "N", position: [2, 1.2, 0] },
      { element: "C", position: [1.3, 2.4, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-0.8, 1.2, 0] },
      { element: "O", position: [1.8, 3.5, 0] },
      { element: "O", position: [-2, 1.2, 0] },
      { element: "N", position: [-0.5, 3.5, 0] },
      { element: "C", position: [-1.5, 4, 0] },
      { element: "N", position: [-2, 3, 0] },
      { element: "C", position: [0, -1.3, 0] },
      { element: "C", position: [3.4, 1.2, 0] },
      { element: "C", position: [-3.4, 3, 0] },
      { element: "H", position: [0, -2, 0] },
      { element: "H", position: [0.8, -1.5, 0.8] },
      { element: "H", position: [-0.8, -1.5, -0.8] },
      { element: "H", position: [3.8, 0.5, 0] },
      { element: "H", position: [3.8, 1.8, 0.8] },
      { element: "H", position: [3.4, 1.8, -0.8] },
      { element: "H", position: [-1.8, 4.8, 0] },
      { element: "H", position: [-3.8, 2.2, 0] },
      { element: "H", position: [-3.8, 3.5, 0.8] },
      { element: "H", position: [-3.4, 3.5, -0.8] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 3, to: 6, type: "double" },
      { from: 5, to: 7, type: "double" },
      { from: 4, to: 8, type: "single" },
      { from: 8, to: 9, type: "double" },
      { from: 9, to: 10, type: "single" },
      { from: 10, to: 4, type: "single" },
      { from: 0, to: 11, type: "single" },
      { from: 2, to: 12, type: "single" },
      { from: 10, to: 13, type: "single" },
    ],
  },
  {
    name: "Glyphosate",
    nameDutch: "Glyfosaat",
    formula: "C₃H₈NO₅P",
    difficulty: "hard",
    chiralCenters: [],
    atoms: [
      { element: "P", position: [0, 0, 0] },
      { element: "O", position: [0, 1.5, 0] },
      { element: "O", position: [-1.2, -0.8, 0] },
      { element: "O", position: [1.2, -0.8, 0] },
      { element: "C", position: [2.5, -0.8, 0] },
      { element: "N", position: [3.5, 0.2, 0] },
      { element: "C", position: [4.8, 0.2, 0] },
      { element: "C", position: [5.8, -0.8, 0] },
      { element: "O", position: [5.8, -2, 0] },
      { element: "O", position: [7, -0.2, 0] },
      { element: "H", position: [0, 2, 0] },
      { element: "H", position: [-1.5, -1.2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 8, type: "double" },
      { from: 7, to: 9, type: "single" },
    ],
  },
  {
    name: "Terephthalic Acid",
    nameDutch: "Tereftaalzuur",
    formula: "C₈H₆O₄",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0.5, 0] },
      { element: "C", position: [1.3, 1.9, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-1.3, 1.9, 0] },
      { element: "C", position: [-1.3, 0.5, 0] },
      { element: "C", position: [0, 3.8, 0] },
      { element: "O", position: [1.2, 4.3, 0] },
      { element: "O", position: [-1.2, 4.3, 0] },
      { element: "C", position: [0, -1.4, 0] },
      { element: "O", position: [1.2, -1.9, 0] },
      { element: "O", position: [-1.2, -1.9, 0] },
      { element: "H", position: [-2, 4.6, 0] },
      { element: "H", position: [2, -2.2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 3, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
      { from: 0, to: 9, type: "single" },
      { from: 9, to: 10, type: "single" },
      { from: 9, to: 11, type: "double" },
    ],
  },
  {
    name: "Ethylene Glycol",
    nameDutch: "Ethaan-1,2-diol (Ethyleenglycol)",
    formula: "C₂H₆O₂",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-0.7, 0, 0] },
      { element: "C", position: [0.7, 0, 0] },
      { element: "O", position: [-1.5, 1, 0] },
      { element: "O", position: [1.5, -1, 0] },
      { element: "H", position: [-0.7, -1, 0] },
      { element: "H", position: [-1.2, -0.5, 0.8] },
      { element: "H", position: [0.7, 1, 0] },
      { element: "H", position: [1.2, 0.5, 0.8] },
      { element: "H", position: [-2, 0.5, 0] },
      { element: "H", position: [2, -0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 0, to: 2, type: "single" },
      { from: 1, to: 3, type: "single" },
      { from: 0, to: 4, type: "single" },
      { from: 0, to: 5, type: "single" },
      { from: 1, to: 6, type: "single" },
      { from: 1, to: 7, type: "single" },
      { from: 2, to: 8, type: "single" },
      { from: 3, to: 9, type: "single" },
    ],
  },
  {
    name: "Adipic Acid",
    nameDutch: "Adipinezuur (Hexaandizuur)",
    formula: "C₆H₁₀O₄",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-3, 0, 0] },
      { element: "C", position: [-1.5, 0.5, 0] },
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0.5, 0] },
      { element: "C", position: [3, 0, 0] },
      { element: "C", position: [4.5, 0.5, 0] },
      { element: "O", position: [-3, 1.2, 0] },
      { element: "O", position: [-4, -0.5, 0] },
      { element: "O", position: [4.5, 1.7, 0] },
      { element: "O", position: [5.5, 0, 0] },
      { element: "H", position: [-1.5, 1.5, 0] },
      { element: "H", position: [-1.5, 0.5, 1] },
      { element: "H", position: [0, -1, 0] },
      { element: "H", position: [0, 0, 1] },
      { element: "H", position: [1.5, 1.5, 0] },
      { element: "H", position: [1.5, 0.5, 1] },
      { element: "H", position: [3, -1, 0] },
      { element: "H", position: [3, 0, 1] },
      { element: "H", position: [-4.5, 0, 0] },
      { element: "H", position: [6, 0.5, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 0, to: 6, type: "double" },
      { from: 0, to: 7, type: "single" },
      { from: 5, to: 8, type: "double" },
      { from: 5, to: 9, type: "single" },
      { from: 7, to: 18, type: "single" },
      { from: 9, to: 19, type: "single" },
    ],
  },
  {
    name: "Hexameth. Diamine",
    nameDutch: "1,6-hexaandiamine",
    formula: "C₆H₁₆N₂",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-3, 0, 0] },
      { element: "C", position: [-1.5, 0.5, 0] },
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.5, 0.5, 0] },
      { element: "C", position: [3, 0, 0] },
      { element: "C", position: [4.5, 0.5, 0] },
      { element: "N", position: [-4, 0.5, 0] },
      { element: "N", position: [5.5, 0, 0] },
      { element: "H", position: [-3, -1, 0] },
      { element: "H", position: [-1.5, 1.5, 0] },
      { element: "H", position: [0, -1, 0] },
      { element: "H", position: [1.5, 1.5, 0] },
      { element: "H", position: [3, -1, 0] },
      { element: "H", position: [4.5, 1.5, 0] },
      { element: "H", position: [-4.5, 0, 0] },
      { element: "H", position: [-4, 1.5, 0] },
      { element: "H", position: [6, 0.5, 0] },
      { element: "H", position: [5.5, -1, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 0, to: 6, type: "single" },
      { from: 5, to: 7, type: "single" },
    ],
  },
  {
    name: "Ethyl Acetate",
    nameDutch: "Ethylacetaat (Ester)",
    formula: "C₄H₈O₂",
    difficulty: "easy",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [-1.5, 0, 0] },
      { element: "C", position: [0, 0, 0] },
      { element: "O", position: [0, 1.2, 0] },
      { element: "O", position: [1.2, -0.8, 0] },
      { element: "C", position: [2.5, -0.8, 0] },
      { element: "C", position: [3.2, 0.5, 0] },
      { element: "H", position: [-1.5, 1, 0] },
      { element: "H", position: [-2, -0.5, 0] },
      { element: "H", position: [-1.5, -0.5, 1] },
      { element: "H", position: [2.5, -1.8, 0] },
      { element: "H", position: [2.5, -0.8, 1] },
      { element: "H", position: [4.2, 0.5, 0] },
      { element: "H", position: [2.8, 1, 0] },
      { element: "H", position: [3.2, 0.5, 1] },
    ],
    bonds: [
      { from: 0, to: 1, type: "single" },
      { from: 1, to: 2, type: "double" },
      { from: 1, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
    ],
  },
  {
    name: "Benzaldehyde",
    nameDutch: "Benzaldehyde (amandelgeur)",
    formula: "C₇H₆O",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0.5, 0] },
      { element: "C", position: [1.3, 1.9, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-1.3, 1.9, 0] },
      { element: "C", position: [-1.3, 0.5, 0] },
      { element: "C", position: [0, 3.8, 0] },
      { element: "O", position: [1.2, 4.3, 0] },
      { element: "H", position: [-0.8, 4.3, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 3, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
    ],
  },
  {
    name: "Salicylic Acid",
    nameDutch: "Salicylzuur",
    formula: "C₇H₆O₃",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0.5, 0] },
      { element: "C", position: [1.3, 1.9, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-1.3, 1.9, 0] },
      { element: "C", position: [-1.3, 0.5, 0] },
      { element: "C", position: [0, 3.8, 0] },
      { element: "O", position: [1.2, 4.3, 0] },
      { element: "O", position: [-1.2, 4.3, 0] },
      { element: "O", position: [2.5, 2.4, 0] },
      { element: "H", position: [-1.8, 5, 0] },
      { element: "H", position: [3, 1.8, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 3, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
      { from: 8, to: 10, type: "single" },
      { from: 2, to: 9, type: "single" },
      { from: 9, to: 11, type: "single" },
    ],
  },
  {
    name: "Aniline",
    nameDutch: "Aniline (Aminbenzeen)",
    formula: "C₆H₇N",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0.5, 0] },
      { element: "C", position: [1.3, 1.9, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-1.3, 1.9, 0] },
      { element: "C", position: [-1.3, 0.5, 0] },
      { element: "N", position: [0, 3.8, 0] },
      { element: "H", position: [0.8, 4.2, 0] },
      { element: "H", position: [-0.8, 4.2, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 3, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 6, to: 8, type: "single" },
    ],
  },
  {
    name: "Nitrobenzene",
    nameDutch: "Nitrobenzeen",
    formula: "C₆H₅NO₂",
    difficulty: "medium",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "C", position: [1.3, 0.5, 0] },
      { element: "C", position: [1.3, 1.9, 0] },
      { element: "C", position: [0, 2.4, 0] },
      { element: "C", position: [-1.3, 1.9, 0] },
      { element: "C", position: [-1.3, 0.5, 0] },
      { element: "N", position: [0, 3.8, 0] },
      { element: "O", position: [1.2, 4.3, 0] },
      { element: "O", position: [-1.2, 4.3, 0] },
    ],
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 1, to: 2, type: "single" },
      { from: 2, to: 3, type: "double" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "double" },
      { from: 5, to: 0, type: "single" },
      { from: 3, to: 6, type: "single" },
      { from: 6, to: 7, type: "double" },
      { from: 6, to: 8, type: "single" },
    ],
  },
  {
    name: "Oleic Acid",
    nameDutch: "Oliezuur (C18:1)",
    formula: "C₁₈H₃₄O₂",
    difficulty: "hard",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "O", position: [0, 1.2, 0] },
      { element: "O", position: [1.2, -0.5, 0] },
      { element: "C", position: [-1.3, -0.5, 0] },
      { element: "C", position: [-2.5, 0.5, 0] },
      { element: "C", position: [-3.8, -0.5, 0] },
      { element: "C", position: [-5, 0.5, 0] },
      { element: "C", position: [-6.3, -0.5, 0] },
      { element: "C", position: [-7.5, 0.5, 0] },
      { element: "C", position: [-8.8, -0.5, 0] },
      { element: "C", position: [-10, 0.5, 0] },
      { element: "C", position: [-11.3, 0.5, 0] },
      { element: "C", position: [-12.5, -0.5, 0] },
      { element: "C", position: [-13.8, 0.5, 0] },
      { element: "C", position: [-15, -0.5, 0] },
      { element: "C", position: [-16.3, 0.5, 0] },
      { element: "C", position: [-17.5, -0.5, 0] },
      { element: "C", position: [-18.8, 0.5, 0] },
      { element: "C", position: [-20, -0.5, 0] },
      { element: "C", position: [-21.3, 0.5, 0] },
      { element: "H", position: [2, -0.5, 0] },
      { element: "H", position: [-10, 1.5, 0] },
      { element: "H", position: [-11.3, -0.5, 0] },
    ], // Simplified atoms/bonds for long chain
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 0, to: 2, type: "single" },
      { from: 2, to: 20, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
      { from: 4, to: 5, type: "single" },
      { from: 5, to: 6, type: "single" },
      { from: 6, to: 7, type: "single" },
      { from: 7, to: 8, type: "single" },
      { from: 8, to: 9, type: "single" },
      { from: 9, to: 10, type: "single" },
      { from: 10, to: 11, type: "double" },
      { from: 11, to: 12, type: "single" },
      { from: 12, to: 13, type: "single" },
      { from: 13, to: 14, type: "single" },
      { from: 14, to: 15, type: "single" },
      { from: 15, to: 16, type: "single" },
      { from: 16, to: 17, type: "single" },
      { from: 17, to: 18, type: "single" },
      { from: 18, to: 19, type: "single" },
    ],
  },
  {
    name: "Stearic Acid",
    nameDutch: "Stearinezuur (C18:0)",
    formula: "C₁₈H₃₆O₂",
    difficulty: "hard",
    chiralCenters: [],
    atoms: [
      { element: "C", position: [0, 0, 0] },
      { element: "O", position: [0, 1.2, 0] },
      { element: "O", position: [1.2, -0.5, 0] },
      { element: "C", position: [-1.3, -0.5, 0] },
      { element: "C", position: [-2.5, 0.5, 0] },
    ], // Extremely simplified for DB size
    bonds: [
      { from: 0, to: 1, type: "double" },
      { from: 0, to: 2, type: "single" },
      { from: 0, to: 3, type: "single" },
      { from: 3, to: 4, type: "single" },
    ],
  },
];

// Helper: Mirror molecule along an axis
export const mirrorMolecule = (
  mol: Molecule,
  axis: 0 | 1 | 2 = 0,
): Molecule => {
  return {
    ...mol,
    atoms: mol.atoms.map((atom) => ({
      ...atom,
      position: atom.position.map((v, i) => (i === axis ? -v : v)) as Vec3,
    })),
  };
};

// Helper: Rotate molecule
export const rotateMolecule = (
  mol: Molecule,
  rotX: number,
  rotY: number,
  rotZ: number,
): Molecule => {
  const cosX = Math.cos(rotX),
    sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY),
    sinY = Math.sin(rotY);
  const cosZ = Math.cos(rotZ),
    sinZ = Math.sin(rotZ);

  const rotatePoint = (p: Vec3): Vec3 => {
    let [x, y, z] = p;
    // Rotate X
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    y = y1;
    z = z1;
    // Rotate Y
    let x1 = x * cosY + z * sinY;
    z1 = -x * sinY + z * cosY;
    x = x1;
    z = z1;
    // Rotate Z
    x1 = x * cosZ - y * sinZ;
    y1 = x * sinZ + y * cosZ;
    return [x1, y1, z];
  };

  return {
    ...mol,
    atoms: mol.atoms.map((atom) => ({
      ...atom,
      position: rotatePoint(atom.position),
    })),
  };
};

const getMoleculesByDifficulty = (
  difficulty: "easy" | "medium" | "hard",
): Molecule[] => {
  return MOLECULES.filter((m) => m.difficulty === difficulty);
};

export const getRandomMolecule = (
  difficulty?: "easy" | "medium" | "hard",
): Molecule => {
  const pool = difficulty ? getMoleculesByDifficulty(difficulty) : MOLECULES;
  return pool[Math.floor(Math.random() * pool.length)]!;
};
