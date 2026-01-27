/* eslint-disable @typescript-eslint/no-explicit-any */
import { RedoxEntry } from "./RedoxTypes";

// --- ION DEFINITIONS ---

export type Charge = number;
export type Color = string;

export interface Ion {
  id: string;
  formula: string; // 'Ag⁺'
  charge: Charge;
  name: string;
  color: Color;
  redox?: RedoxEntry[];
}

export const CATIONS: Record<string, Ion> = {
  Ag: {
    id: "Ag",
    formula: "Ag⁺",
    charge: 1,
    name: "Zilver(I)",
    color: "bg-transparent",
    redox: [
      {
        v0: 0.8,
        type: "oxidator",
        halfReaction: "Ag⁺ + e⁻ ⇌ Ag",
        structured: {
          electrons: 1,
          reactants: [{ species: "Ag⁺", coeff: 1 }],
          products: [{ species: "Ag(s)", coeff: 1 }],
        },
      },
    ],
  },
  Pb: {
    id: "Pb",
    formula: "Pb²⁺",
    charge: 2,
    name: "Lood(II)",
    color: "bg-transparent",
    redox: [
      {
        v0: -0.13,
        type: "oxidator",
        halfReaction: "Pb²⁺ + 2e⁻ ⇌ Pb",
        structured: {
          electrons: 2,
          reactants: [{ species: "Pb²⁺", coeff: 1 }],
          products: [{ species: "Pb(s)", coeff: 1 }],
        },
      },
    ],
  },
  Cu: {
    id: "Cu",
    formula: "Cu²⁺",
    charge: 2,
    name: "Koper(II)",
    color: "bg-blue-500/30",
    redox: [
      {
        v0: 0.34,
        type: "oxidator",
        halfReaction: "Cu²⁺ + 2e⁻ ⇌ Cu",
        structured: {
          electrons: 2,
          reactants: [{ species: "Cu²⁺", coeff: 1 }],
          products: [{ species: "Cu(s)", coeff: 1 }],
        },
      },
    ],
  },
  Fe2: {
    id: "Fe2",
    formula: "Fe²⁺",
    charge: 2,
    name: "IJzer(II)",
    color: "bg-green-100/30",
    redox: [
      {
        v0: 0.77,
        type: "reductor",
        halfReaction: "Fe³⁺ + e⁻ ⇌ Fe²⁺",
        structured: {
          electrons: 1,
          reactants: [{ species: "Fe³⁺", coeff: 1 }],
          products: [{ species: "Fe²⁺", coeff: 1 }],
        },
      },
      {
        v0: -0.44,
        type: "oxidator",
        halfReaction: "Fe²⁺ + 2e⁻ ⇌ Fe",
        structured: {
          electrons: 2,
          reactants: [{ species: "Fe²⁺", coeff: 1 }],
          products: [{ species: "Fe(s)", coeff: 1 }],
        },
      },
    ],
  },
  Fe3: {
    id: "Fe3",
    formula: "Fe³⁺",
    charge: 3,
    name: "IJzer(III)",
    color: "bg-yellow-500/30",
    redox: [
      {
        v0: 0.77,
        type: "oxidator",
        halfReaction: "Fe³⁺ + e⁻ ⇌ Fe²⁺",
        structured: {
          electrons: 1,
          reactants: [{ species: "Fe³⁺", coeff: 1 }],
          products: [{ species: "Fe²⁺", coeff: 1 }],
        },
      },
    ],
  },
  Na: {
    id: "Na",
    formula: "Na⁺",
    charge: 1,
    name: "Natrium",
    color: "bg-transparent",
  },
  K: {
    id: "K",
    formula: "K⁺",
    charge: 1,
    name: "Kalium",
    color: "bg-transparent",
  },
  Ca: {
    id: "Ca",
    formula: "Ca²⁺",
    charge: 2,
    name: "Calcium",
    color: "bg-transparent",
  },
  Ba: {
    id: "Ba",
    formula: "Ba²⁺",
    charge: 2,
    name: "Barium",
    color: "bg-transparent",
  },
  Mg: {
    id: "Mg",
    formula: "Mg²⁺",
    charge: 2,
    name: "Magnesium",
    color: "bg-transparent",
  },
  Zn: {
    id: "Zn",
    formula: "Zn²⁺",
    charge: 2,
    name: "Zink",
    color: "bg-transparent",
    redox: [
      {
        v0: -0.76,
        type: "oxidator",
        halfReaction: "Zn²⁺ + 2e⁻ ⇌ Zn",
        structured: {
          electrons: 2,
          reactants: [{ species: "Zn²⁺", coeff: 1 }],
          products: [{ species: "Zn(s)", coeff: 1 }],
        },
      },
    ],
  },
  Al: {
    id: "Al",
    formula: "Al³⁺",
    charge: 3,
    name: "Aluminium",
    color: "bg-transparent",
  },
  NH4: {
    id: "NH4",
    formula: "NH₄⁺",
    charge: 1,
    name: "Ammonium",
    color: "bg-transparent",
  },
  H: {
    id: "H",
    formula: "H⁺",
    charge: 1,
    name: "Waterstof",
    color: "bg-transparent",
    redox: [
      {
        v0: 0.0,
        type: "oxidator",
        halfReaction: "2H⁺ + 2e⁻ ⇌ H₂",
        structured: {
          electrons: 2,
          reactants: [{ species: "H⁺", coeff: 2 }],
          products: [{ species: "H₂(g)", coeff: 1 }],
        },
      },
    ],
  },
  Li: {
    id: "Li",
    formula: "Li⁺",
    charge: 1,
    name: "Lithium",
    color: "bg-transparent",
  },
};

