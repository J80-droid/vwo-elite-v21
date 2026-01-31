import "@features/math/ui/modules/gym/data/chemistryData"; // Laad de statische data

import { createMixEngine } from "@features/math/ui/modules/gym/engines/createMixEngine";
import { GymEngine, GymProblem } from "@shared/types/gym";

import { EquilibriumCalcEngine } from "./EquilibriumCalcEngine";
import { GreenGaugeEngine } from "./GreenGaugeEngine";
import { InfiniteChemEngine } from "./InfiniteChemEngine";
import { PhPrecisionEngine } from "./PhPrecisionEngine";
import { StoichiometryEngine } from "./StoichiometryEngine";

// De Specialisten (Algoritmisch)
export { EquilibriumCalcEngine } from "./EquilibriumCalcEngine";
export { GreenGaugeEngine } from "./GreenGaugeEngine";
export { InfiniteChemEngine } from "./InfiniteChemEngine";
export { PhPrecisionEngine } from "./PhPrecisionEngine";
export { StoichiometryEngine } from "./StoichiometryEngine";

// De Generalisten (Statisch)
// Helper to convert Static Data to Infinite Backup

const toBackup = (key: string): GymProblem[] => {
    const levels = STATIC_QUESTIONS[key];
    if (!levels) return [];
    return Object.values(levels).flat() as unknown as GymProblem[];
};

import { ChemistryFormatter, createInfiniteEngine } from "@features/math/ui/modules/gym/engines/AIGymAdapter";
import { STATIC_QUESTIONS } from "@features/math/ui/modules/gym/engines/StaticDataEngine";

// Infinite Generalists (AI-Powered with Static Backup)
export const KineticsExpertEngine = createInfiniteEngine(
    "kinetics-master",
    "Snelheids Duivel",
    "Chemistry Kinetics",
    "Focus op Reactiesnelheid: Botsende deeltjes model, Activeringsenergie, Katalysator, Reactieorde.",
    toBackup("kinetics-master"),
    ChemistryFormatter
);

export const AnalysisDetectiveEngine = createInfiniteEngine(
    "analysis-detective",
    "Spectra Sherlock",
    "Chemistry Analysis",
    "Focus op Spectrometrie: Massaspectrometrie (isotopen/fragmentatie), IR-spectroscopie (groepen), H-NMR.",
    toBackup("analysis-detective"),
    ChemistryFormatter
);

export const BondingBuilderEngine = createInfiniteEngine(
    "bonding-builder",
    "Bonding Basics",
    "Chemistry Bonding",
    "Focus op Bindingen: Vanderwaals, H-bruggen, Dipool-dipool, Kookpunten verklaren, Oplosbaarheid.",
    toBackup("bonding-builder"),
    ChemistryFormatter
);

export const CarbonCodeEngine = createInfiniteEngine(
    "carbon-code",
    "Nomenclatuur Ninja",
    "Organic Chemistry naming",
    "Focus op Koolstofchemie Naamgeving (IUPAC): Esters, Amiden, Isomeren (Cis/Trans, Spiegelbeeld).",
    toBackup("carbon-code"),
    ChemistryFormatter
);

export const EquilibriumExpertEngine = createInfiniteEngine(
    "equilibrium-expert",
    "Le Chatelier",
    "Chemistry Equilibrium Principles",
    "Focus op Le Chatelier: Invloed van Druk, Temperatuur (Endo/Exo) en Concentratie op evenwicht.",
    toBackup("equilibrium-expert"),
    ChemistryFormatter
);

export const PolymerPuzzleEngine = createInfiniteEngine(
    "polymer-puzzle",
    "Polymer Power",
    "Chemistry Polymers",
    "Focus op Polymeren: Additie vs Condensatie, Monomeren herkennen, Thermoplast vs-harder.",
    toBackup("polymer-puzzle"),
    ChemistryFormatter
);

export const RedoxRelayEngine = createInfiniteEngine(
    "redox-relay",
    "Electron Exchange",
    "Chemistry Redox Basics",
    "Focus op Redox basis: Oxidator/Reductor herkennen, Halfreacties opstellen, Standaardelektrodepotentiaal.",
    toBackup("redox-relay"),
    ChemistryFormatter
);

// Lijst van alle chemie motoren
const chemEnginesMap: Record<string, GymEngine> = {
    "infinite-chem": InfiniteChemEngine,
    "mol-mastery": StoichiometryEngine,
    "ph-precision": PhPrecisionEngine,
    "green-gauge": GreenGaugeEngine,
    "equilibrium-calc": EquilibriumCalcEngine,
    "kinetics-master": KineticsExpertEngine,
    "analysis-detective": AnalysisDetectiveEngine,
    "bonding-builder": BondingBuilderEngine,
    "carbon-code": CarbonCodeEngine,
    "equilibrium-expert": EquilibriumExpertEngine,
    "polymer-puzzle": PolymerPuzzleEngine,
    "redox-relay": RedoxRelayEngine,
};

export const CHEM_ENGINES: Record<string, GymEngine> = {
    ...chemEnginesMap,
    "mix-chemistry": createMixEngine(
        "mix-chemistry",
        "Scheikunde Shake",
        "Alles door elkaar: van pH tot plastics.",
        Object.values(chemEnginesMap),
    ),
};
