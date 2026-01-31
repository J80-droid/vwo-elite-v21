import "@features/math/ui/modules/gym/data/dutchData"; // Laad de data

import { createMixEngine } from "@features/math/ui/modules/gym/engines/createMixEngine";
import { GymEngine, GymProblem } from "@shared/types/gym";

import { SentenceAnalysisEngine } from "./SentenceAnalysisEngine";
import { SpellingAlgoEngine } from "./SpellingAlgoEngine";

// De Specialisten (Algoritmisch)
export { SentenceAnalysisEngine } from "./SentenceAnalysisEngine";
export { SpellingAlgoEngine } from "./SpellingAlgoEngine";

// De Generalisten (Statisch)
// Helper to convert Static Data to Infinite Backup
const toBackup = (key: string): GymProblem[] => {
    const levels = STATIC_QUESTIONS[key];
    if (!levels) return [];
    return Object.values(levels).flat() as unknown as GymProblem[];
};

import { createInfiniteEngine } from "@features/math/ui/modules/gym/engines/AIGymAdapter";
import { STATIC_QUESTIONS } from "@features/math/ui/modules/gym/engines/StaticDataEngine";

// Infinite Generalists
export const ArgumentationLogicEngine = createInfiniteEngine(
    "argumentation-logic",
    "Drogreden Detector",
    "Dutch Argumentation",
    "Focus op Drogredenen: Ad Hominem, Cirkelredenering, Vals Dilemma, Overhaaste Generalisatie. Herkenning in tekst.",
    toBackup("argumentation-logic")
);

export const LiteratureQuizEngine = createInfiniteEngine(
    "literature-quiz",
    "Canon Kenner",
    "Dutch Literature History",
    "Focus op Literatuurgeschiedenis: Middeleeuwen (Karel/Elegast), Gouden Eeuw (Vondel/Hooft), Romantiek (Multatuli), Tachtigers.",
    toBackup("literature-quiz")
);

export const StylePolishEngine = createInfiniteEngine(
    "style-polish",
    "Stijl Chirurg",
    "Dutch Style Errors",
    "Focus op Stijlfouten: Contaminatie, Pleonasme, Tautologie, Incongruentie, Foutieve samentrekking.",
    toBackup("style-polish")
);

export const TextAnatomyEngine = createInfiniteEngine(
    "text-anatomy",
    "Tekst Anatomie",
    "Dutch Reading Comprehension",
    "Focus op Tekstbegrip en Signaalwoorden: Tekstverbanden (oorzakelijk, opsommend), Functiewoorden, Alinea-functies.",
    toBackup("text-anatomy")
);

export const VocabExpertEngine = createInfiniteEngine(
    "vocab-expert",
    "Woordenschat",
    "Dutch Vocabulary (Cito)",
    "Focus op Cito Woordenschat: Lastige woorden uit examens. Ambivalent, Triviaal, Nuance, Consensus, Relevant.",
    toBackup("vocab-expert")
);

// Lijst van alle NL engines
const dutchEnginesMap: Record<string, GymEngine> = {
    "spelling-algo": SpellingAlgoEngine,
    "sentence-analysis": SentenceAnalysisEngine,
    "argumentation-logic": ArgumentationLogicEngine,
    "text-anatomy": TextAnatomyEngine,
    "style-polish": StylePolishEngine,
    "literature-quiz": LiteratureQuizEngine,
    "vocab-expert": VocabExpertEngine,
};

export const DUTCH_ENGINES = {
    ...dutchEnginesMap,
    "mix-dutch": createMixEngine(
        "mix-dutch",
        "Hollandse Nieuwe",
        "Spelling, Argumentatie, Woordenschat en Literatuur.",
        Object.values(dutchEnginesMap),
    ),
};