export const ANIONS: Record<string, Ion> = {
  NO3: {
    id: "NO3",
    formula: "NO₃⁻",
    charge: -1,
    name: "Nitraat",
    color: "bg-transparent",
  },
  Cl: {
    id: "Cl",
    formula: "Cl⁻",
    charge: -1,
    name: "Chloride",
    color: "bg-transparent",
    redox: [
      {
        v0: 1.36,
        type: "reductor",
        halfReaction: "Cl₂ + 2e⁻ ⇌ 2Cl⁻",
        structured: {
          electrons: 2,
          reactants: [{ species: "Cl₂", coeff: 1 }],
          products: [{ species: "Cl⁻", coeff: 2 }],
        },
      },
    ],
  },
  SO4: {
    id: "SO4",
    formula: "SO₄²⁻",
    charge: -2,
    name: "Sulfaat",
    color: "bg-transparent",
  },
  CO3: {
    id: "CO3",
    formula: "CO₃²⁻",
    charge: -2,
    name: "Carbonaat",
    color: "bg-transparent",
  },
  OH: {
    id: "OH",
    formula: "OH⁻",
    charge: -1,
    name: "Hydroxide",
    color: "bg-transparent",
    redox: [
      {
        v0: 0.4,
        type: "reductor",
        halfReaction: "O₂ + 2H₂O + 4e⁻ ⇌ 4OH⁻", // Basisch milieu
        structured: {
          electrons: 4,
          reactants: [
            { species: "O₂", coeff: 1 },
            { species: "H₂O", coeff: 2 },
          ],
          products: [{ species: "OH⁻", coeff: 4 }],
        },
      },
    ],
  },
  PO4: {
    id: "PO4",
    formula: "PO₄³⁻",
    charge: -3,
    name: "Fosfaat",
    color: "bg-transparent",
  },
  Br: {
    id: "Br",
    formula: "Br⁻",
    charge: -1,
    name: "Bromide",
    color: "bg-transparent",
    redox: [
      {
        v0: 1.07,
        type: "reductor",
        halfReaction: "Br₂ + 2e⁻ ⇌ 2Br⁻",
        structured: {
          electrons: 2,
          reactants: [{ species: "Br₂", coeff: 1 }],
          products: [{ species: "Br⁻", coeff: 2 }],
        },
      },
    ],
  },
  I: {
    id: "I",
    formula: "I⁻",
    charge: -1,
    name: "Jodide",
    color: "bg-transparent",
    redox: [
      {
        v0: 0.62,
        type: "reductor",
        halfReaction: "I₂ + 2e⁻ ⇌ 2I⁻",
        structured: {
          electrons: 2,
          reactants: [{ species: "I₂", coeff: 1 }],
          products: [{ species: "I⁻", coeff: 2 }],
        },
      },
    ],
  },
  S: {
    id: "S",
    formula: "S²⁻",
    charge: -2,
    name: "Sulfide",
    color: "bg-transparent",
    redox: [
      {
        v0: -0.48,
        type: "reductor",
        halfReaction: "S(s) + 2e⁻ ⇌ S²⁻",
        structured: {
          electrons: 2,
          reactants: [{ species: "S(s)", coeff: 1 }],
          products: [{ species: "S²⁻", coeff: 1 }],
        },
      },
    ],
  },
  SO3: {
    id: "SO3",
    formula: "SO₃²⁻",
    charge: -2,
    name: "Sulfiet",
    color: "bg-transparent",
    redox: [
      {
        v0: 0.17,
        type: "reductor",
        halfReaction: "SO₄²⁻ + 4H⁺ + 2e⁻ ⇌ SO₃²⁻ + 2H₂O",
        structured: {
          electrons: 2,
          reactants: [
            { species: "SO₄²⁻", coeff: 1 },
            { species: "H⁺", coeff: 4 },
          ],
          products: [
            { species: "SO₃²⁻", coeff: 1 },
            { species: "H₂O", coeff: 2 },
          ],
        },
      },
    ],
  },
  S2O3: {
    id: "S2O3",
    formula: "S₂O₃²⁻",
    charge: -2,
    name: "Thiosulfaat",
    color: "bg-transparent",
    redox: [
      {
        v0: 0.08,
        type: "reductor",
        halfReaction: "S₄O₆²⁻ + 2e⁻ ⇌ 2S₂O₃²⁻",
        structured: {
          electrons: 2,
          reactants: [{ species: "S₄O₆²⁻", coeff: 1 }],
          products: [{ species: "S₂O₃²⁻", coeff: 2 }],
        },
      },
    ],
  },
  Acetate: {
    id: "Acetate",
    formula: "CH₃COO⁻",
    charge: -1,
    name: "Acetaat",
    color: "bg-transparent",
  },
  HCO3: {
    id: "HCO3",
    formula: "HCO₃⁻",
    charge: -1,
    name: "Waterstofcarbonaat",
    color: "bg-transparent",
  },
  HSO3: {
    id: "HSO3",
    formula: "HSO₃⁻",
    charge: -1,
    name: "Waterstofsulfiet",
    color: "bg-transparent",
  },
  HS: {
    id: "HS",
    formula: "HS⁻",
    charge: -1,
    name: "Waterstofsulfide",
    color: "bg-transparent",
  },
};

