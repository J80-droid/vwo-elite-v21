import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const FeedbackLoopEngine: GymEngine = {
    id: "feedback-loop",
    name: "Regelkring Regisseur",
    description: "Beheers de negatieve terugkoppeling en homeostase.",

    generate: (_level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        const scenarios = [
            {
                id: "bloedsuiker",
                question: "De bloedsuikerspiegel STIJT. Welk hormoon wordt afgegeven door de eilandjes van Langerhans om dit te corrigeren?",
                answer: "insuline",
                context: "Homeostase",
                acceptedAnswers: ["insulin"]
            },
            {
                id: "temperatuur",
                question: "Lichaamstemperatuur DAALT. Welk proces in de huid helpt om warmteverlies te beperken?",
                answer: "vasoconstrictie",
                context: "Thermo-regulatie",
                acceptedAnswers: ["vaatvernauwing", "vernauwen bloedvaten"]
            },
            {
                id: "tsh",
                question: "De concentratie schildklierhormoon (T4) is zeer HOOG. Wat gebeurt er met de afgifte van TSH door de hypofyse?",
                answer: "lager",
                context: "Hormonale as",
                acceptedAnswers: ["minder", "neemt af", "daalt"]
            }
        ];

        const scene = scenarios[rand(0, scenarios.length - 1)]!;

        return {
            id: `fb-${scene.id}-${timestamp}`,
            question: scene.question,
            answer: scene.answer,
            context: scene.context,
            acceptedAnswers: scene.acceptedAnswers,
            solutionSteps: ["Stijging -> Negatieve terugkoppeling -> Remming / Tegenovergesteld effect."]
        };
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().toLowerCase();
        if (clean === problem.answer.toLowerCase() || problem.acceptedAnswers?.includes(clean)) {
            return { correct: true };
        }
        return { correct: false, feedback: `Helaas. Het juiste antwoord was: ${problem.answer}` };
    }
};
