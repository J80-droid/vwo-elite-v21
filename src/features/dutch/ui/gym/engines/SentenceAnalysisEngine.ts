import { generateDutchSentence } from "../../../utils/SentenceBuilder";
import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

export const SentenceAnalysisEngine: GymEngine = {
    id: "sentence-analysis",
    name: "Zinsontleder",
    description: "Vind de Persoonsvorm en het Onderwerp. Oneindig geoefend.",

    generate: (difficulty: Difficulty): GymProblem => {
        const timestamp = Date.now();
        const gen = generateDutchSentence(difficulty);

        // Ensure robust checking by lowercasing answer in validation, 
        // but preserve original casing in display if needed.

        if (difficulty === 1) {
            return {
                id: `sa-1-${timestamp}`,
                question: `Wat is de **persoonsvorm** in de zin?\n\n"${gen.text}"`,
                answer: gen.pv,
                context: "Tip: Verander de zin van tijd.",
                solutionSteps: [
                    `1. De zin staat in de ${gen.text.includes(gen.pv) ? "tijd" : "..."}.`,
                    `2. Als je de zin van tijd verandert, verandert het werkwoord '${gen.pv}'.`,
                    `3. Dus de persoonsvorm is: **${gen.pv}**.`
                ]
            };
        } else {
            return {
                id: `sa-2-${timestamp}`,
                question: `Wat is het **onderwerp** in de zin?\n\n"${gen.text}"`,
                answer: gen.ond,
                context: "Wie/Wat + Persoonsvorm?",
                solutionSteps: [
                    `1. De persoonsvorm is '${gen.pv}'.`,
                    `2. Vraag: Wie/Wat ${gen.pv}?`,
                    `3. Antwoord: **${gen.ond}**.`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase();
        const correct = problem.answer.toLowerCase();

        // Handle "De man" vs "de man"
        if (clean === correct) return { correct: true };

        // Handle partials if user types "man" instead of "De man" (optional, purely lenient)
        if (correct.endsWith(clean) && clean.length > 3) return { correct: true, feedback: `Goed, maar schrijf het volledig: ${problem.answer}` };

        return {
            correct: false,
            feedback: `Helaas. Het antwoord was: "${problem.answer}"`
        };
    }
};
