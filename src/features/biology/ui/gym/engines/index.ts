import "@features/math/ui/modules/gym/data/biologyData"; // Laad de data

import { createMixEngine } from "@features/math/ui/modules/gym/engines/createMixEngine";
import { GymEngine, GymProblem } from "@shared/types/gym";

// Specialisten
import { CellDivisionEngine } from "./CellDivisionEngine";
import { FeedbackLoopEngine } from "./FeedbackLoopEngine";
import { GeneticsMendelEngine } from "./GeneticsMendelEngine";
import { HardyWeinbergEngine } from "./HardyWeinbergEngine";
import { InfiniteBioEngine } from "./InfiniteBioEngine";
import { ProteinSynthEngine } from "./ProteinSynthEngine";

// Specialisten Exports
export { CellDivisionEngine } from "./CellDivisionEngine";
export { FeedbackLoopEngine } from "./FeedbackLoopEngine";
export { GeneticsMendelEngine } from "./GeneticsMendelEngine";
export { HardyWeinbergEngine } from "./HardyWeinbergEngine";
export { InfiniteBioEngine } from "./InfiniteBioEngine";
export { ProteinSynthEngine } from "./ProteinSynthEngine";

// Generalisten (Statisch via Factory)
// Helper to convert Static Data to Infinite Backup
const toBackup = (key: string): GymProblem[] => {
    const levels = STATIC_QUESTIONS[key];
    if (!levels) return [];
    return Object.values(levels).flat() as unknown as GymProblem[];
};

import { createInfiniteEngine } from "@features/math/ui/modules/gym/engines/AIGymAdapter";
import { STATIC_QUESTIONS } from "@features/math/ui/modules/gym/engines/StaticDataEngine";

// Infinite Generalists
export const BioEnergyEngine = createInfiniteEngine(
    "bio-energy",
    "ATP Centrale",
    "Biology Metabolism",
    "Focus op Bio-Energy: Fotosynthese (Licht/Donker reacties), Dissimilatie (Glycolyse, Krebscyclus), ATP.",
    toBackup("bio-energy")
);

export const CirculationPumpEngine = createInfiniteEngine(
    "circulation-pump",
    "Hartslag Monitor",
    "Biology Circulation",
    "Focus op Bloedsomloop: Hart (bouw/werking), Bloedvaten, Bloeddruk, Stoffentransport.",
    toBackup("circulation-pump")
);

export const HormoneControlEngine = createInfiniteEngine(
    "hormone-control",
    "Endocriene Regisseur",
    "Biology Hormones",
    "Focus op Hormoonstelsel: Hypofyse, Schildklier, Insuline/Glucagon, Negatieve terugkoppeling.",
    toBackup("hormone-control")
);

export const ImmunoDefenseEngine = createInfiniteEngine(
    "immuno-defense",
    "Afweer Linie",
    "Biology Immunology",
    "Focus op Afweer: B-cellen, T-cellen, Antistoffen, Vaccinatie, Aspecifieke afweer.",
    toBackup("immuno-defense")
);

export const MembraneTransportEngine = createInfiniteEngine(
    "membrane-transport",
    "Membraan Poortwachter",
    "Biology Cell Transport",
    "Focus op Membraantransport: Osmose, Diffusie, Actief transport, Endocytose, Turgor.",
    toBackup("membrane-transport")
);

export const NeuralNetEngine = createInfiniteEngine(
    "neural-net",
    "Zenuwflits",
    "Biology Nervous System",
    "Focus op Zenuwstelsel: Actiepotentiaal, Synapsspleet, Neurotransmitters, Reflexen, Centraal Zenuwstelsel.",
    toBackup("neural-net")
);

export const NitrogenCycleEngine = createInfiniteEngine(
    "nitrogen-cycle",
    "Stikstof Navigator",
    "Biology Ecosystems",
    "Focus op Stikstofkringloop: Ammonificatie, Nitrificatie, Denitrificatie, Stikstofbindende bacteriën.",
    toBackup("nitrogen-cycle")
);

export const EnzymeExpertEngine = createInfiniteEngine(
    "enzymes",
    "Enzym Expert",
    "Biology Enzymes",
    "Focus op Enzymen: Slot-sleutel model, Optimumkromme, Denaturatie, Remming (competitief/allosterisch).",
    toBackup("enzymes")
);

export const EcoSystemEngine = createInfiniteEngine(
    "ecology",
    "Eco Systeem",
    "Biology Ecology",
    "Focus op Ecologie: Populaties, Voedselwebben, Successie, Biotische/Abiotische factoren.",
    toBackup("ecology")
);

// Definieer de losse engines
const bioEnginesMap: Record<string, GymEngine> = {
    "infinite-bio": InfiniteBioEngine,
    "cell-division": CellDivisionEngine,
    "genetics-mendel": GeneticsMendelEngine,
    "hardy-weinberg": HardyWeinbergEngine,
    "protein-synth": ProteinSynthEngine,
    "bio-energy": BioEnergyEngine,
    "circulation-pump": CirculationPumpEngine,
    "hormone-control": HormoneControlEngine,
    "immuno-defense": ImmunoDefenseEngine,
    "membrane-transport": MembraneTransportEngine,
    "neural-net": NeuralNetEngine,
    "nitrogen-cycle": NitrogenCycleEngine,
    "enzymes": EnzymeExpertEngine,
    "ecology": EcoSystemEngine,
    "feedback-loop": FeedbackLoopEngine,
};

// Export alles inclusief de Mix
export const BIO_ENGINES: Record<string, GymEngine> = {
    ...bioEnginesMap,
    "mix-bio": createMixEngine(
        "mix-bio",
        "Biology Milkshake",
        "Test je parate kennis over de hele breedte.",
        Object.values(bioEnginesMap),
    ),
};
