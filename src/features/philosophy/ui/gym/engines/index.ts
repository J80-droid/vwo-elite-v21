import "@features/math/ui/modules/gym/data/philosophyData";

import { createMixEngine } from "@features/math/ui/modules/gym/engines/createMixEngine";
import { GymEngine, GymProblem } from "@shared/types/gym";

import { LogicEngine } from "./LogicEngine";
import { SocialPhilosophyEngine } from "./SocialPhilosophyEngine";
import { ThoughtExperimentEngine } from "./ThoughtExperimentEngine";

// Specialists
export { LogicEngine } from "./LogicEngine";
export { SocialPhilosophyEngine } from "./SocialPhilosophyEngine";
export { ThoughtExperimentEngine } from "./ThoughtExperimentEngine";

// Static Generalists
// Helper to convert Static Data to Infinite Backup
const toBackup = (key: string): GymProblem[] => {
    const levels = STATIC_QUESTIONS[key];
    if (!levels) return [];
    return Object.values(levels).flat() as unknown as GymProblem[];
};

import { createInfiniteEngine } from "@features/math/ui/modules/gym/engines/AIGymAdapter";
import { STATIC_QUESTIONS } from "@features/math/ui/modules/gym/engines/StaticDataEngine";

// Infinite Generalists
export const AnthroIdentityEngine = createInfiniteEngine(
    "anthro-identity",
    "Who Am I?",
    "Philosophy Anthropology",
    "Focus op Filosofische Antropologie: Lichaam/Geest, Vrije Wil, Descartes, Materialisme, Dualisme.",
    toBackup("anthro-identity")
);

export const EthicsClashEngine = createInfiniteEngine(
    "ethics-clash",
    "The Good Place",
    "Philosophy Ethics",
    "Focus op Ethiek: Utilitarisme (Mill), Plichtethiek (Kant), Deugdethiek (Aristoteles).",
    toBackup("ethics-clash")
);

export const KnowledgeLabEngine = createInfiniteEngine(
    "knowledge-lab",
    "Truth Seeker",
    "Philosophy Epistemology",
    "Focus op Kennisleer en Wetenschapsfilosofie: Empirisme, Rationalisme, Popper, Kuhn, 'Brain in a vat'.",
    toBackup("knowledge-lab")
);

export const TechMediationEngine = createInfiniteEngine(
    "tech-mediation",
    "Cyborg Society",
    "Philosophy of Technology",
    "Focus op Techniekfilosofie: Verbeek, Mediatheorie, 'Techniek is niet neutraal', Human Enhancement.",
    toBackup("tech-mediation")
);

export const TechExam2025Engine = createInfiniteEngine(
    "tech-exam-2025",
    "Examen 2025",
    "Philosophy Exam 2025",
    "Focus op Plessner (Excentrische positie) en Foucault (Macht/Kennis) in relatie tot techniek.",
    toBackup("tech-exam-2025")
);

export const EasternPhilEngine = createInfiniteEngine(
    "eastern-phil",
    "Oosterse Wijsheid",
    "Eastern Philosophy",
    "Focus op Oosterse Filosofie: Taoïsme (Wu Wei), Boeddhisme (Verlichting, Lijden), Confucianisme.",
    toBackup("eastern-phil")
);

export const PrimaryTextEngine = createInfiniteEngine(
    "primary-text",
    "Source Decoder",
    "Philosophy Primary Texts",
    "Focus op tekstanalyse van filosofen: Heidegger, Nietzsche, Plato. Begrijpend lezen van fragmenten.",
    toBackup("primary-text")
);

const philoEnginesMap: Record<string, GymEngine> = {
    "logic-engine": LogicEngine,
    "social-philosophy": SocialPhilosophyEngine,
    "thought-experiment": ThoughtExperimentEngine,
    "anthro-identity": AnthroIdentityEngine,
    "ethics-clash": EthicsClashEngine,
    "knowledge-lab": KnowledgeLabEngine,
    "tech-mediation": TechMediationEngine,
    "tech-exam-2025": TechExam2025Engine,
    "eastern-phil": EasternPhilEngine,
    "primary-text": PrimaryTextEngine,
};

export const PHILOSOPHY_ENGINES = {
    ...philoEnginesMap,
    "mix-philosophy": createMixEngine(
        "mix-philosophy",
        "Socratic Milkshake",
        "Logica, Ethiek en Gedachte-experimenten mix.",
        Object.values(philoEnginesMap),
    ),
};
