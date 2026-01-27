import { ANIONS, CATIONS, generateReaction } from "./ChemistryEngine";
import {
  EnvironmentType,
  ReactantDef,
  ReactionDef,
  RedoxEntry,
} from "./ChemistryTypes";
import { predictRedox } from "./RedoxEngine";

const generatedReactants: ReactantDef[] = [];

// --- HELPER: CHARGE LOGIC VOOR STOICHIOMETRIE ---
const getIonCharge = (id: string): number => {
  // Kationen
  if (["Na", "K", "H", "Ag", "Li"].includes(id)) return 1;
  if (["Mg", "Ca", "Ba", "Zn", "Cu", "Fe2", "Pb"].includes(id)) return 2;
  if (["Al", "Fe3"].includes(id)) return 3;

  // Anionen
  if (["Cl", "Br", "I", "NO3", "OH", "F"].includes(id)) return 1;
  if (["SO4", "CO3", "SO3", "S", "S2O3", "O"].includes(id)) return 2;
  if (["PO4"].includes(id)) return 3;

  return 1; // Fallback
};

const formatSubscript = (n: number) => {
  if (n <= 1) return "";
  return String(n).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[parseInt(d)]!);
};

const addBottle = (
  catId: string,
  anId: string,
  category: ReactantDef["category"],
) => {
  const cat = CATIONS?.[catId];
  const an = ANIONS?.[anId];
  if (!cat || !an) {
    console.warn(`Critical: Missing ion definition for ${catId} or ${anId}`);
    return;
  }

  // 1. Bepaal Ladingen
  const cCharge = getIonCharge(catId);
  const aCharge = getIonCharge(anId);

  // 2. Kruislingse vermenigvuldiging (LCM methode) voor balans
  // Voorbeeld: Al(3+) + SO4(2-) -> Al:2, SO4:3
  let cCount = aCharge;
  let aCount = cCharge;

  // Vereenvoudig verhoudingen (bijv. 2:2 -> 1:1, 2:4 -> 1:2)
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(cCount, aCount);
  cCount /= divisor;
  aCount /= divisor;

  // 3. Formule Opbouw
  // Verwijdert alleen superscripts (+, -, 2+, 3-) en laat de index-cijfers van het molecuul met rust.
  const stripCharge = (f: string) =>
    f.replace(/[\^⁺⁻²³]+[+-]?/g, "").replace(/[+-]$/, "");

  const cleanCat = stripCharge(cat.formula);
  const cleanAn = stripCharge(an.formula);

  // Check of haakjes nodig zijn (alleen bij polyatomische ionen als count > 1)
  const polyatomicAnions = [
    "NO3",
    "SO4",
    "CO3",
    "OH",
    "SO3",
    "PO4",
    "NH4",
    "S2O3",
  ];
  // Special case: OH- met count > 1 moet altijd haakjes (Ca(OH)2), maar Cl- niet (CaCl2)
  const useParens =
    aCount > 1 && (polyatomicAnions.includes(anId) || cleanAn.length > 2);

  let finalFormula = `${cleanCat}${formatSubscript(cCount)}${useParens ? `(${cleanAn})` : cleanAn}${formatSubscript(aCount)}`;

  // 4. Hardcoded Overrides (voor esthetiek of uitzonderingen)
  if (catId === "H" && anId === "Cl") finalFormula = "HCl";
  if (catId === "H" && anId === "OH") finalFormula = "H₂O";
  if (catId === "Na" && anId === "Cl") finalFormula = "NaCl";

  const redoxEntries: RedoxEntry[] = [];
  if (cat.redox) redoxEntries.push(...cat.redox);
  if (an.redox) redoxEntries.push(...an.redox);

  generatedReactants.push({
    id: `${catId.toLowerCase()}${anId.toLowerCase()}`,
    name: `${cat.name} ${an.name.toLowerCase()}`,
    formula: finalFormula,
    state: "aq",
    color: cat.color,
    category: category,
    ions: [catId, anId],
    tags: [cat.name, an.name, category, "oplossing"],
    ...(redoxEntries.length > 0 ? { redox: redoxEntries } : {}),
  });
};