// --- SOLUBILITY RULES (VWO CONFORM) ---
const isInsoluble = (cation: string, anion: string): boolean => {
  // 1. Altijd Oplosbaar (Na, K, NH4, NO3, Acetaat)
  if (["Na", "K", "NH4", "Li"].includes(cation)) return false;
  if (["NO3", "Acetate"].includes(anion)) return false;

  // 2. Chloride/Bromide/Jodide (Slecht met Ag, Pb)
  if (["Cl", "Br", "I"].includes(anion)) {
    return ["Ag", "Pb", "Hg"].includes(cation);
  }

  // 3. Sulfaat (Slecht met Ba, Pb, Sr. Matig met Ca, Ag)
  if (anion === "SO4") {
    if (["Ba", "Pb", "Sr"].includes(cation)) return true; // Slecht
    if (["Ca", "Ag"].includes(cation)) return true; // Matig -> Neerslag in simulatie voor duidelijkheid
    return false;
  }

  // 4. Hydroxide (OH)
  if (anion === "OH") {
    if (["Ba", "Sr", "Ca"].includes(cation)) return false; // Matig tot Goed (Kalkwater/Barietwater zijn helder)
    return true; // De rest (Cu, Fe, Zn, Al, Mg) slaat neer!
  }

  // 5. Carbonaat, Fosfaat, Sulfide (Slecht, behalve regel 1)
  if (["CO3", "PO4", "S", "SO3"].includes(anion)) return true;

  return false;
};

// --- GENERATOR HELPER ---
const getSaltFormula = (cat: Ion, an: Ion, state: string = ""): string => {
  const CatQ = Math.abs(cat.charge);
  const AnQ = Math.abs(an.charge);

  // Simplification of ratio
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const common = gcd(CatQ, AnQ);
  const cSub = AnQ / common;
  const aSub = CatQ / common;

  const cPart = cSub > 1 ? `<sub>${cSub}</sub>` : "";
  const aPart = aSub > 1 ? `<sub>${aSub}</sub>` : "";

  // Formatting
  let cf = cat.id;
  if (cat.id === "NH4") cf = "NH₄";
  else if (cat.id === "Fe2" || cat.id === "Fe3") cf = "Fe";

  let af = an.id;
  if (an.id === "NO3") af = "NO₃";
  else if (an.id === "SO4") af = "SO₄";
  else if (an.id === "CO3") af = "CO₃";
  else if (an.id === "PO4") af = "PO₄";
  else if (an.id === "OH") af = "OH";
  else if (an.id === "Acetate") af = "CH₃COO";

  const finalCat =
    cSub > 1 && (cf.length > 2 || cf.includes("H")) ? `(${cf})` : cf;
  const finalAn = aSub > 1 && af.length > 1 ? `(${af})` : af;

  return `${finalCat}${cPart}${finalAn}${aPart}${state ? `(${state})` : ""}`;
};

