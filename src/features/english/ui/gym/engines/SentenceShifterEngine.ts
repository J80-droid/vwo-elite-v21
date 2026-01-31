import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const PASSIVE_PAIRS = [
    { active: "The chef prepares the meal.", passive: "The meal is prepared by the chef." },
    { active: "They built this bridge in 1990.", passive: "This bridge was built in 1990." },
    { active: "Someone has stolen my bike.", passive: "My bike has been stolen." },
    { active: "We will solve the problem.", passive: "The problem will be solved." },
    { active: "The teacher is explaining the rules.", passive: "The rules are being explained by the teacher." }
];

const INVERSION_PAIRS = [
    { normal: "I have never seen such a mess.", inverted: "Never have I seen such a mess." },
    { normal: "She not only sings, but she also dances.", inverted: "Not only does she sing, but she also dances." },
    { normal: "I rarely go to the cinema.", inverted: "Rarely do I go to the cinema." },
    { normal: "He had hardly arrived when the phone rang.", inverted: "Hardly had he arrived when the phone rang." },
    { normal: "You should under no circumstances open this door.", inverted: "Under no circumstances should you open this door." }
];

export const SentenceShifterEngine: GymEngine = {
    id: "sentence-shifter",
    name: "Style Shifter",
    description: "Train Passieve zinnen en Inversie voor VWO-niveau schrijfvaardigheid.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        // Level 1: Active <-> Passive
        // Level 2: Inversion (Advanced)

        if (level === 1) {
            const pair = PASSIVE_PAIRS[rand(0, PASSIVE_PAIRS.length - 1)]!;
            const toPassive = Math.random() > 0.5;

            return {
                id: `ss-1-${timestamp}`,
                question: toPassive
                    ? `Rewrite in **Passive Voice**: "${pair.active}"`
                    : `Rewrite in **Active Voice**: "${pair.passive}"`,
                answer: toPassive ? pair.passive : pair.active,
                context: "Focus on the object/subject switch.",
                solutionSteps: [toPassive ? "Object wordt onderwerp + to be + voltooid deelwoord." : "Onderwerp wordt weer actief."]
            };
        } else {
            const pair = INVERSION_PAIRS[rand(0, INVERSION_PAIRS.length - 1)]!;
            // Inversion is lastig, we geven vaak de start
            const startWord = pair.inverted.split(" ")[0]!; // Never, Rarely, etc.

            return {
                id: `ss-2-${timestamp}`,
                question: `Rewrite with **Inversion** starting with **'${startWord}'**:\n\n"${pair.normal}"`,
                answer: pair.inverted,
                context: "Inversion: Adverb + Auxiliary + Subject",
                solutionSteps: [
                    `1. Start met ${startWord}.`,
                    `2. Draai onderwerp en hulpwerkwoord om (I have -> have I).`,
                    `3. Antwoord: ${pair.inverted}`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase().replace(/[.,!]/g, "");
        const correct = problem.answer.toLowerCase().replace(/[.,!]/g, "");

        if (clean === correct) return { correct: true };

        return {
            correct: false,
            feedback: `Almost. The correct sentence is: "${problem.answer}"`
        };
    }
};