// Acids
addBottle("H", "Cl", "acid");
addBottle("H", "NO3", "acid");
addBottle("H", "SO4", "acid");

// Bases
addBottle("Na", "OH", "base");
addBottle("K", "OH", "base");
addBottle("Ba", "OH", "base");

// Salts (Nitrates - Always Soluble)
Object.keys(CATIONS).forEach((c) => {
  if (c !== "H") addBottle(c, "NO3", "salt");
});

// Extra Nitrates (Explicit)
// Extra Nitrates (Explicit) - Ag is already in CATIONS loop
// addBottle('Ag', 'NO3', 'salt');

// Salts (Chlorides - Soluble except Ag, Pb)
["Na", "K", "Mg", "Ca", "Ba", "Zn", "Fe2", "Fe3", "Cu", "Al"].forEach((c) => {
  addBottle(c, "Cl", "salt");
});

// Salts (Sulfates - Soluble except Ba, Pb, Ca)
["Na", "K", "Mg", "Zn", "Fe2", "Cu", "Al"].forEach((c) => {
  addBottle(c, "SO4", "salt");
});

// Soluble Carbonates (Group 1)
addBottle("Na", "CO3", "salt");
addBottle("K", "CO3", "salt");

// Redox/Gas Active Salts
addBottle("Na", "S", "salt");
addBottle("Na", "SO3", "salt");
addBottle("Na", "HCO3", "salt");
addBottle("K", "HCO3", "salt");
addBottle("Na", "S2O3", "salt");
addBottle("K", "I", "salt");
addBottle("K", "Br", "salt");

// Metals (Solids)
const metalReactants: ReactantDef[] = [
  {
    id: "mg_s",
    name: "Magnesium",
    formula: "Mg",
    state: "s",
    color: "bg-indigo-300/40",
    category: "metal",
    redox: {
      v0: -2.37,
      type: "reductor",
      halfReaction: "Mg²⁺ + 2e⁻ ⇌ Mg",
      structured: {
        electrons: 2,
        reactants: [{ species: "Mg²⁺", coeff: 1 }],
        products: [{ species: "Mg", coeff: 1 }],
      },
    },
  },
  {
    id: "zn_s",
    name: "Zink",
    formula: "Zn",
    state: "s",
    color: "bg-indigo-400/40",
    category: "metal",
    redox: {
      v0: -0.76,
      type: "reductor",
      halfReaction: "Zn²⁺ + 2e⁻ ⇌ Zn",
      structured: {
        electrons: 2,
        reactants: [{ species: "Zn²⁺", coeff: 1 }],
        products: [{ species: "Zn", coeff: 1 }],
      },
    },
  },
  {
    id: "cu_s",
    name: "Koper",
    formula: "Cu",
    state: "s",
    color: "bg-orange-400",
    category: "metal",
    redox: {
      v0: 0.34,
      type: "reductor",
      halfReaction: "Cu²⁺ + 2e⁻ ⇌ Cu",
      structured: {
        electrons: 2,
        reactants: [{ species: "Cu²⁺", coeff: 1 }],
        products: [{ species: "Cu", coeff: 1 }],
      },
    },
  },
  {
    id: "fe_s",
    name: "IJzer",
    formula: "Fe",
    state: "s",
    color: "bg-indigo-500/40",
    category: "metal",
    tags: ["metaal", "grijs", "ferro"],
    redox: {
      v0: -0.44,
      type: "reductor",
      halfReaction: "Fe²⁺ + 2e⁻ ⇌ Fe",
      structured: {
        electrons: 2,
        reactants: [{ species: "Fe²⁺", coeff: 1 }],
        products: [{ species: "Fe", coeff: 1 }],
      },
    },
  },
  {
    id: "pb_s",
    name: "Lood",
    formula: "Pb",
    state: "s",
    color: "bg-indigo-600/40",
    category: "metal",
    redox: {
      v0: -0.13,
      type: "reductor",
      halfReaction: "Pb²⁺ + 2e⁻ ⇌ Pb",
      structured: {
        electrons: 2,
        reactants: [{ species: "Pb²⁺", coeff: 1 }],
        products: [{ species: "Pb", coeff: 1 }],
      },
    },
  },
  {
    id: "al_s",
    name: "Aluminium",
    formula: "Al",
    state: "s",
    color: "bg-indigo-200/40",
    category: "metal",
    redox: {
      v0: -1.66,
      type: "reductor",
      halfReaction: "Al³⁺ + 3e⁻ ⇌ Al",
      structured: {
        electrons: 3,
        reactants: [{ species: "Al³⁺", coeff: 1 }],
        products: [{ species: "Al", coeff: 1 }],
      },
    },
  },
];

