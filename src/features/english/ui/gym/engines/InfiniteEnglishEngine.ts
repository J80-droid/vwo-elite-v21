import { createInfiniteEngine } from "../../../../math/ui/modules/gym/engines/AIGymAdapter";

const ENGLISH_BACKUP = [
    {
        id: "en-start-1",
        question: "Which of the following is a synonym for **'ambiguous'**?",
        answer: "unclear",
        context: "Vocabulary",
        alternatives: ["vague", "obscure"]
    },
    {
        id: "en-start-2",
        question: "Fill in the correct tense: 'By the time she arrived, he _____ (leave).'",
        answer: "had left",
        context: "Grammar - Past Perfect"
    }
];

export const InfiniteEnglishEngine = createInfiniteEngine(
    "infinite-english",
    "Oxford AI",
    "Engels VWO",
    "Focus op: Academic Vocabulary (C1/C2), Advanced Grammar (Inversion, Conditionals), Tekstbegrip en Signaalwoorden.",
    ENGLISH_BACKUP
);
