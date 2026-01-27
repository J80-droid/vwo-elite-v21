import { EnvironmentType, ReactantDef, ReactionDef } from "./ChemistryTypes";
import { RedoxCouple, SimulationResult } from "./RedoxTypes";
export type { RedoxCouple, SimulationResult };

// --- HELPER: GCD (Greatest Common Divisor) ---
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// --- HELPER: PARSE CHEMICAL STRING ---
// Haalt species en coëfficiënten uit een string als "MnO4- + 8H+ + 5e-"
const parseChemicalPart = (part: string) => {
  const regex = /^\s*(\d*)\s*(.*)\s*$/;
  const match = part.match(regex);
  if (!match) return { count: 1, species: part.trim() };

  return {
    count: match[1] ? parseInt(match[1]) : 1,
    species: match[2]!.trim(),
  };
};

const parseHalfReaction = (equation: string) => {
  const parts = equation.split("+").map((p) => parseChemicalPart(p.trim()));

  // VERBETERDE REGEX: Zoekt e-, e⁻, e^-, e met spaties, etc.
  const electronRegex = /^e[-⁻^–]?$/i;

  const electronPart = parts.find(
    (p) =>
      electronRegex.test(p.species) ||
      p.species.includes("e⁻") ||
      p.species.endsWith("e-"),
  );
  const electrons = electronPart ? electronPart.count : 0;

  // Filter elektronen uit de lijst van chemische stoffen
  const chemicalParts = parts.filter(
    (p) =>
      !electronRegex.test(p.species) &&
      !p.species.includes("e⁻") &&
      !p.species.endsWith("e-"),
  );

  return { electrons, parts: chemicalParts };
};

// --- CORE FUNCTION 1: BINAS SIMULATOR CALCULATOR ---
export const calculateRedox = (
  oxCouple: RedoxCouple,
  redCouple: RedoxCouple,
): SimulationResult => {
  const deltaV = oxCouple.potential - redCouple.potential;
  const canOccur = deltaV > 0; // VWO regel: ΔV > 0

  // 1. Analyseer halfreacties (Parse strings)
  const oxData = parseHalfReaction(oxCouple.oxidator);
  // Voor de ox-couple is de rechterkant de reductor-kant
  const oxReductorSide = parseHalfReaction(oxCouple.reductor);

  // Bij de gekozen reductor (redCouple) reageert hij als reductor: Red -> Ox + ne-
  // Dus we moeten de 'oxidator' kant parsen om te weten hoeveel elektronen hij AFGEEFT.
  const redOxSide = parseHalfReaction(redCouple.oxidator);
  const redReductorSide = parseHalfReaction(redCouple.reductor);

  const eOx = oxData.electrons || 1;
  const eRed = redOxSide.electrons || 1;

  // 2. Balans Bepalen
  const common = (eOx * eRed) / gcd(eOx, eRed);
  const facOx = common / eOx;
  const facRed = common / eRed;

  const log = [
    `Oxidator halfreactie bevat ${eOx}e⁻.`,
    `Reductor halfreactie bevat ${eRed}e⁻.`,
    `Kleinste gemene veelvoud is ${common}e⁻.`,
    `Vermenigvuldig Oxidator met ${facOx}.`,
    `Vermenigvuldig Reductor met ${facRed}.`,
    `De bronspanning (ΔV) is ${oxCouple.potential.toFixed(2)} - ${redCouple.potential.toFixed(2)} = ${deltaV.toFixed(2)}V.`,
  ];

  if (!canOccur) {
    return {
      canOccur: false,
      deltaV,
      factors: { ox: facOx, red: facRed },
      log: [...log, "Reactie verloopt niet spontaan (ΔV < 0)."],
      totalReaction: "Geen Reactie",
    };
  }

  // 3. Totaalvergelijking Samenstellen
  const totalLeft = new Map<string, number>();
  const totalRight = new Map<string, number>();

  const add = (
    map: Map<string, number>,
    parts: { count: number; species: string }[],
    factor: number,
  ) => {
    parts.forEach((p) => {
      const current = map.get(p.species) || 0;
      map.set(p.species, current + p.count * factor);
    });
  };

  // Oxidator Halfreactie (Links -> Rechts)
  add(totalLeft, oxData.parts, facOx);
  add(totalRight, oxReductorSide.parts, facOx);

  // Reductor Halfreactie (Rechts -> Links)
  add(totalLeft, redReductorSide.parts, facRed);
  add(totalRight, redOxSide.parts, facRed);

  // 4. Wegstrepen (Cancel H+, H2O, OH-)
  const cleanKey = (k: string) =>
    k.replace(/\(aq\)|\(l\)|\(g\)|\(s\)/g, "").trim();

  ["H⁺", "H2O", "OH⁻", "H₂O", "H+"].forEach((species) => {
    let leftCount = 0;
    let rightCount = 0;
    let leftKey = "";
    let rightKey = "";

    for (const [key, val] of totalLeft.entries()) {
      if (cleanKey(key) === cleanKey(species)) {
        leftCount = val;
        leftKey = key;
      }
    }
    for (const [key, val] of totalRight.entries()) {
      if (cleanKey(key) === cleanKey(species)) {
        rightCount = val;
        rightKey = key;
      }
    }

    if (leftCount > 0 && rightCount > 0) {
      const min = Math.min(leftCount, rightCount);
      if (leftKey) totalLeft.set(leftKey, leftCount - min);
      if (rightKey) totalRight.set(rightKey, rightCount - min);
    }
  });

  // Formatteer string
  const mapToString = (map: Map<string, number>) => {
    const parts: string[] = [];
    map.forEach((count, species) => {
      if (count > 0) parts.push(count === 1 ? species : `${count} ${species}`);
    });
    return parts.join(" + ");
  };

  return {
    canOccur: true,
    deltaV,
    factors: { ox: facOx, red: facRed },
    log,
    totalReaction: `${mapToString(totalLeft)} → ${mapToString(totalRight)}`,
  };
};

