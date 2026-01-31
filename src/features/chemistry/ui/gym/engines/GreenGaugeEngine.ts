import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const GreenGaugeEngine: GymEngine = {
    id: "green-gauge",
    name: "Green Gauge",
    description: "Rendement en Atoomeconomie. Hoe groen is jouw proces?",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // Level 1: Rendement (Praktisch / Theoretisch)
            const theoretisch = rand(50, 200);
            const verlies = rand(5, 40);
            const praktisch = theoretisch - verlies;
            const rendement = (praktisch / theoretisch) * 100;

            return {
                id: `gg-1-${timestamp}`,
                question: `Bij een synthese verwacht je theoretisch **${theoretisch} g** product. In de praktijk weeg je slechts **${praktisch} g** af.\n\nBereken het **rendement** (in %).`,
                answer: rendement.toFixed(1).replace(".", ","),
                context: "Rond af op 1 decimaal",
                solutionSteps: [
                    "Rendement = (Praktische opbrengst / Theoretische opbrengst) x 100%",
                    `(${praktisch} / ${theoretisch}) x 100% = ${rendement.toFixed(1)}%`
                ]
            };
        } else {
            // Level 2: Atoomeconomie (Mw Product / Mw Beginstoffen)
            const scenario = Math.random() > 0.5 ? "additie" : "substitutie";

            let mwProduct, mwAfval;

            if (scenario === "additie") {
                mwProduct = 100;
                mwAfval = 0;
            } else {
                mwProduct = rand(60, 150);
                mwAfval = rand(18, 44); // H2O of CO2
            }

            const mwTotaal = mwProduct + mwAfval;
            const atomEconomy = (mwProduct / mwTotaal) * 100;

            const qText = scenario === "additie"
                ? "Bij een **additiereactie** worden twee stoffen samengevoegd tot één product. Wat is de atoomeconomie?"
                : `Bij een reactie is de massa van het gewenste product **${mwProduct} u** en de massa van het bijproduct (afval) **${mwAfval} u**.\n\nBereken de **atoomeconomie** (in %).`;

            return {
                id: `gg-2-${timestamp}`,
                question: qText,
                answer: atomEconomy.toFixed(1).replace(".", ","),
                context: "Massabalans",
                solutionSteps: [
                    "Atoomeconomie = (Massa gewenst product / Totale massa beginstoffen) x 100%",
                    `Totale massa = ${mwProduct} + ${mwAfval} = ${mwTotaal}`,
                    `(${mwProduct} / ${mwTotaal}) x 100% = ${atomEconomy.toFixed(1)}%`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const val = parseFloat(input.replace(',', '.').replace('%', ''));
        const ans = parseFloat(problem.answer.replace(',', '.'));
        // Marge van 0.5%
        const isCorrect = !isNaN(val) && Math.abs(val - ans) < 0.5;
        return {
            correct: isCorrect,
            feedback: isCorrect ? "Duurzaam berekend!" : `Helaas. Het was: ${problem.answer}%`
        };
    }
};
