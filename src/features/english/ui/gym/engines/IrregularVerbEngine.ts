import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const VERBS = [
    { base: "to be", past: "was/were", part: "been" },
    { base: "to beat", past: "beat", part: "beaten" },
    { base: "to become", past: "became", part: "become" },
    { base: "to begin", past: "began", part: "begun" },
    { base: "to bite", past: "bit", part: "bitten" },
    { base: "to break", past: "broke", part: "broken" },
    { base: "to bring", past: "brought", part: "brought" },
    { base: "to buy", past: "bought", part: "bought" },
    { base: "to catch", past: "caught", part: "caught" },
    { base: "to choose", past: "chose", part: "chosen" },
    { base: "to come", past: "came", part: "come" },
    { base: "to do", past: "did", part: "done" },
    { base: "to drink", past: "drank", part: "drunk" },
    { base: "to drive", past: "drove", part: "driven" },
    { base: "to eat", past: "ate", part: "eaten" },
    { base: "to fall", past: "fell", part: "fallen" },
    { base: "to feel", past: "felt", part: "felt" },
    { base: "to fight", past: "fought", part: "fought" },
    { base: "to find", past: "found", part: "found" },
    { base: "to fly", past: "flew", part: "flown" },
    { base: "to forget", past: "forgot", part: "forgotten" },
    { base: "to forgive", past: "forgave", part: "forgiven" },
    { base: "to freeze", past: "froze", part: "frozen" },
    { base: "to give", past: "gave", part: "given" },
    { base: "to go", past: "went", part: "gone" },
    { base: "to grow", past: "grew", part: "grown" },
    { base: "to hang", past: "hung", part: "hung" },
    { base: "to have", past: "had", part: "had" },
    { base: "to hear", past: "heard", part: "heard" },
    { base: "to hide", past: "hid", part: "hidden" },
    { base: "to hit", past: "hit", part: "hit" },
    { base: "to hold", past: "held", part: "held" },
    { base: "to hurt", past: "hurt", part: "hurt" },
    { base: "to keep", past: "kept", part: "kept" },
    { base: "to know", past: "knew", part: "known" },
];

export const IrregularVerbEngine: GymEngine = {
    id: "irregular-verbs",
    name: "Verb Vibe",
    description: "Stamp de onregelmatige werkwoorden.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();
        const v = VERBS[rand(0, VERBS.length - 1)]!;

        // Level 1: Past Simple
        // Level 2: Past Participle
        // Level 3: Random Mix

        const type = level === 1 ? "past" : (level === 2 ? "part" : (Math.random() > 0.5 ? "past" : "part"));

        return {
            id: `iv-${timestamp}`,
            question: type === "past"
                ? `What is the **Past Simple** of: **${v.base}**?`
                : `What is the **Past Participle** of: **${v.base}**?`,
            answer: type === "past" ? v.past : v.part,
            context: type === "past" ? "I ... yesterday" : "I have ...",
            solutionSteps: [`Rijtje: ${v.base} - ${v.past} - ${v.part}`]
        };
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase();
        // Handle "was/were" case
        if (problem.answer.includes("/")) {
            const parts = problem.answer.split("/");
            if (parts.some(p => p.trim().toLowerCase() === clean)) return { correct: true };
        }

        const isCorrect = clean === problem.answer.toLowerCase();
        return {
            correct: isCorrect,
            feedback: isCorrect ? "Correct!" : `The answer is: ${problem.answer}`
        };
    }
};
