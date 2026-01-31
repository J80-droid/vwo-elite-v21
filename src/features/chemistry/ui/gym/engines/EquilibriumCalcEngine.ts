import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

import { validateScientific } from "./ScientificValidator";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (num: number, dec: number) => Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

export const EquilibriumCalcEngine: GymEngine = {
    id: "equilibrium-calc",
    name: "Kc Calculator",
    description: "Bereken de evenwichtsconstante of concentraties bij chemisch evenwicht.",

    generate: (level: Difficulty): GymProblem | Promise<GymProblem> => {
        const timestamp = Date.now();
        const genLevel = level || (rand(1, 2) as Difficulty);
        const type = Math.random() > 0.5 ? "simple" : "power";

        if (genLevel === 1) {
            if (type === "simple") {
                const cA = rand(1, 50) / 10;
                const cB = rand(1, 50) / 10;
                const cC = rand(1, 50) / 10;
                const cD = rand(1, 50) / 10;
                const kc = (cC * cD) / (cA * cB);
                const ans = round(kc, 2).toString().replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(round(1 / kc, 2).toString().replace(".", ",")); // Inverted
                optionsPool.add(round(cA * cB * cC * cD, 1).toString().replace(".", ",")); // Multiplication
                optionsPool.add(round(kc * 1.5, 2).toString().replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `kc-1-${timestamp}`,
                    question: `Bij het evenwicht $A + B \\rightleftarrows C + D$ meten we de volgende concentraties:\n$[A] = ${cA}$ M, $[B] = ${cB}$ M, $[C] = ${cC}$ M, $[D] = ${cD}$ M.\n\nBereken de **evenwichtsconstante ($K_c$)**.`,
                    answer: ans,
                    context: "Kc = [producten] / [beginstoffen]",
                    solutionSteps: [
                        `$K_c = \\frac{[C] \\cdot [D]}{[A] \\cdot [B]}$`,
                        `$K_c = \\frac{${cC} \\cdot ${cD}}{${cA} \\cdot ${cB}} \\approx ${round(kc, 2)}$`
                    ],
                    type: "multiple-choice",
                    options
                };
            } else {
                const cH2 = rand(1, 40) / 10;
                const cI2 = rand(1, 40) / 10;
                const cHI = rand(2, 80) / 10;
                const kc = (cHI * cHI) / (cH2 * cI2);
                const ans = round(kc, 1).toString().replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(round((cHI) / (cH2 * cI2), 1).toString().replace(".", ",")); // Forgot power
                optionsPool.add(round((cHI * 2) / (cH2 * cI2), 1).toString().replace(".", ",")); // Multiplied by 2
                optionsPool.add(round(kc * 0.8, 1).toString().replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `kc-1-p-${timestamp}`,
                    question: `Voor het gas-evenwicht $H_2 (g) + I_2 (g) \\rightleftarrows 2 HI (g)$ zijn de concentraties bij evenwicht:\n$[H_2] = ${cH2}$ M, $[I_2] = ${cI2}$ M, $[HI] = ${cHI}$ M.\n\nBereken **$K_c$**.`,
                    answer: ans,
                    context: "Let op de macht!",
                    solutionSteps: [
                        `$K_c = \\frac{[HI]^2}{[H_2] \\cdot [I_2]}$`,
                        `$K_c = \\frac{${cHI}^2}{${cH2} \\cdot ${cI2}} \\approx ${round(kc, 1)}$`
                    ],
                    type: "multiple-choice",
                    options
                };
            }
        } else {
            const kc = rand(1, 100);
            const cA = rand(1, 30) / 10;
            const cB = rand(1, 30) / 10;
            const cC = rand(1, 30) / 10;
            const cD = (kc * cA * cB) / cC;
            const ans = round(cD, 2).toString().replace(".", ",");
            const optionsPool = new Set<string>();
            optionsPool.add(ans);
            optionsPool.add(round((kc * cC) / (cA * cB), 2).toString().replace(".", ",")); // Wrong algebra
            optionsPool.add(round(cD / 10, 2).toString().replace(".", ","));
            optionsPool.add(round(cD * 1.5, 2).toString().replace(".", ","));

            const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

            return {
                id: `kc-2-${timestamp}`,
                question: `Het evenwicht $A + B \\rightleftarrows C + D$ heeft een $K_c$ van **${kc}**.\nDe evenwichtsconcentraties zijn: $[A] = ${cA}$ M, $[B] = ${cB}$ M en $[C] = ${cC}$ M.\n\nBereken de concentratie van **[D]**.`,
                answer: ans,
                context: "Concentratie berekenen uit Kc",
                solutionSteps: [
                    `$K_c = \\frac{[C] \\cdot [D]}{[A] \\cdot [B]} \\implies [D] = \\frac{K_c \\cdot [A] \\cdot [B]}{[C]}$`,
                    `$[D] = \\frac{${kc} \\cdot ${cA} \\cdot ${cB}}{${cC}} \\approx ${round(cD, 2)}$ M`
                ],
                type: "multiple-choice",
                options
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        return validateScientific(input, problem.answer);
    }
};
