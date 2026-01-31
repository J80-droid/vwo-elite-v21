import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const OBJECTS = [
    { word: "le projet", gender: "m", number: "s" },
    { word: "la maison", gender: "f", number: "s" },
    { word: "les amis", gender: "m", number: "p" },
    { word: "les raisons", gender: "f", number: "p" },
    { word: "le chien", gender: "m", number: "s" },
    { word: "la table", gender: "f", number: "s" }
];

const PREPOSITIONS = [
    { word: "avec", type: "normal" },
    { word: "pour", type: "normal" },
    { word: "sur", type: "normal" },
    { word: "à", type: "contract" },
    { word: "de", type: "contract" },
];

export const PronounPuzzleEngine: GymEngine = {
    id: "pronoun-puzzle",
    name: "Pronoun Puzzle",
    description: "Lequel, Auquel, Duquel of Dont? Los de puzzel op.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();
        const obj = OBJECTS[rand(0, OBJECTS.length - 1)]!;

        let prep;
        if (level === 1) {
            const normals = PREPOSITIONS.filter(p => p.type === "normal");
            prep = normals[rand(0, normals.length - 1)]!;
        } else {
            const contracts = PREPOSITIONS.filter(p => p.type === "contract");
            prep = contracts[rand(0, contracts.length - 1)]!;
        }

        let answer = "";
        let explanation = "";
        let base = "";
        if (obj.gender === "m" && obj.number === "s") base = "lequel";
        if (obj.gender === "f" && obj.number === "s") base = "laquelle";
        if (obj.gender === "m" && obj.number === "p") base = "lesquels";
        if (obj.gender === "f" && obj.number === "p") base = "lesquelles";

        if (prep.word === "à") {
            if (base === "lequel") answer = "auquel";
            else if (base === "lesquels") answer = "auxquels";
            else if (base === "lesquelles") answer = "auxquelles";
            else answer = "à laquelle";
            explanation = "Samentrekking van à + lequel/lesquels/lesquelles.";
        }
        else if (prep.word === "de") {
            if (base === "lequel") answer = "duquel";
            else if (base === "lesquels") answer = "desquels";
            else if (base === "lesquelles") answer = "desquelles";
            else answer = "de laquelle";
            explanation = "Samentrekking van de + lequel.";
        }

        else {
            answer = `${prep.word} ${base}`;
            explanation = `Gewoon voorzetsel + vorm van ${base} (past bij ${obj.word}).`;
        }

        // Elite Upgrade: Multiple Choice Options
        const optionsPool = new Set<string>();
        optionsPool.add(answer);

        // Add basic forms as distractors (Lequel/Laquelle/Lesquels/Lesquelles)
        // This covers "Wrong Gender/Number" errors
        optionsPool.add("lequel");
        optionsPool.add("laquelle");
        optionsPool.add("lesquels");
        optionsPool.add("lesquelles");

        // Add contraction distractors 
        // If answer is "auquel", add "à lequel" (common mistake) or "duquel" (wrong prep)
        if (prep.word === "à") {
            optionsPool.add("à lequel"); // Common mistake
            optionsPool.add("auquelle"); // Spelling mistake
            optionsPool.add("duquel");   // Wrong prep
        } else if (prep.word === "de") {
            optionsPool.add("de lequel"); // Common mistake
            optionsPool.add("duquelle");  // Spelling mistake
            optionsPool.add("auquel");    // Wrong prep
        } else {
            // Normal prep
            optionsPool.add(`${prep.word} lequel`);
            optionsPool.add(`${prep.word} laquelle`);
        }

        // Shuffle and Slice
        const options = Array.from(optionsPool).filter(o => o !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
        options.push(answer);


        return {
            id: `fr-pronoun-${timestamp}`,
            question: `Vul in: **${obj.word}** ... (voorzetsel: **${prep.word}**) ... je parle.`,
            answer: answer,
            context: `${obj.word} is ${obj.gender === 'm' ? 'mannelijk' : 'vrouwelijk'} ${obj.number === 's' ? 'enkelvoud' : 'meervoud'}.`,
            solutionSteps: [
                `1. Antecedent: ${obj.word} (${obj.gender}, ${obj.number}).`,
                `2. Voorzetsel: ${prep.word}.`,
                `3. Combinatie: ${answer}.`,
                explanation
            ],
            type: "multiple-choice",
            options: options.sort(() => Math.random() - 0.5)
        };
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase();
        const correct = problem.answer.toLowerCase();
        if (clean === correct) return { correct: true };
        return { correct: false, feedback: `Fout. Het juiste antwoord is: ${problem.answer}` };
    }
};