// --- CORE FUNCTION 2: LAB ENGINE PREDICTOR ---
export const predictRedox = (
  selected: ReactantDef[],
  environment: EnvironmentType,
  allReactants: ReactantDef[],
): ReactionDef | null => {
  // 1. Get Environment Particles
  const envParticles: ReactantDef[] = [];
  if (environment === "acid") {
    const hPlus = allReactants.find((r) => r.id === "h_plus");
    if (hPlus) envParticles.push(hPlus);
  }
  if (environment === "base") {
    const ohMinus = allReactants.find((r) => r.id === "oh_minus");
    if (ohMinus) envParticles.push(ohMinus);
  }
  const h2o = allReactants.find((r) => r.id === "h2o_l");
  if (h2o) envParticles.push(h2o);

  const available = [...selected, ...envParticles].filter((r) => r.redox);

  // Flatten all possible redox roles
  const flattenedRoles = available
    .flatMap((r) => {
      const entries = Array.isArray(r.redox) ? r.redox : [r.redox!];
      return entries.flatMap((e) => {
        if (!e || !e.structured) return [];
        const types: ("oxidator" | "reductor")[] =
          e.type === "both" ? ["oxidator", "reductor"] : [e.type];
        return types.map((t) => ({ entry: e, parent: r, currentType: t }));
      });
    })
    .filter((role) => {
      const sideToCheck =
        role.currentType === "oxidator"
          ? role.entry.structured!.reactants
          : role.entry.structured!.products;
      return sideToCheck.every((req) => {
        const normReq = req.species.replace(/\(aq\)|\(l\)|\(g\)/g, "").trim();
        if (normReq === "e⁻" || normReq === "e-") return true;
        return available.some((a) => {
          const normA = a.formula.replace(/\(aq\)|\(l\)|\(g\)/g, "").trim();
          return normA === normReq || a.id === normReq.toLowerCase();
        });
      });
    });

  const bestOxRole = flattenedRoles
    .filter((r) => r.currentType === "oxidator")
    .sort((a, b) => b.entry.v0 - a.entry.v0)[0];

  const bestRedRole = flattenedRoles
    .filter((r) => r.currentType === "reductor")
    .sort((a, b) => a.entry.v0 - b.entry.v0)[0];

  if (!bestOxRole || !bestRedRole) return null;

  const deltaV = bestOxRole.entry.v0 - bestRedRole.entry.v0;
  if (deltaV <= 0) return null;

  // Automated Balancing
  // Automated Balancing (Not yet used in display, but calculated for future extensions)
  // const oxStruct = bestOxRole.entry.structured!;
  // const redStruct = bestRedRole.entry.structured!;
  // const eOx = oxStruct.electrons;
  // const eRed = redStruct.electrons;
  // const common = (eOx * eRed) / gcd(eOx, eRed);
  // const mOx = common / eOx;
  // const mRed = common / eRed;

  // Handle results
  let observationKey = "redox_detected";
  let resultColor = "bg-blue-500/20";

  if (bestOxRole.parent.id === "kmno4") {
    observationKey =
      environment === "base"
        ? "redox_permanganate_brown"
        : "redox_permanganate_clear";
    resultColor = environment === "base" ? "bg-amber-900/60" : "bg-transparent";
  } else if (bestOxRole.parent.id === "i2" || bestRedRole.parent.id === "i2") {
    if (bestOxRole.parent.id === "i2") {
      observationKey = "redox_iodine_clear";
      resultColor = "bg-transparent";
    }
  } else if (
    bestRedRole.parent.id === "ki" ||
    bestRedRole.parent.id === "kbr"
  ) {
    if (bestRedRole.parent.id === "ki") {
      observationKey = "redox_iodine_formed";
      resultColor = "bg-amber-900/40";
    } else {
      observationKey = "redox_bromine_formed";
      resultColor = "bg-orange-500/40";
    }
  }

  return {
    reactants: selected.map((r) => r.id),
    products: "Redox Producten",
    observation: `Spontane redoxreactie waargenomen tussen ${bestOxRole.parent.formula} en ${bestRedRole.parent.formula}. ΔV = ${deltaV.toFixed(2)}V.`,
    observationKey,
    observationData: {
      ox: bestOxRole.parent.formula,
      red: bestRedRole.parent.formula,
      dv: deltaV.toFixed(2),
    },
    type: "Redox",
    typeKey: "redox",
    equation: `ΔV = ${deltaV.toFixed(2)}V`,
    resultColor,
  };
};