// Interface for simplified reactant passed from Data layer
interface EngineReactant {
  id: string;
  ions?: [string, string]; // [CatID, AnID]
}

interface EngineResult {
  reactants: string[];
  products: string;
  observation: string;
  observationKey?: string;
  observationData?: Record<string, any>;
  type: string;
  typeKey?: string;
  equation: string;
  resultColor?: string;
}

export const generateReaction = (
  r1: EngineReactant,
  r2: EngineReactant,
): EngineResult | null => {
  if (!r1.ions || !r2.ions) return null;

  const [c1, a1] = r1.ions;
  const [c2, a2] = r2.ions;

  const cation1 = CATIONS[c1];
  const anion1 = ANIONS[a1];
  const cation2 = CATIONS[c2];
  const anion2 = ANIONS[a2];

  if (!cation1 || !anion1 || !cation2 || !anion2) return null;

  // 2. Check for Double Displacement (Metathesis) -> Precipitation
  // Possible products: (c1, a2) and (c2, a1)

  const s1 = isInsoluble(c1, a2);
  const s2 = isInsoluble(c2, a1);

  if (s1 || s2) {
    const p1Form = getSaltFormula(cation1, anion2, s1 ? "s" : "aq");
    const p2Form = getSaltFormula(cation2, anion1, s2 ? "s" : "aq");

    // Equation Construction (Pseudo)
    // c1 a1 + c2 a2 -> c1 a2 + c2 a1
    // Simplified Logic for equation display (not fully balanced but illustrative)

    return {
      reactants: [r1.id, r2.id],
      products: `${p1Form} + ${p2Form}`,
      observation: `Neerslag gevormd: ${s1 ? p1Form : ""} ${s2 ? p2Form : ""}`,
      observationKey: "precipitation_formed",
      observationData: { p1: s1 ? p1Form : "", p2: s2 ? p2Form : "" },
      type: "Neerslag",
      typeKey: "precipitation",
      equation: `${getSaltFormula(cation1, anion1)} + ${getSaltFormula(cation2, anion2)} → ${p1Form} + ${p2Form}`,
      resultColor: s1
        ? cation1.color !== "bg-transparent"
          ? cation1.color
          : "bg-white/30"
        : s2
          ? cation2.color !== "bg-transparent"
            ? cation2.color
            : "bg-white/30"
          : "bg-white/10",
    };
  }

  // 3. Acid Base & Gasvorming
  const isAcid = (c: string) => c === "H";

  if (isAcid(c1) || isAcid(c2)) {
    const anion = isAcid(c1) ? a2 : a1;

    // Carbonaten & Waterstofcarbonaten (CO2)
    if (["CO3", "HCO3"].includes(anion)) {
      return {
        reactants: [r1.id, r2.id],
        products: "H₂O + CO₂(g) + Zout",
        observation: "Bruisen (Koolstofdioxide).",
        observationKey: "gas_formation_detected",
        observationData: { gas: "CO₂(g)" },
        type: "Gasvorming",
        typeKey: "acid_carbonate",
        equation:
          anion === "HCO3"
            ? "H⁺ + HCO₃⁻ → H₂O + CO₂(g)"
            : "2H⁺ + CO₃²⁻ → H₂O + CO₂(g)",
      };
    }

    // Sulfieten (SO2)
    if (["SO3"].includes(anion)) {
      return {
        reactants: [r1.id, r2.id],
        products: "H₂O + SO₂(g) + Zout",
        observation: "Gasontwikkeling met prikkelende geur.",
        observationKey: "gas_formation_detected",
        observationData: { gas: "SO₂(g)" },
        type: "Gasvorming",
        typeKey: "gas_formation",
        equation: "2H⁺ + SO₃²⁻ → H₂O + SO₂(g)",
      };
    }

    // Sulfides (H2S)
    if (["S"].includes(anion)) {
      return {
        reactants: [r1.id, r2.id],
        products: "H₂S(g) + Zout",
        observation: "Gasontwikkeling met geur van rotte eieren.",
        observationKey: "gas_formation_detected",
        observationData: { gas: "H₂S(g)" },
        type: "Gasvorming",
        typeKey: "gas_formation",
        equation: "2H⁺ + S²⁻ → H₂S(g)",
      };
    }

    // Hydroxide (Neutralisatie)
    if (anion === "OH") {
      return {
        reactants: [r1.id, r2.id],
        products: "H₂O + Zout",
        observation: "Temperatuurstijging (Neutralisatie).",
        observationKey: "neutralization_detected",
        type: "Neutralisatie",
        typeKey: "neutralization",
        equation: "H⁺ + OH⁻ → H₂O",
      };
    }
  }

  return null;
};
