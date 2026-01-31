/**
 * Centralized Module IDs for the Gym system.
 * Prevents magic strings and improves IDE refactoring.
 */
export const GYM_IDS = {
    // --- SPECIALS ---
    MIX_MATH: "mix-math",
    MIX_PHYSICS: "mix-physics",
    MIX_BIO: "mix-bio",
    MIX_ENGLISH: "mix-english",
    MIX_PHILOSOPHY: "mix-philosophy",
    MIX_FRENCH: "mix-french",
    MIX_DUTCH: "mix-dutch",
    MIX_ECONOMICS: "mix-economics",
    MIX_CHEMISTRY: "mix-chemistry",

    // --- INFINITE ENGINES (AI) ---
    INFINITE_BIO: "infinite-bio",
    INFINITE_CHEMISTRY: "infinite-chemistry",
    INFINITE_ENGLISH: "infinite-english",
    INFINITE_FRENCH: "infinite-french",
    INFINITE_DUTCH: "infinite-dutch",
    INFINITE_HISTORY: "infinite-history",
    INFINITE_GEOGRAPHY: "infinite-geography",
    INFINITE_MATH: "infinite-math",
    INFINITE_PHYSICS: "infinite-physics",
    INFINITE_PHILOSOPHY: "infinite-philosophy",
    INFINITE_ECONOMICS: "infinite-economics",

    // MATH
    FRACTIONS: "fractions",
    EXPONENTS: "exponents",
    TRIG: "trig",
    DERIVS: "derivs",
    FORMULAS: "formulas",
    VECTORS: "vectors",
    INTEGRAAL: "integraal",
    LIMITS: "limits",
    DOMAIN: "domain",
    GEOMETRY: "geometry",
    STATS: "stats-mastery",

    // PHYSICS
    UNITS: "units",
    SIGFIG: "sigfig",
    ISOLATOR: "isolator",
    PHYS_VECTORS: "phys-vectors",
    DECAY: "decay",
    CIRCUITS: "circuits",
    GRAPH: "graph-interpreter",
    FLASHCARDS: "flashcards",
    GAS_LAW: "gas-law",
    MAGNETIC: "magnetic-field",
    MECHANICS_MASTER: "mechanics-master",
    MECHANICS_PRO: "mechanics-pro",
    OPTICS: "optics-engine",
    ORBIT: "orbit-engine",
    QUANTUM: "quantum-leap",
    WAVES: "wave-wizard",
    PARTICLE: "particle-zoo",
    ASTRO: "astro-knowledge",

    // BIOLOGY
    PROTEIN: "protein-synth",
    BIO_ENERGY: "bio-energy",
    MEMBRANE: "membrane-transport",
    GENETICS: "genetics-mendel",
    NEURAL: "neural-net",
    HORMONE: "hormone-control",
    IMMUNO: "immuno-defense",
    NITROGEN: "nitrogen-cycle",
    HARDY_WEINBERG: "hardy-weinberg",
    CIRCULATION: "circulation-pump",
    CELL_DIVISION: "cell-division",
    ENZYMES: "enzymes",
    ECOLOGY: "ecology",
    FEEDBACK: "feedback-loop",

    // DUTCH
    SPELLING: "spelling-algo",
    SENTENCE: "sentence-analysis",
    ARGUMENTATION: "argumentation-logic",
    TEXT_ANATOMY: "text-anatomy",
    STYLE: "style-polish",
    LITERATURE: "literature-quiz",
    VOCAB: "vocab-expert",

    // CHEMISTRY
    MOL: "mol-mastery",
    PH: "ph-precision",
    REDOX: "redox-relay",
    GREEN: "green-gauge",
    BONDING: "bonding-basics",
    ORGANIC: "organic-naming",
    EQUILIBRIUM: "equilibrium-shift",
    POLYMERS: "polymers-plus",
    ENERGY: "reaction-energy",
    SPECTRO: "spectro-scan",

    // ENGLISH
    VOCAB_EN: "vocab-elite",
    GRAMMAR_PRO: "grammar-pro",
    FORMAL_WRITER: "formal-writer",
    IRREGULAR_VERBS: "irregular-verbs",
    SENTENCE_SHIFTER: "sentence-shifter",
    TONE_TUNER: "tone-tuner",
    COLLOCATION: "collocation-king",
    LIT_HISTORY_EN: "lit-history-en",

    // FRENCH
    VOCAB_FR: "vocab-cito",
    CONJUGATION: "conjugation-algo",
    SUBJONCTIF: "subjonctif-sniper",
    FALSE_FRIENDS: "faux-friends",
    CONNECTOR: "connector-code",
    REFERENCE: "reference-relay",
    TONE_DETECTIVE: "tone-detective",
    LIT_HISTORY_FR: "lit-history",
    ESSAY_EXPERT: "essay-expert",
    PRONOUN: "pronoun-puzzle",

    // PHILOSOPHY
    ETHICS: "ethics-clash",
    ANTHRO: "anthro-identity",
    KNOWLEDGE: "knowledge-lab",
    TECH_MEDIATION: "tech-mediation",
    EXTENDED_MIND: "extended-mind",
    FALLACY: "fallacy-fighter",
    SOURCE_DECODER: "primary-text",
    EXAM_2025: "tech-exam-2025",
    EASTERN: "eastern-phil",
} as const;

export type GymId = typeof GYM_IDS[keyof typeof GYM_IDS];
