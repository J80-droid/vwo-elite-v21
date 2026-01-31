import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (num: number, dec: number) => Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

export const PhPrecisionEngine: GymEngine = {
    id: "ph-precision",
    name: "Proton Pump",
    description: "pH, pOH en concentraties. Beheers de logaritmen van de chemie.",

    generate: (level: Difficulty): GymProblem | Promise<GymProblem> => {
        const timestamp = Date.now();
        const genLevel = level || (rand(1, 4) as Difficulty);

        switch (genLevel) {
            case 1: {
                // [H+] -> pH (Sterk zuur)
                // Kies een mooie concentratie: bijv 0.01 of 0.003
                const exponent = rand(1, 5); // 10^-1 tot 10^-5
                const factor = rand(1, 9); // 1 tot 9
                const conc = factor * Math.pow(10, -exponent);
                const ph = -Math.log10(conc);

                // Elite Upgrade: Multiple Choice Options
                const optionsPool = new Set<string>();
                optionsPool.add(round(ph, 2).toString().replace(".", ","));
                optionsPool.add(round(ph + 1, 2).toString().replace(".", ","));
                optionsPool.add(round(14 - ph, 2).toString().replace(".", ",")); // pOH distractor
                optionsPool.add(round(ph - 1, 2).toString().replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `ph-1-${timestamp}`,
                    question: `Bereken de **pH** van een oplossing met $[H^+] = ${factor} \\times 10^{-${exponent}}$ M.`,
                    answer: round(ph, 2).toString().replace(".", ","),
                    context: "pH = -log[H+]",
                    solutionSteps: [
                        `Gebruik de formule: $pH = -\\log[H^+]$.`,
                        `$pH = -\\log(${factor} \\times 10^{-${exponent}}) \\approx ${round(ph, 2)}$.`,
                    ],
                    type: "multiple-choice",
                    options
                };
            }

            case 2: {
                // pH -> [H+]
                const ph = rand(20, 120) / 10; // pH 2.0 tot 12.0
                // Antwoord in wetenschappelijke notatie is lastig te parsen, dus we vragen gewoon decimaal of macht
                // Laten we vragen naar de concentratie.

                // Elite Upgrade: Multiple Choice Options
                const ans = Math.pow(10, -ph).toExponential(2).replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(Math.pow(10, -(14 - ph)).toExponential(2).replace(".", ",")); // pOH trick
                optionsPool.add(Math.pow(10, -Math.floor(ph)).toExponential(2).replace(".", ","));
                optionsPool.add((ph / 10).toExponential(2).replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `ph-2-${timestamp}`,
                    question: `Een oplossing heeft een **pH van ${ph}**. Wat is de $[H^+]$ concentratie?`,
                    answer: ans,
                    context: "Notatie: 1,23e-4",
                    solutionSteps: [`Gebruik de formule: $[H^+] = 10^{-pH}$.`, `$[H^+] = 10^{-${ph}}$.`],
                    type: "multiple-choice",
                    options
                };
            }

            case 3: {
                // pOH en pH relatie (pH + pOH = 14)
                const poh = rand(10, 60) / 10; // pOH 1.0 - 6.0
                const ph = 14 - poh;

                // Elite Upgrade: Multiple Choice Options
                const ans = round(ph, 1).toString().replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(round(poh, 1).toString().replace(".", ",")); // Same as pOH
                optionsPool.add(round(14 + poh, 1).toString().replace(".", ","));
                optionsPool.add(round(7 + poh, 1).toString().replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `ph-3-${timestamp}`,
                    question: `De **pOH** van een oplossing is **${poh}**. Wat is de **pH**?`,
                    answer: ans,
                    context: "T = 298 K (Standaardomstandigheden)",
                    solutionSteps: [
                        `Bij 298 K geldt: $pH + pOH = 14,00$.`,
                        `$pH = 14,00 - ${poh} = ${round(ph, 1)}$.`,
                    ],
                    type: "multiple-choice",
                    options
                };
            }

            case 4: {
                // NIEUW: Buffers (Henderson-Hasselbalch)
                // pH = pKz + log([Base]/[Zuur])
                const pKz = rand(30, 90) / 10; // pKz tussen 3.0 en 9.0
                // Ratio Base/Zuur tussen 0.1 en 10
                const ratio = rand(1, 100) / 10;

                const pH = pKz + Math.log10(ratio);

                const ans = round(pH, 2).toString().replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(pKz.toString().replace(".", ","));
                optionsPool.add(round(pKz - Math.log10(ratio), 2).toString().replace(".", ",")); // Wrong sign in HH
                optionsPool.add(round(pH + (Math.random() > 0.5 ? 1 : -1), 2).toString().replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `ph-4-${timestamp}`,
                    question: `Je maakt een buffer met een zwak zuur ($pK_z = ${pKz}$) en zijn geconjugeerde base.\n\nDe verhouding $\\frac{[Base]}{[Zuur]}$ is **${ratio}**.\n\nBereken de **pH** van deze buffer.`,
                    answer: ans,
                    context: "pH = pKz + log(Base/Zuur)",
                    solutionSteps: [
                        `Gebruik de bufferformule: $pH = pK_z + \\log(\\frac{[Base]}{[Zuur]})$`,
                        `$pH = ${pKz} + \\log(${ratio})$`,
                        `$pH = ${pKz} + ${round(Math.log10(ratio), 2)} = ${round(pH, 2)}$`,
                    ],
                    type: "multiple-choice",
                    options
                };
            }

            default: {
                const fallbackLevel = (rand(1, 4) as Difficulty);
                return PhPrecisionEngine.generate(fallbackLevel);
            }
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().replace(",", ".");
        const userVal = parseFloat(clean);
        const correctVal = parseFloat(problem.answer.replace(",", "."));

        // FIX: Gebruik absolute marge van 0.15 voor pH/pOH en 10% voor concentraties
        let isCorrect = false;

        if (correctVal > 0 && correctVal < 14 && !problem.question.includes("concentratie")) {
            // pH Marge (absoluut)
            isCorrect = Math.abs(userVal - correctVal) <= 0.15;
        } else {
            // Concentratie Marge (relatief 10%)
            isCorrect = Math.abs(userVal - correctVal) < correctVal * 0.1;
        }

        if (isCorrect) return { correct: true };

        return {
            correct: false,
            feedback: `Niet helemaal. Het juiste antwoord was ${problem.answer}.`,
        };
    },
};
