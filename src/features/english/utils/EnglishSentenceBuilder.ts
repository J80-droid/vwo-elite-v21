
import { Difficulty } from "@shared/types/gym";

const SUBJECTS = ["The man", "A woman", "The teacher", "My friend", "The dog", "Our team"];
const VERBS = [
    { inf: "walk", past: "walked", pp: "walked", pres: "walks" },
    { inf: "eat", past: "ate", pp: "eaten", pres: "eats" },
    { inf: "see", past: "saw", pp: "seen", pres: "sees" },
    { inf: "buy", past: "bought", pp: "bought", pres: "buys" },
    { inf: "write", past: "wrote", pp: "written", pres: "writes" }
];
const OBJECTS = ["an apple", "the car", "a letter", "the house", "a movie"];
const TIMES = ["yesterday", "tomorrow", "now", "every day", "last week"];

export const generateEnglishSentence = (_diff: Difficulty) => {
    const sub = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]!;
    const verb = VERBS[Math.floor(Math.random() * VERBS.length)]!;
    const obj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)]!;
    const time = TIMES[Math.floor(Math.random() * TIMES.length)]!;

    // Tense Logic
    // 0 = Simple Past, 1 = Present Continuous, 2 = Present Simple
    const tenseMode = Math.floor(Math.random() * 3);

    let text = "";
    let answer = "";
    let context = "";

    if (tenseMode === 0) {
        text = `${sub} [${verb.inf}] ${obj} ${time}.`;
        answer = verb.past;
        context = "Simple Past";
        // Fix time for past
        if (time === "tomorrow" || time === "now") text = text.replace(time, "yesterday");
    } else if (tenseMode === 1) {
        // Present Continuous (is/are ...ing)
        text = `${sub} [${verb.inf}] ${obj} right now.`;
        answer = `is ${verb.inf}ing`.replace("eing", "ing"); // Quick hack for 'write' -> 'writing'
        if (verb.inf === "run") answer = "is running";
        context = "Present Continuous";
    } else {
        text = `${sub} usually [${verb.inf}] ${obj}.`;
        answer = verb.pres;
        context = "Present Simple";
    }

    return {
        question: `Fill in the correct form:\n\n"${text}"`,
        answer,
        context,
        solutionSteps: [`Tense signal: ${context}`, `Correct form: **${answer}**.`]
    };
};
