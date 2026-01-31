import "@features/math/ui/modules/gym/data/frenchData";

import { createMixEngine } from "@features/math/ui/modules/gym/engines/createMixEngine";
import { GymEngine } from "@shared/types/gym";

import { ConjugationAlgoEngine } from "./ConjugationAlgoEngine";
import { PronounPuzzleEngine } from "./PronounPuzzleEngine";
import { SubjonctifSniperEngine } from "./SubjonctifSniperEngine";
import { InfiniteFrenchEngine } from "./InfiniteFrenchEngine";

// Specialists
export { ConjugationAlgoEngine } from "./ConjugationAlgoEngine";
export { PronounPuzzleEngine } from "./PronounPuzzleEngine";
export { SubjonctifSniperEngine } from "./SubjonctifSniperEngine";

// Helper to convert Static Data to Infinite Backup
const toBackup = (key: string): unknown[] => {
    const levels = STATIC_QUESTIONS[key];
    if (!levels) return [];
    return Object.values(levels).flat();
};

import { createInfiniteEngine } from "../../../../math/ui/modules/gym/engines/AIGymAdapter";
import { STATIC_QUESTIONS } from "../../../../math/ui/modules/gym/engines/StaticDataEngine";

// Infinite Generalists
export const VocabCitoEngine = createInfiniteEngine(
    "vocab-cito",
    "Vocabulaire Stratégique",
    "Frans eindexamen idioom",
    "Focus op veelvoorkomende Franse examenwoorden: Toutefois, Néanmoins, Susciter, Préconiser, Redoutable.",
    toBackup("vocab-cito") as any
);

export const ConnectorCodeEngine = createInfiniteEngine(
    "connector-code",
    "Connecteur Scanner",
    "Frans Signaalwoorden",
    "Focus op tekstverbanden in het Frans: En revanche, Par conséquent, D'ailleurs, C'est pourquoi.",
    toBackup("connector-code") as any
);

export const FalseFriendsEngine = createInfiniteEngine(
    "false-friends",
    "Faux Amis",
    "Franse Instinkers",
    "Focus op 'False Friends' (Faux Amis) tussen Frans/Nederlands/Engels. Bijv: Travailler vs Travel.",
    toBackup("false-friends") as any
);

export const ToneDetectiveEngine = createInfiniteEngine(
    "tone-detective",
    "Ton & Attitude",
    "Frans Toon en Houding",
    "Focus op de houding van de schrijver: Élogieux, Sceptique, Ironique, Critique, Neutre, Indigné.",
    toBackup("tone-detective") as any
);

export const ReferenceRelayEngine = createInfiniteEngine(
    "reference-relay",
    "Référence Radar",
    "Franse Verwijswoorden",
    "Focus op verwijswoorden: Dont, Lequel, Duquel, Celui-ci, Celle-là, Y, En.",
    toBackup("reference-relay") as any
);

export const LitHistoryEngine = createInfiniteEngine(
    "lit-history",
    "Bibliothèque Élite",
    "Franse Literatuurgeschiedenis",
    "Focus op 19e/20e eeuw: Voltaire, Rousseau, Camus, Sartre, Baudelaire. Stromingen: Romantiek, Existentialisme.",
    toBackup("lit-history") as any
);

export const EssayExpertEngine = createInfiniteEngine(
    "essay-expert",
    "Stylo Formel",
    "Frans Formeel Schrijven",
    "Focus op formele zinnen voor brieven en betogen. 'Veuillez agréer', aanhef en afsluiting.",
    toBackup("essay-expert") as any
);

const frenchEnginesMap: Record<string, GymEngine> = {
    "conjugation-algo": ConjugationAlgoEngine,
    "subjonctif-sniper": SubjonctifSniperEngine,
    "pronoun-puzzle": PronounPuzzleEngine,
    "vocab-cito": VocabCitoEngine,
    "connector-code": ConnectorCodeEngine,
    "false-friends": FalseFriendsEngine,
    "tone-detective": ToneDetectiveEngine,
    "reference-relay": ReferenceRelayEngine,
    "lit-history": LitHistoryEngine,
    "essay-expert": EssayExpertEngine,
    "infinite-french": InfiniteFrenchEngine,
};

export const FRENCH_ENGINES = {
    ...frenchEnginesMap,
    "mix-french": createMixEngine(
        "mix-french",
        "Café au Lait",
        "Grammatica, Vocabulaire en Literatuur mix.",
        Object.values(frenchEnginesMap),
    ),
};
