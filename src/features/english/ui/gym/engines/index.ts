import "@features/math/ui/modules/gym/data/englishData"; // Load Data

import { createMixEngine } from "@features/math/ui/modules/gym/engines/createMixEngine";
import { GymEngine } from "@shared/types/gym";

import { GrammarPrecisionEngine } from "./GrammarPrecisionEngine";
import { IrregularVerbEngine } from "./IrregularVerbEngine";
import { SentenceShifterEngine } from "./SentenceShifterEngine";
import { InfiniteEnglishEngine } from "./InfiniteEnglishEngine";

// Specialists
export { GrammarPrecisionEngine } from "./GrammarPrecisionEngine";
export { IrregularVerbEngine } from "./IrregularVerbEngine";
export { SentenceShifterEngine } from "./SentenceShifterEngine";

// Static Generalists
// Helper to convert Static Data to Infinite Backup
const toBackup = (key: string): any[] => {
    const levels = STATIC_QUESTIONS[key];
    if (!levels) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.values(levels).flat();
};

import { createInfiniteEngine } from "@features/math/ui/modules/gym/engines/AIGymAdapter";
import { STATIC_QUESTIONS } from "@features/math/ui/modules/gym/engines/StaticDataEngine";

// Infinite Generalists (AI-Powered with Static Backup)
export const SignalDetectiveEngine = createInfiniteEngine(
    "signal-detective",
    "Signaal Scanners",
    "English Linking Words",
    "Focus op signaalwoorden (linking words): However, Moreover, Consequently, Despite, Furthermore. Vraag naar betekenis of functie in tekst.",
    toBackup("signal-detective")
);

export const VocabAcademicEngine = createInfiniteEngine(
    "vocab-academic",
    "Academic Vocab",
    "English Academic Vocabulary (C1/C2)",
    "Focus op academisch Engels: Ambiguity, Reluctance, Enhance, Inevitable, Substantiate. Vraag naar betekenis of synoniem.",
    toBackup("vocab-academic")
);

export const FormalWriterEngine = createInfiniteEngine(
    "formal-writer",
    "Essay Engineer",
    "Formal English Writing",
    "Focus op formeel schrijven: Linking words, 'I think' vermijden, academische toon, passief gebruik.",
    toBackup("formal-writer")
);

export const LitTermsEngine = createInfiniteEngine(
    "lit-terms",
    "Literary Lens",
    "English Literary Terms",
    "Focus op literaire begrippen: Metaphor, Simile, Alliteration, Personification, Omniscient Narrator, Foreshadowing.",
    toBackup("lit-terms")
);

export const ReferenceRadarEngine = createInfiniteEngine(
    "reference-radar",
    "Verwijs Verrekijker",
    "Reference Words",
    "Focus op verwijswoorden: This, That, The former, The latter, Which. Waar verwijst het naar?",
    toBackup("reference-radar")
);

export const IdiomImpactEngine = createInfiniteEngine(
    "idiom-impact",
    "Idiom Impact",
    "English Idioms & Expressions",
    "Focus op Engelse uitdrukkingen en spreekwoorden. Once in a blue moon, To sit on the fence, etc.",
    toBackup("idiom-impact")
);

export const FunctionFinderEngine = createInfiniteEngine(
    "function-finder",
    "Functie Fabriek",
    "Text Functions (Cito)",
    "Focus op alineafuncties: Elaboration, Concession, Summary, Cause-Effect, Illustration.",
    toBackup("function-finder")
);

export const ToneTunerEngine = createInfiniteEngine(
    "tone-tuner",
    "Tone Tuner",
    "Tone of Voice",
    "Focus op de houding van de auteur: Critical, Laudatory, Sceptical, Indignant, Mocking, Objective.",
    toBackup("tone-tuner")
);

export const CollocationKingEngine = createInfiniteEngine(
    "collocation-king",
    "Collocation King",
    "English Collocations",
    "Focus op vaste woordcombinaties: 'Do homework' (not make), 'Take a photo', 'Sign a contract'. Prevent Dunglish.",
    toBackup("collocation-king")
);

export const LitHistoryEnEngine = createInfiniteEngine(
    "lit-history-en",
    "Lit History",
    "English Literature History",
    "Focus op literaire periodes: Romanticism, Victorian Age, Renaissance, Modernism, War Poets.",
    toBackup("lit-history-en")
);

const englishEnginesMap: Record<string, GymEngine> = {
    "grammar-precision": GrammarPrecisionEngine,
    "irregular-verbs": IrregularVerbEngine,
    "sentence-shifter": SentenceShifterEngine,
    "signal-detective": SignalDetectiveEngine,
    "vocab-academic": VocabAcademicEngine,
    "formal-writer": FormalWriterEngine,
    "lit-terms": LitTermsEngine,
    "reference-radar": ReferenceRadarEngine,
    "idiom-impact": IdiomImpactEngine,
    "function-finder": FunctionFinderEngine,
    "tone-tuner": ToneTunerEngine,
    "collocation-king": CollocationKingEngine,
    "lit-history-en": LitHistoryEnEngine,
    "infinite-english": InfiniteEnglishEngine,
};

export const ENGLISH_ENGINES = {
    ...englishEnginesMap,
    "mix-english": createMixEngine(
        "mix-english",
        "English Breakfast",
        "Grammar, Vocab & Literature mix.",
        Object.values(englishEnginesMap),
    ),
};
