import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";
import { generateEnglishSentence } from "../../../utils/EnglishSentenceBuilder";

export const GrammarPrecisionEngine: GymEngine = {
    id: "grammar-precision",
    name: "Grammar Grind",
    description: "Tijden, if-clauses en woordvolgorde.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        // Level 3 keeps the Order logic for now (it's good for variation), 
        // Level 1 & 2 use the new Infinite Builder
        if (level === 3) {
            const sentences = [
                { q: "Always / he / late / is", a: "He is always late" },
                { q: "In Amsterdam / yesterday / I / him / saw", a: "I saw him in Amsterdam yesterday" },
                // Add more static ones or build a builder for this later
            ];
            const pick = sentences[Math.floor(Math.random() * sentences.length)]!;
            return {
                id: `gp-3-${timestamp}`,
                question: `Put in the correct order: ${pick.q}`,
                answer: pick.a,
                context: "Word Order (SPOT)",
                solutionSteps: ["Subject - Verb - Object - Place - Time"]
            };
        }

        // Use Infinite Builder for Tenses (Level 1 & 2)
        const gen = generateEnglishSentence(level);

        // Elite Upgrade: Multiple Choice for Level 1/2

        // Quick dirty distractors based on the raw verb in the question:
        const rawVerb = gen.question.match(/\[(.*?)\]/)?.[1] || "verb";
        const dists = [
            rawVerb,
            rawVerb + "s",
            rawVerb + "ed",
            "is " + rawVerb + "ing",
            "has " + rawVerb + "ed"
        ].filter(d => d !== gen.answer);

        const finalOptions = [gen.answer, ...dists].sort(() => Math.random() - 0.5).slice(0, 4);

        return {
            id: `gp-gen-${timestamp}`,
            question: gen.question.replace(`[${rawVerb}]`, "_______"),
            answer: gen.answer,
            context: gen.context,
            solutionSteps: gen.solutionSteps,
            type: "multiple-choice",
            options: finalOptions
        };
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().replace(/[.,!]/g, "");
        const isCorrect = clean.toLowerCase() === problem.answer.toLowerCase().replace(/[.,!]/g, "");
        return {
            correct: isCorrect,
            feedback: isCorrect ? "Spot on!" : `Incorrect. The answer was: ${problem.answer}`
        };
    }
};
