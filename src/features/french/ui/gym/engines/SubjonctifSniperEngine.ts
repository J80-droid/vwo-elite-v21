import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const TRIGGERS_SUBJONCTIF = [
    { phrase: "Il faut que", reason: "Noodzaak" },
    { phrase: "Bien que", reason: "Tegenstelling (Hoewel)" },
    { phrase: "Pour que", reason: "Doel (Opdat)" },
    { phrase: "Je veux que", reason: "Wil/Wens" },
    { phrase: "Il est possible que", reason: "Mogelijkheid/Twijfel" },
    { phrase: "J'ai peur que", reason: "Gevoel/Emotie" },
    { phrase: "Avant que", reason: "Tijd (Voordat)" },
    { phrase: "Sans que", reason: "Zonder dat" },
    { phrase: "À condition que", reason: "Voorwaarde" }
];

const TRIGGERS_INDICATIF = [
    { phrase: "Je pense que", reason: "Mening (positief/neutraal)" },
    { phrase: "J'espère que", reason: "Uitzondering (Hoop = Indicatif)" },
    { phrase: "Il est certain que", reason: "Zekerheid" },
    { phrase: "Je vois que", reason: "Waarneming" },
    { phrase: "Il est clair que", reason: "Feit/Zekerheid" },
    { phrase: "Pendant que", reason: "Tijd (Terwijl)" },
    { phrase: "Parce que", reason: "Reden" }
];

export const SubjonctifSniperEngine: GymEngine = {
    id: "subjonctif-sniper",
    name: "Subjonctif Sniper",
    description: "Indicatif of Subjonctif? Kies de juiste modus.",

    generate: (_level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        const needSubj = Math.random() > 0.5;
        const list = needSubj ? TRIGGERS_SUBJONCTIF : TRIGGERS_INDICATIF;
        const pick = list[rand(0, list.length - 1)]!;

        return {
            id: `fr-subj-${timestamp}`,
            question: `Welke modus volgt na: **"${pick.phrase} ..."**?`,
            answer: needSubj ? "subjonctif" : "indicatif",
            context: "Twijfel/Wens vs Feit/Zekerheid",
            solutionSteps: [
                `"${pick.phrase}" drukt **${pick.reason.toLowerCase()}** uit.`,
                needSubj
                    ? "Hierna volgt dus altijd de **Subjonctif**."
                    : "Dit is een feit of zekerheid (of 'espérer'), dus **Indicatif**."
            ]
        };
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase();
        const isSubj = clean === "subjonctif" || clean === "sub" || clean === "s";
        const isInd = clean === "indicatif" || clean === "ind" || clean === "i";

        const correctIsSubj = problem.answer === "subjonctif";

        if ((correctIsSubj && isSubj) || (!correctIsSubj && isInd)) {
            return { correct: true };
        }

        return {
            correct: false,
            feedback: `Fout. Na '${problem.question.split('"')[1]}' komt de ${problem.answer}.`
        };
    }
};
