import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";
import { generateFrenchConjugation } from "../../../utils/FrenchSentenceBuilder";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

type Verb = {
    inf: string;
    dutch: string;
    pres: string[]; // Je, Tu, Il, Nous, Vous, Ils
    pc: string;     // Participe Passé
    aux: "avoir" | "être";
    fut: string[];
    imp: string[];
};

const VERBS: Verb[] = [
    {
        inf: "avoir", dutch: "hebben", aux: "avoir", pc: "eu",
        pres: ["ai", "as", "a", "avons", "avez", "ont"],
        fut: ["aurai", "auras", "aura", "aurons", "aurez", "auront"],
        imp: ["avais", "avais", "avait", "avions", "aviez", "avaient"]
    },
    {
        inf: "être", dutch: "zijn", aux: "avoir", pc: "été",
        pres: ["suis", "es", "est", "sommes", "êtes", "sont"],
        fut: ["serai", "seras", "sera", "serons", "serez", "seront"],
        imp: ["étais", "étais", "était", "étions", "étiez", "étaient"]
    },
    {
        inf: "aller", dutch: "gaan", aux: "être", pc: "allé",
        pres: ["vais", "vas", "va", "allons", "allez", "vont"],
        fut: ["irai", "iras", "ira", "irons", "irez", "iront"],
        imp: ["allais", "allais", "allait", "allions", "alliez", "allaient"]
    },
    {
        inf: "faire", dutch: "doen/maken", aux: "avoir", pc: "fait",
        pres: ["fais", "fais", "fait", "faisons", "faites", "font"],
        fut: ["ferai", "feras", "fera", "ferons", "ferez", "feront"],
        imp: ["faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient"]
    },
    {
        inf: "pouvoir", dutch: "kunnen", aux: "avoir", pc: "pu",
        pres: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
        fut: ["pourrai", "pourras", "pourra", "pourrons", "pourrez", "pourront"],
        imp: ["pouvais", "pouvais", "pouvait", "pouvions", "pouviez", "pouvaient"]
    }
];

const PERSONS = ["Je/J'", "Tu", "Il/Elle", "Nous", "Vous", "Ils/Elles"];

export const ConjugationAlgoEngine: GymEngine = {
    id: "conjugation-algo",
    name: "Verbe Vitesse",
    description: "Drill de onregelmatige werkwoorden (Avoir, Être, Aller, Faire...).",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        // Use the new Infinite Gen for Level 1 (Regular ER verbs & heavy variety)
        // Keep Level 2+ for the specific Irregulars (Avoir/Etre/Aller) which are hardcoded for correctness

        if (level === 1) {
            const gen = generateFrenchConjugation(level);
            return {
                id: `fr-gen-${timestamp}`,
                question: gen.question,
                answer: gen.answer,
                context: gen.context,
                solutionSteps: gen.solutionSteps
            };
        }

        // Level 2+ : Deep drilling of irregulars (Classic Logic)
        const verb = VERBS[rand(0, VERBS.length - 1)]!;
        const pIndex = rand(0, 5);
        const person = PERSONS[pIndex]!;
        let tense = "présent";
        let answer = "";
        let hint = "";

        if (level === 2) {
            tense = "Passé Composé";
            const auxVerb = VERBS.find(v => v.inf === verb.aux)!;
            const auxForm = auxVerb.pres[pIndex]!;
            answer = `${auxForm} ${verb.pc}`;
            hint = `Hulpwerkwoord: ${verb.aux}`;

            if (verb.aux === "être" && (pIndex === 2 || pIndex === 5)) {
                hint += " (Let op: mannelijk)";
            }
        } else {
            if (Math.random() > 0.5) {
                tense = "Futur Simple";
                answer = verb.fut[pIndex]!;
            } else {
                tense = "Imparfait";
                answer = verb.imp[pIndex]!;
            }
        }

        let displayPerson = person;
        if (person === "Je/J'") {
            displayPerson = ["a", "e", "i", "o", "u", "y"].includes(answer[0]!) ? "J'" : "Je";
        }
        if (person === "Il/Elle") displayPerson = "Il";
        if (person === "Ils/Elles") displayPerson = "Ils";

        // Elite Upgrade: Multiple Choice Options
        // We use the same verb but wrong persons or tenses as distractors
        const optionsPool = new Set<string>();
        optionsPool.add(answer);

        // Distractor Strategy:
        // 1. Same Tense, Wrong Person
        // 2. Same Person, Wrong Tense
        // 3. Common mistakes (Infinitive)

        if (level === 2) {
            // Passé Composé Distractors
            const auxVerb = VERBS.find(v => v.inf === verb.aux)!;
            // Wrong Aux Person
            optionsPool.add(`${auxVerb.pres[(pIndex + 1) % 6]} ${verb.pc}`);
            optionsPool.add(`${auxVerb.pres[(pIndex + 2) % 6]} ${verb.pc}`);
            // Wrong Aux Verb (e.g. have vs be)
            const wrongAux = verb.aux === "avoir" ? "suis" : "ai"; // Simplistic
            optionsPool.add(`${wrongAux} ${verb.pc}`);
            // Just participle
            optionsPool.add(verb.pc);
        } else {
            // Futur/Imparfait Distractors
            const wrongTenseArray = tense === "Futur Simple" ? verb.imp : verb.fut;
            const sameTenseArray = tense === "Futur Simple" ? verb.fut : verb.imp;

            // Same Person, Wrong Tense
            optionsPool.add(wrongTenseArray[pIndex]!);

            // Same Tense, Wrong Person
            optionsPool.add(sameTenseArray[(pIndex + 1) % 6]!);
            optionsPool.add(sameTenseArray[(pIndex + 2) % 6]!);
            optionsPool.add(sameTenseArray[(pIndex + 3) % 6]!);

            // Présent (often confused)
            optionsPool.add(verb.pres[pIndex]!);
        }

        // Shuffle and Slice
        const options = Array.from(optionsPool).filter(o => o !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
        options.push(answer);

        return {
            id: `fr-conj-${timestamp}`,
            question: `Vervoeg in de **${tense}**:\n\n${displayPerson} ... (**${verb.inf}**)`,
            answer: answer,
            context: `Vertaling: ${verb.dutch}${hint ? ` | ${hint}` : ""}`,
            solutionSteps: [
                `Werkwoord: ${verb.inf}`,
                `Tijd: ${tense}`,
                `Persoon: ${displayPerson}`,
                `Antwoord: ${answer}`,
                ...(hint ? [hint] : [])
            ],
            type: "multiple-choice",
            options: options.sort(() => Math.random() - 0.5)
        };
    },


    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase();
        const correct = problem.answer.toLowerCase();

        if (clean === correct) return { correct: true };

        return {
            correct: false,
            feedback: `Fout. Het juiste antwoord is: ${problem.answer}`
        };
    }
};
