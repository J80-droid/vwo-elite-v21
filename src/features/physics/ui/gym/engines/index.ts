import "@features/math/ui/modules/gym/data/physicsData";

import { createMixEngine } from "@features/math/ui/modules/gym/engines/createMixEngine";
import { GymEngine, GymProblem } from "@shared/types/gym";

// Algorithmic Engines
import { CircuitEngine } from "./CircuitEngine";
import { DecayEngine } from "./DecayEngine";
import { FlashcardEngine } from "./flashcards/FlashcardEngine";
import { ForceVectorEngine } from "./ForceVectorEngine";
import { GasLawEngine } from "./GasLawEngine";
import { IsolatorEngine } from "./IsolatorEngine";
import { MagneticFieldEngine } from "./MagneticFieldEngine";
import { MechanicsMasterEngine } from "./MechanicsMasterEngine";
import { MechanicsProEngine } from "./MechanicsProEngine";
import { OpticsEngine } from "./OpticsEngine";
import { OrbitEngine } from "./OrbitEngine";
import { QuantumEngine } from "./QuantumEngine";
import { SigFigEngine } from "./SigFigEngine";
import { UnitEngine } from "./UnitEngine";
import { WaveWizardEngine } from "./WaveWizardEngine";

// Helper to convert Static Data to Infinite Backup

const toBackup = (key: string): GymProblem[] => {
    const levels = STATIC_QUESTIONS[key];
    if (!levels) return [];
    return Object.values(levels).flat() as unknown as GymProblem[];
};

import { createInfiniteEngine } from "@features/math/ui/modules/gym/engines/AIGymAdapter";
import { STATIC_QUESTIONS } from "@features/math/ui/modules/gym/engines/StaticDataEngine";

// Infinite Generalists (AI-Powered with Static Backup)
export const GraphInterpreterEngine = createInfiniteEngine(
    "graph-interpreter",
    "Grafiek Goeroe",
    "Physics Graphs",
    "Focus op Grafieken lezen: (v,t)-diagrammen (helling/oppervlakte), (s,t)-diagrammen, Raaklijnmethode.",
    toBackup("graph-interpreter")
);

export const ParticleZooEngine = createInfiniteEngine(
    "particle-zoo",
    "Deeltjes Dierentuin",
    "Physics Standard Model",
    "Focus op Standaardmodel: Quarks, Leptonen, Bosonen (Higgs), Krachten, Antimaterie.",
    toBackup("particle-zoo")
);

export const AstroKnowledgeEngine = createInfiniteEngine(
    "astro-knowledge",
    "Sterrenkijker",
    "Physics Astrophysics",
    "Focus op Astrofysica: HR-diagram, Levensloop sterren, Roodverschuiving, Oerknal, Zwarte stralers.",
    toBackup("astro-knowledge")
);

export const physicsEnginesMap: Record<string, GymEngine> = {
    "circuits": CircuitEngine,
    "decay": DecayEngine,
    "phys-vectors": ForceVectorEngine,
    "gas-law": GasLawEngine,
    "isolator": IsolatorEngine,
    "magnetic-field": MagneticFieldEngine,
    "mechanics-master": MechanicsMasterEngine,
    "mechanics-pro": MechanicsProEngine,
    "optics-engine": OpticsEngine,
    "orbit-engine": OrbitEngine,
    "quantum-leap": QuantumEngine,
    "sigfig": SigFigEngine,
    "units": UnitEngine,
    "wave-wizard": WaveWizardEngine,
    "flashcards": FlashcardEngine,
    "graph-interpreter": GraphInterpreterEngine,
    "particle-zoo": ParticleZooEngine,
    "astro-knowledge": AstroKnowledgeEngine,
};

export const PHYSICS_ENGINES: Record<string, GymEngine> = {
    ...physicsEnginesMap,
    "mix-physics": createMixEngine(
        "mix-physics",
        "Newton's Nightmare",
        "Alle natuurkunde domeinen.",
        Object.values(physicsEnginesMap),
    ),
};

export {
    CircuitEngine,
    DecayEngine,
    FlashcardEngine,
    ForceVectorEngine,
    GasLawEngine,
    IsolatorEngine,
    MagneticFieldEngine,
    MechanicsMasterEngine,
    MechanicsProEngine,
    OpticsEngine,
    OrbitEngine,
    QuantumEngine,
    SigFigEngine,
    UnitEngine,
    WaveWizardEngine,
};
