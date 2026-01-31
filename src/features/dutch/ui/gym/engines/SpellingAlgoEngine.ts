import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Type voor werkwoord data
type VerbData = {
    stem: string;      // hele werkwoord
    root: string;      // ik-vorm (stam)
    strong?: { past: string, part: string }; // Alleen invullen als het sterk is
    kofschip: boolean; // Alleen relevant voor zwakke werkwoorden
};

const VERBS: VerbData[] = [
    // Zwak
    { stem: "werken", root: "werk", kofschip: true },
    { stem: "branden", root: "brand", kofschip: false }, // d-stam
    { stem: "praten", root: "praat", kofschip: true },   // t-stam
    { stem: "verhuizen", root: "verhuis", kofschip: true },
    { stem: "leven", root: "leef", kofschip: false },    // v -> f
    { stem: "worden", root: "word", kofschip: false },
    { stem: "gebeuren", root: "gebeur", kofschip: false },
    { stem: "antwoorden", root: "antwoord", kofschip: false },
    // Sterk
    { stem: "lopen", root: "loop", kofschip: true, strong: { past: "liep", part: "gelopen" } },
    { stem: "vinden", root: "vind", kofschip: false, strong: { past: "vond", part: "gevonden" } },
    { stem: "rijden", root: "rijd", kofschip: false, strong: { past: "reed", part: "gereden" } },
    { stem: "kiezen", root: "kies", kofschip: true, strong: { past: "koos", part: "gekozen" } }
];

const SUBJECTS = ["Ik", "Jij", "Hij", "Wij", "De man", "Het meisje"];

export const SpellingAlgoEngine: GymEngine = {
    id: "spelling-algo",
    name: "Spelling Specialist",
    description: "DT-regels, sterke werkwoorden en voltooid deelwoorden. Algoritmisch gegenereerd.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();
        const verb = VERBS[rand(0, VERBS.length - 1)]!;
        const subject = SUBJECTS[rand(0, SUBJECTS.length - 1)]!;

        let mode = 0;
        if (level === 2) mode = rand(0, 1);
        if (level === 3) mode = rand(0, 2);

        let question = "";
        let answer = "";
        let context = "";
        const steps: string[] = [];

        // --- OTT (Tegenwoordige Tijd) ---
        if (mode === 0) {
            context = "Tegenwoordige tijd (nu)";
            const isInversion = Math.random() > 0.8 && subject === "Jij"; // "Loop jij?"

            if (isInversion) {
                question = `... ${subject.toLowerCase()} (vandaag) naar huis? (${verb.stem})`;
                answer = verb.root;
                steps.push("Bij vraagzin met 'jij' erachter: alleen de stam.");
            } else {
                question = `${subject} ... (vandaag) naar huis. (${verb.stem})`;
                if (subject === "Ik") {
                    answer = verb.root;
                    steps.push("Bij 'ik': alleen de stam.");
                } else if (subject === "Wij") {
                    answer = verb.stem;
                    steps.push("Bij meervoud: hele werkwoord.");
                } else {
                    // Check if root already ends in 't' (e.g. praten -> praat -> hij praat)
                    const suffix = verb.root.endsWith("t") ? "" : "t";
                    answer = verb.root + suffix;
                    steps.push("Bij hij/zij/jij (niet inversie): stam + t.");
                }
            }
        }

        // --- OVT (Verleden Tijd) ---
        else if (mode === 1) {
            context = "Verleden tijd (gisteren)";
            question = `${subject} ... (gisteren) naar huis. (${verb.stem})`;
            const isPlural = subject === "Wij";

            if (verb.strong) {
                answer = isPlural ? verb.strong.past + "en" : verb.strong.past;
                if (isPlural && verb.strong.past.endsWith("en")) answer = verb.strong.past;
                steps.push("Dit is een sterk werkwoord (klankverandering).");
            } else {
                const suffix = verb.kofschip ? "te" : "de";
                const ending = isPlural ? suffix + "n" : suffix;
                answer = verb.root + ending;
                steps.push(`Stam is '${verb.root}'.`);
                steps.push(verb.kofschip ? "Kofschip-regel: stam + te(n)" : "Kofschip-regel: stam + de(n)");
            }
        }

        // --- VD (Voltooid Deelwoord) ---
        else {
            context = "Voltooid deelwoord";
            question = `${subject} heeft gisteren ... (${verb.stem})`;

            if (verb.strong) {
                answer = verb.strong.part;
                steps.push("Sterk werkwoord: eindigt meestal op -en.");
            } else {
                const prefix = verb.root.startsWith("ver") || verb.root.startsWith("ge") || verb.root.startsWith("be") ? "" : "ge";
                const suffix = verb.kofschip ? "t" : "d";
                answer = prefix + verb.root + suffix;
                steps.push(verb.kofschip ? "Kofschip: eindigt op t" : "Kofschip: eindigt op d");
            }
        }

        // Elite Upgrade: Multiple Choice Options
        const optionsPool = new Set<string>();
        optionsPool.add(answer);

        // Add standard forms as distractors
        optionsPool.add(verb.root);
        optionsPool.add(verb.root + "t");
        optionsPool.add(verb.root + "en");

        // Add specific tense distractors
        if (mode === 0) { // OTT
            optionsPool.add(verb.root + "dt"); // Fake dt
            optionsPool.add(verb.root + "d");
        } else if (mode === 1) { // OVT
            optionsPool.add(verb.root + "te");
            optionsPool.add(verb.root + "de");
            optionsPool.add(verb.root + "ten");
            optionsPool.add(verb.root + "den");
            if (verb.strong) {
                optionsPool.add(verb.strong.past);
                // Fake weak form for strong verb
                const weakSuffix = verb.kofschip ? "te" : "de";
                optionsPool.add(verb.root + weakSuffix);
            }
        } else { // VD
            const prefix = verb.root.startsWith("ver") || verb.root.startsWith("ge") || verb.root.startsWith("be") ? "" : "ge";
            optionsPool.add(prefix + verb.root + "t");
            optionsPool.add(prefix + verb.root + "d");
            if (verb.strong) optionsPool.add(verb.strong.part);
        }

        // Shuffle and Slice
        const options = Array.from(optionsPool).filter(o => o !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
        options.push(answer);

        return {
            id: `spell-algo-${timestamp}`,
            question,
            answer,
            context,
            solutionSteps: steps,
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
            feedback: `Helaas. Het juiste antwoord is: ${problem.answer}`
        };
    }
};
