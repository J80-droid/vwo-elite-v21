import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)]!;

// Grote pools met variabelen voor oneindige variatie
const VARS_P = [
    "het regent", "de zon schijnt", "ik denk", "Socrates spreekt", "de bel gaat",
    "je hard werkt", "de lichten branden", "er rook is", "de kat miauwt", "de trein vertrekt"
];
const VARS_Q = [
    "worden de straten nat", "is het dag", "besta ik", "luisteren de leerlingen", "is de les voorbij",
    "slaag je voor het examen", "is er stroom", "is er vuur", "heeft hij honger", "ben ik te laat"
];

const SYLLOGISM_DATA = [
    { s: "Filosofen", p: "wijs", m: "nadenkend" },
    { s: "Vogels", p: "dieren", m: "vliegend" },
    { s: "Walvissen", p: "zoogdieren", m: "groot" },
    { s: "VWO-ers", p: "studenten", m: "hardwerkend" },
    { s: "Politici", p: "mensen", m: "feilbaar" },
    { s: "Cirkels", p: "rond", m: "vormen" },
    { s: "Atomen", p: "onzichtbaar", m: "klein" }
];

export const LogicEngine: GymEngine = {
    id: "logic-engine",
    name: "Socrates' Syllogisme",
    description: "Formele logica: Modus Ponens, Tollens en Syllogismen.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // Propositielogica (Als P dan Q)
            const P = pick(VARS_P);
            const Q = pick(VARS_Q);

            // Random scenario kiezen
            const typeIdx = rand(0, 2); // 0=Ponens, 1=Tollens, 2=Fout

            let qText = `**Stelling 1:** Als ${P} (P), dan ${Q} (Q).\n`;
            let answer = "";
            let explanation = "";

            if (typeIdx === 0) { // Modus Ponens
                qText += `**Stelling 2:** Het is zo dat ${P} (P).\n\n**Conclusie:** ?`;
                answer = Q; // Of "dan " + Q
                explanation = "Modus Ponens (P -> Q, P, dus Q) is geldig.";
            } else if (typeIdx === 1) { // Modus Tollens
                qText += `**Stelling 2:** Het is NIET zo dat ${Q} (niet Q).\n\n**Conclusie:** ?`;
                answer = `het is niet zo dat ${P}`; // Of variaties
                explanation = "Modus Tollens (P -> Q, niet Q, dus niet P) is geldig.";
            } else { // Bevestiging van de consequent (Fout)
                qText += `**Stelling 2:** Het is zo dat ${Q} (Q).\n\n**Conclusie:** ?`;
                answer = "geen conclusie";
                explanation = "Drogreden: 'Bevestiging van de consequent'. (P -> Q, Q zegt niets over P).";
            }

            // Elite Upgrade: Multiple Choice Options
            const optionsPool = new Set<string>();
            optionsPool.add(answer);

            // Distractors:
            if (typeIdx === 0) { // Ponens (Answer is Q)
                optionsPool.add(`het is niet zo dat ${Q}`); // Negation
                optionsPool.add(P); // P itself
                optionsPool.add("geen conclusie");
            } else if (typeIdx === 1) { // Tollens (Answer is niet P)
                optionsPool.add(P); // Affirmation
                optionsPool.add(Q); // Q itself
                optionsPool.add("geen conclusie");
            } else { // Fallacy (Answer is geen conclusie)
                optionsPool.add(P);
                optionsPool.add(`het is niet zo dat ${P}`);
                optionsPool.add(`het is niet zo dat ${Q}`);
            }

            const options = Array.from(optionsPool).filter(o => o !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
            options.push(answer);

            return {
                id: `logic-1-${timestamp}`,
                question: qText,
                answer: answer,
                context: typeIdx === 2 ? "Geldig of Ongeldig?" : "Wat volgt hieruit?",
                solutionSteps: [explanation, `Antwoord: ${answer}`],
                type: "multiple-choice",
                options: options.sort(() => Math.random() - 0.5)
            };
        } else {
            // Syllogismen (Alle A zijn B...)
            const data = pick(SYLLOGISM_DATA);
            // S = Subject, P = Predicaat, M = Midden
            // Vorm: Alle M zijn P. Alle S zijn M. Dus alle S zijn P.

            const answer = `alle ${data.s.toLowerCase()} zijn ${data.p}`;
            // Elite Upgrade: Multiple Choice Options
            const optionsPool = new Set<string>();
            optionsPool.add(answer);
            optionsPool.add(`alle ${data.p.toLowerCase()} zijn ${data.s.toLowerCase()}`); // Swapped
            optionsPool.add(`sommige ${data.s.toLowerCase()} zijn ${data.p.toLowerCase()}`); // Particular
            optionsPool.add(`geen ${data.s.toLowerCase()} zijn ${data.p.toLowerCase()}`); // Negative

            const options = Array.from(optionsPool).filter(o => o !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
            options.push(answer);

            return {
                id: `logic-2-${timestamp}`,
                question: `**P1:** Alle ${data.m} zijn ${data.p}.\n**P2:** Alle ${data.s} zijn ${data.m}.\n\n**Conclusie:** ?`,
                answer: answer,
                context: "Klassiek Syllogisme (Barbara)",
                solutionSteps: [
                    "Schrap de middenterm (M) die in beide premissen voorkomt.",
                    `Verbind Subject (${data.s}) met Predicaat (${data.p}).`,
                    `Antwoord: Alle ${data.s.toLowerCase()} zijn ${data.p}.`
                ],
                type: "multiple-choice",
                options: options.sort(() => Math.random() - 0.5)
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase();
        const correct = problem.answer.toLowerCase();

        // Flexibele validatie
        if (clean === correct) return { correct: true };

        // Check voor "niet" bij Tollens
        if (correct.includes("niet") && clean.includes("niet") && (clean.includes(correct.replace("het is niet zo dat ", "")) || correct.includes(clean))) {
            return { correct: true };
        }

        // Check voor "geen conclusie"
        if (correct === "geen conclusie" && (clean.includes("kan niet") || clean.includes("ongeldig") || clean.includes("niets"))) {
            return { correct: true };
        }

        // Check voor syllogisme (volgorde woorden)
        if (problem.id?.includes("logic-2")) {
            // Als de user "S zijn P" typt is het goed
            // We halen "alle" en "zijn" weg voor de check
            const cleanAns = correct.replace("alle ", "").replace(" zijn", "");
            if (clean.includes(cleanAns)) return { correct: true };
        }

        return {
            correct: false,
            feedback: `Logisch incorrect. Het juiste antwoord is: ${problem.answer}`
        };
    }
};