const specialReactants: ReactantDef[] = [
  // Weak Acids & Bases
  {
    id: "ch3cooh",
    name: "Azijnzuur",
    formula: "CH₃COOH",
    state: "aq",
    color: "bg-transparent",
    category: "acid",
    tags: ["zuur", "azijn", "zwak"],
  },
  {
    id: "nh3",
    name: "Ammonia",
    formula: "NH₃",
    state: "aq",
    color: "bg-transparent",
    category: "base",
    tags: ["base", "ammoniak", "zwak", "schoonmaak"],
  },
  {
    id: "caoh2",
    name: "Kalkwater",
    formula: "Ca(OH)₂",
    state: "aq",
    color: "bg-white/10",
    category: "base",
    tags: ["base", "kalk", "troebel"],
  },
  {
    id: "co2",
    name: "Koolstofdioxide",
    formula: "CO₂",
    state: "g",
    color: "bg-transparent",
    category: "oxide",
    tags: ["gas", "kalkwater", "indicator"],
  },

  // Redox Reagents
  {
    id: "kmno4",
    name: "Kaliumpermanganaat",
    formula: "KMnO₄",
    state: "aq",
    color: "bg-purple-600/80",
    category: "other",
    tags: ["oxidator", "paars", "violet", "sterk"],
    redox: [
      {
        v0: 1.51,
        type: "oxidator",
        halfReaction: "MnO₄⁻ + 8H⁺ + 5e⁻ ⇌ Mn²⁺ + 4H₂O",
        structured: {
          electrons: 5,
          reactants: [
            { species: "MnO₄⁻", coeff: 1 },
            { species: "H⁺", coeff: 8 },
          ],
          products: [
            { species: "Mn²⁺", coeff: 1 },
            { species: "H₂O", coeff: 4 },
          ],
        },
      },
      {
        v0: 0.59,
        type: "oxidator",
        halfReaction: "MnO₄⁻ + 2H₂O + 3e⁻ ⇌ MnO₂ + 4OH⁻",
        structured: {
          electrons: 3,
          reactants: [
            { species: "MnO₄⁻", coeff: 1 },
            { species: "H₂O", coeff: 2 },
          ],
          products: [
            { species: "MnO₂", coeff: 1 },
            { species: "OH⁻", coeff: 4 },
          ],
        },
      },
    ],
  },
  {
    id: "i2",
    name: "Joodwater",
    formula: "I₂(aq)",
    state: "aq",
    color: "bg-amber-700/80",
    category: "other",
    tags: ["oxidator", "bruin", "geel", "indicator"],
    redox: {
      v0: 0.62,
      type: "oxidator",
      halfReaction: "I₂ + 2e⁻ ⇌ 2I⁻",
      structured: {
        electrons: 2,
        reactants: [{ species: "I₂", coeff: 1 }],
        products: [{ species: "I⁻", coeff: 2 }],
      },
    },
  },
  {
    id: "h2o2",
    name: "Waterstofperoxide",
    formula: "H₂O₂",
    state: "aq",
    color: "bg-transparent",
    category: "other",
    tags: ["oxidator", "bleek", "peroxide"],
    redox: [
      {
        v0: 1.77, // Zuur milieu
        type: "oxidator",
        halfReaction: "H₂O₂ + 2H⁺ + 2e⁻ ⇌ 2H₂O",
        structured: {
          electrons: 2,
          reactants: [
            { species: "H₂O₂", coeff: 1 },
            { species: "H⁺", coeff: 2 },
          ],
          products: [{ species: "H₂O", coeff: 2 }],
        },
      },
      {
        v0: 0.88, // Neutraal milieu
        type: "oxidator",
        halfReaction: "H₂O₂ + 2e⁻ ⇌ 2OH⁻",
        structured: {
          electrons: 2,
          reactants: [{ species: "H₂O₂", coeff: 1 }],
          products: [{ species: "OH⁻", coeff: 2 }],
        },
      },
    ],
  },
  // Indicators / Special
  {
    id: "starch",
    name: "Zetmeel",
    formula: "(C₆H₁₀O₅)ₙ",
    state: "aq",
    color: "bg-yellow-50/20",
    category: "other",
    tags: ["indicator", "aardappel", "wit"],
  },

  // Environment Particles
  {
    id: "h_plus",
    name: "Waterstof-ion",
    formula: "H⁺",
    state: "aq",
    color: "bg-transparent",
    category: "other",
    redox: {
      v0: 0.0,
      type: "oxidator",
      halfReaction: "2H⁺ + 2e⁻ ⇌ H₂",
      structured: {
        electrons: 2,
        reactants: [{ species: "H⁺", coeff: 2 }],
        products: [{ species: "H₂", coeff: 1 }],
      },
    },
  },
  {
    id: "oh_minus",
    name: "Hydroxide-ion",
    formula: "OH⁻",
    state: "aq",
    color: "bg-transparent",
    category: "other",
    redox: {
      v0: -0.83,
      type: "reductor",
      halfReaction: "2H₂O + 2e⁻ ⇌ H₂ + 2OH⁻",
      structured: {
        electrons: 2,
        reactants: [{ species: "H₂O", coeff: 2 }],
        products: [
          { species: "H₂", coeff: 1 },
          { species: "OH⁻", coeff: 2 },
        ],
      },
    },
  },
  {
    id: "h2o_l",
    name: "Water",
    formula: "H₂O(l)",
    state: "l",
    color: "bg-blue-100/10",
    category: "other",
    redox: {
      v0: 1.23,
      type: "both",
      halfReaction: "O₂ + 4H⁺ + 4e⁻ ⇌ 2H₂O",
      structured: {
        electrons: 4,
        reactants: [
          { species: "O₂", coeff: 1 },
          { species: "H⁺", coeff: 4 },
        ],
        products: [{ species: "H₂O", coeff: 2 }],
      },
    },
  },
];

