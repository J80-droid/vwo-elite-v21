import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

import { AIGymService } from "../../../../../ai/api/AIGymService";

// Cache geheugen
const QUESTION_CACHE: Record<string, GymProblem[]> = {};
const IS_FETCHING: Record<string, boolean> = {};

// Type voor de formatter functie (bijv. Chemistry of Math cleaner)
export type ContentFormatter = (text: string) => string;

/**
 * Hulpfunctie: Maakt scheikunde mooi (H2O -> H_2O, CO2 -> CO_2)
 * Dit vangt de meeste simpele gevallen af zonder dat de AI perfecte LaTeX hoeft te spugen.
 */
export const ChemistryFormatter: ContentFormatter = (text: string) => {
    // Vervang getallen na letters door subscripts (behalve als er al LaTeX is)
    // Regex: Letter gevolgd door cijfer(s) -> Letter_Cijfer
    // Let op: We moeten oppassen dat we geen wiskunde breken, dus we doen dit voorzichtig.
    if (!text) return "";
    return text.replace(/([A-Z][a-z]?)([0-9]+)/g, "$1_{$2}") // H2 -> H_{2}
        .replace(/\+/g, "^+") // Na ladingen kijken kan complex zijn, dit is een basic fix
        .replace(/-/g, "^-");
};

export const createInfiniteEngine = (
    id: string,
    name: string,
    topic: string,
    context: string,
    staticBackup: GymProblem[],
    formatter?: ContentFormatter // <--- NIEUWE OPTIE
): GymEngine => {
    if (!QUESTION_CACHE[id]) {
        QUESTION_CACHE[id] = [...staticBackup];
    }

    return {
        id,
        name,
        description: `Oneindige ${topic} trainer (AI-powered).`,

        generate: (level: Difficulty): GymProblem | Promise<GymProblem> => {
            const queue = QUESTION_CACHE[id] || [];

            // 1. Slim bijvullen op de achtergrond
            if (queue.length < 3 && !IS_FETCHING[id]) {
                IS_FETCHING[id] = true;

                AIGymService.generateQuestions({
                    topic,
                    context,
                    count: 5,
                    difficulty: typeof level === 'number' ? level : 3
                }).then((newQuestions: GymProblem[]) => {
                    // Pas hier direct de formatter toe op de nieuwe vragen!
                    const polishedQuestions = newQuestions.map(q => ({
                        ...q,
                        question: formatter ? formatter(q.question) : q.question,
                        answer: formatter ? formatter(q.answer) : q.answer,
                        // Voeg eventueel ook formatting toe aan solutionSteps als die er zijn
                        solutionSteps: q.solutionSteps?.map(s => formatter ? formatter(s) : s)
                    }));

                    if (polishedQuestions.length > 0) {
                        if (!QUESTION_CACHE[id]) QUESTION_CACHE[id] = [];
                        QUESTION_CACHE[id]!.push(...polishedQuestions);
                    }
                    IS_FETCHING[id] = false;
                }).catch((err: unknown) => {
                    console.error("[AI-Adapter] Fetch failed", err);
                    IS_FETCHING[id] = false;
                });
            }

            // 2. Haal vraag op
            if (queue.length > 0) {
                return queue.shift()!;
            }

            // 3. Fallback
            const emergencyPick = staticBackup[Math.floor(Math.random() * staticBackup.length)]!;
            return {
                ...emergencyPick,
                id: `${id}-backup-${Date.now()}`,
                context: `${emergencyPick.context} (Offline)`
            };
        },

        validate: (input: string, problem: GymProblem) => {
            const clean = input.toLowerCase().trim();
            const correct = problem.answer.toLowerCase().trim();

            // Check 1: Exact
            if (clean === correct) return { correct: true };

            // Check 2: Zonder subscripts (als leerling "H2O" typt ipv LaTeX)
            const rawCorrect = correct.replace(/_|\{|\}|\^/g, ""); // H_{2}O -> h2o
            if (clean === rawCorrect) return { correct: true };

            // Check 3: Alternatieven
            if (problem.alternatives?.some(alt => alt.toLowerCase().replace(/_|\{|\}|\^/g, "") === clean)) {
                return { correct: true };
            }

            return { correct: false, feedback: `Antwoord: ${problem.answer}` };
        }
    };
};
