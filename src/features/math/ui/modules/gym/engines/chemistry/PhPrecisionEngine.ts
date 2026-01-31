import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (num: number, dec: number) => Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

export const PhPrecisionEngine: GymEngine = {
    id: "ph-precision",
    name: "Proton Pump",
    description: "pH, pOH en concentraties. Beheers de logaritmen van de chemie.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        switch (level) {
            case 1: {
                // [H+] -> pH (Sterk zuur)
                // Kies een mooie concentratie: bijv 0.01 of 0.003
                const exponent = rand(1, 5); // 10^-1 tot 10^-5
                const factor = rand(1, 9); // 1 tot 9
                const conc = factor * Math.pow(10, -exponent);
                const ph = -Math.log10(conc);

                return {
                    id: `ph-1-${timestamp}`,
                    question: `Bereken de **pH** van een oplossing met $[H^+] = ${factor} \\times 10^{-${exponent}}$ M.`,
                    answer: round(ph, 2).toString().replace(".", ","),
                    context: "pH = -log[H+]",
                    solutionSteps: [
                        `Gebruik de formule: $pH = -\\log[H^+]$.`,
                        `$pH = -\\log(${factor} \\times 10^{-${exponent}}) \\approx ${round(ph, 2)}$.`,
                    ],
                };
            }

            case 2: {
                // pH -> [H+]
                const ph = rand(20, 120) / 10; // pH 2.0 tot 12.0
                // Antwoord in wetenschappelijke notatie is lastig te parsen, dus we vragen gewoon decimaal of macht
                // Laten we vragen naar de concentratie.

                return {
                    id: `ph-2-${timestamp}`,
                    question: `Een oplossing heeft een **pH van ${ph}**. Wat is de $[H^+]$ concentratie?`,
                    answer: Math.pow(10, -ph).toExponential(2).replace(".", ","),
                    context: "Notatie: 1,23e-4",
                    solutionSteps: [`Gebruik de formule: $[H^+] = 10^{-pH}$.`, `$[H^+] = 10^{-${ph}}$.`],
                };
            }

            case 3: {
                // pOH en pH relatie (pH + pOH = 14)
                const poh = rand(10, 60) / 10; // pOH 1.0 - 6.0
                const ph = 14 - poh;

                return {
                    id: `ph-3-${timestamp}`,
                    question: `De **pOH** van een oplossing is **${poh}**. Wat is de **pH**?`,
                    answer: round(ph, 1).toString().replace(".", ","),
                    context: "T = 298 K (Standaardomstandigheden)",
                    solutionSteps: [
                        `Bij 298 K geldt: $pH + pOH = 14,00$.`,
                        `$pH = 14,00 - ${poh} = ${round(ph, 1)}$.`,
                    ],
                };
            }

            default:
                return PhPrecisionEngine.generate(1);
        }
    },

    validate: (input: string, problem: GymProblem) => {
        // Specifieke validatie voor wetenschappelijke notatie bij Level 2
        const clean = input.trim().replace(",", ".");
        const userVal = parseFloat(clean);
        const correctVal = parseFloat(problem.answer.replace(",", "."));

        if (Math.abs(userVal - correctVal) < correctVal * 0.1 || Math.abs(userVal - correctVal) < 0.05) {
            return { correct: true };
        }

        return {
            correct: false,
            feedback: `Niet helemaal. Het juiste antwoord was ${problem.answer}.`,
        };
    },
};