export const REACTANTS: ReactantDef[] = [
  ...generatedReactants,
  ...metalReactants,
  ...specialReactants,
];

// Helper to sort reactants for key lookup
const getKey = (ids: string[]) => ids.sort().join("+");

export const HARDCODED_REACTIONS: Record<string, ReactionDef> = {
  [getKey(["cuso4", "nh3"])]: {
    reactants: ["cuso4", "nh3"],
    products: "[Cu(NH3)4]SO4",
    observation: "Kleurverandering van lichtblauw naar diep donkerblauw.",
    observationKey: "complex_formed_copper",
    type: "Complexvorming",
    typeKey: "complex_formation",
    equation: "Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺",
    resultColor: "bg-blue-900/60",
  },
  [getKey(["hcl", "mg_s"])]: {
    reactants: ["hcl", "mg_s"],
    products: "MgCl2 + H2(g)",
    observation: "Bruisen, gasontwikkeling (waterstofgas).",
    observationKey: "gas_formation_hydrogen",
    type: "Redox",
    typeKey: "redox",
    equation: "Mg + 2H⁺ → Mg²⁺ + H₂(g)",
  },
  // --- REDOX REACTIONS (Essentials) ---
  [getKey(["kmno4", "naso3"])]: {
    reactants: ["kmno4", "naso3"],
    products: "Mn²⁺ + SO₄²⁻",
    observation:
      "Paarse kleur verdwijnt (ontkleuring). Bruine neerslag mogelijk in neutraal milieu.",
    observationKey: "redox_detected",
    type: "Redox",
    equation: "2MnO₄⁻ + 5SO₃²⁻ + 6H⁺ → 2Mn²⁺ + 5SO₄²⁻ + 3H₂O (zuur milieu)",
  },
  [getKey(["i2", "nas2o3"])]: {
    reactants: ["i2", "nas2o3"],
    products: "I⁻ + S₄O₆²⁻",
    observation: "Bruine kleur van jood verdwijnt (wordt kleurloos).",
    observationKey: "redox_detected",
    type: "Redox",
    equation: "I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻",
  },
  [getKey(["i2", "starch"])]: {
    reactants: ["i2", "starch"],
    products: "Jood-Zetmeel Complex",
    observation: "Intens donkerblauwe/zwarte kleur.",
    observationKey: "iodine_starch_complex",
    type: "Indicator",
    typeKey: "indicator",
    equation: "I₂ + Zetmeel → Blauw Complex",
    resultColor: "bg-blue-950/90",
  },
  // --- WEAK ACID/BASE ---
  [getKey(["nh3", "hcl"])]: {
    reactants: ["nh3", "hcl"],
    products: "NH₄Cl (Witte Rook)",
    observation:
      "Witte rook ontstaat (indien geconcentreerd) of warmteontwikkeling.",
    observationKey: "white_smoke_detected",
    type: "Zuur-Base",
    typeKey: "acid_base",
    equation: "NH₃ + HCl → NH₄Cl",
    resultColor: "bg-white/40",
  },
  [getKey(["ch3cooh", "naoh"])]: {
    reactants: ["ch3cooh", "naoh"],
    products: "NaCH₃COO + H₂O",
    observation:
      "Temperatuurstijging (Neutralisatie), geen zichtbare verandering.",
    observationKey: "neutralization_detected",
    type: "Neutralisatie",
    typeKey: "neutralization",
    equation: "CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O",
  },
  // --- CORRECTED CALCIUM HYDROXIDE REACTION ---
  [getKey(["caoh2", "co2"])]: {
    reactants: ["caoh2", "co2"],
    products: "CaCO₃(s) + H₂O",
    observation: "Kalkwater wordt troebel (witte neerslag).",
    observationKey: "limewater_turbid",
    type: "Neerslag",
    typeKey: "precipitation",
    equation: "Ca²⁺(aq) + 2OH⁻(aq) + CO₂(g) → CaCO₃(s) + H₂O(l)",
    resultColor: "bg-white/30",
  },
};

export const analyzeReaction = (
  selectedIds: string[],
  environment: EnvironmentType = "neutral",
): ReactionDef | null => {
  // 1. Check Hardcoded Exceptions (Complexes, Indicators)
  const key = getKey(selectedIds);
  if (HARDCODED_REACTIONS[key]) return HARDCODED_REACTIONS[key];

  const r1 = REACTANTS.find((r) => r.id === selectedIds[0]);
  const r2 = REACTANTS.find((r) => r.id === selectedIds[1]);

  if (!r1 || !r2) return null;

  // 2. Try Redox Engine (VWO Elite Upgrade)
  const redoxOutcome = predictRedox([r1, r2], environment, REACTANTS);
  if (redoxOutcome) return redoxOutcome;

  // 3. Fallback to Precipitation Engine
  return generateReaction(r1, r2);
};
