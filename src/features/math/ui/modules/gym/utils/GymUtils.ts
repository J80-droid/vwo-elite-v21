export const GYM_CONSTANTS = {
    // Leitner Systeem Configuratie
    MAX_BOX_LEVEL: 5,
    MIN_BOX_LEVEL: 1,

    // Dagen tot volgende review per box (Index 0 is ongebruikt/placeholder)
    // Box 1: 1 dag, Box 2: 3 dagen, Box 3: 7 dagen, Box 4: 14 dagen, Box 5: 30 dagen
    BOX_INTERVALS: [0, 1, 3, 7, 14, 30],

    // UI & Progressie
    MASTERY_STEP: 25, // % per level

    // Scoring (voor Monthly Trend & Analytics)
    GRADE_CORRECT: 10.0,
    GRADE_INCORRECT: 4.0,

    // Benchmark Standards (voor EliteGymAnalytics)
    ELITE_ACCURACY: 92,
    ELITE_TIME_SEC: 45,
    ELITE_MASTERY: 95
};

export const GymUtils = {
    /**
     * Berekent het mastery percentage (0-100%) op basis van het box level.
     * Level 1 = 0%, Level 5 = 100%.
     */
    calculateMastery: (boxLevel: number): number => {
        const effectiveLevel = Math.max(GYM_CONSTANTS.MIN_BOX_LEVEL, boxLevel);
        // Zorg dat we nooit boven de 100% uitkomen, zelfs als boxLevel > 5 (toekomstvast)
        return Math.min(100, (effectiveLevel - 1) * GYM_CONSTANTS.MASTERY_STEP);
    },

    /**
     * Bepaalt de moeilijkheidsgraad van een engine.
     * Voor 'Mix' engines is dit het gemiddelde van alle actieve levels.
     */
    getDifficulty: (levels: Record<string, number> | undefined, engineId: string): number => {
        if (!levels) return 1;

        // Speciale logica voor Mix-oefeningen (gemiddelde van de gebruiker)
        if (engineId.startsWith("mix-")) {
            const values = Object.values(levels);
            if (values.length === 0) return 1;
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            return Math.round(avg) || 1;
        }

        // Standaard logica
        return levels[engineId] || 1;
    },

    /**
     * Helper om te checken of een module 'mastered' is (Elite status).
     */
    isElite: (boxLevel: number): boolean => {
        return boxLevel >= GYM_CONSTANTS.MAX_BOX_LEVEL;
    },

    /**
     * Helper om next_review timestamp te berekenen voor een level.
     */
    calculateNextReview: (boxLevel: number): number => {
        // Fallback naar 1 dag als level buiten bereik is
        const days = GYM_CONSTANTS.BOX_INTERVALS[boxLevel] || 1;
        return Date.now() + (days * 24 * 60 * 60 * 1000);
    }
};
