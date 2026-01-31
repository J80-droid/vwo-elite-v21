import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const HardyWeinbergEngine: GymEngine = {
    id: "hardy-weinberg",
    name: "Evolutie Calculator",
    description: "Populatiegenetica en Hardy-Weinberg. Reken aan de evolutie.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        switch (level) {
            case 1: {
                // Simple allele frequency
                const q = 0.2 + (rand(0, 4) / 10); // 0.2 to 0.6
                const p = 1 - q;
                return {
                    id: `hw-1-${timestamp}`,
                    question: `In een populatie is de allelfrequentie van het recessieve allel ($q$) gelijk aan ${q.toFixed(1)}. Wat is de frequentie van het dominante allel ($p$)?`,
                    answer: p.toFixed(1),
                    context: "Basis allelfrequenties",
                    solutionSteps: [
                        "De som van de allelfrequenties is altijd 1: $p + q = 1$.",
                        `$p = 1 - ${q.toFixed(1)} = ${p.toFixed(1)}$.`
                    ]
                };
            }

            case 2: {
                // Genotype frequency
                const q = 0.3;
                const p = 0.7;
                const pq2 = 2 * p * q;
                return {
                    id: `hw-2-${timestamp}`,
                    question: `Als $p = 0,7$ en $q = 0,3$, wat is dan de frequentie van de heterozygote individuen ($2pq$)?`,
                    answer: pq2.toFixed(2).replace(".", ","),
                    context: "Hardy-Weinberg evenwicht",
                    solutionSteps: [
                        "Gebruik de formule $p^2 + 2pq + q^2 = 1$.",
                        `$2pq = 2 \\times 0,7 \\times 0,3 = ${pq2.toFixed(2)}$.`
                    ]
                };
            }

            case 3: {
                // FIX: Random q^2 in plaats van vast 0.04
                const q2 = (rand(1, 25) / 100); // 0.01 tot 0.25
                const q = Math.sqrt(q2);

                return {
                    id: `hw-3-${timestamp}`,
                    question: `In een populatie heeft **${Math.round(q2 * 100)}%** het recessieve fenotype. Bereken de frequentie van het recessieve allel ($q$).`,
                    answer: q.toFixed(2).replace(".", ","),
                    context: "Rond af op 2 decimalen",
                    solutionSteps: [
                        "Het recessieve fenotype wordt bepaald door genotype aa.",
                        `De frequentie van aa is $q^2 = ${q2.toFixed(2)}$.`,
                        `$q = \\sqrt{${q2.toFixed(2)}} = ${q.toFixed(2)}$.`
                    ]
                };
            }

            default:
                return HardyWeinbergEngine.generate(1);
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim().replace(",", ".");
        const numInput = parseFloat(clean);
        const numAns = parseFloat(problem.answer.replace(",", "."));
        const isCorrect = Math.abs(numInput - numAns) < 0.01;
        return {
            correct: isCorrect,
            feedback: isCorrect ? "Rekenwonder!" : `Het juiste antwoord is ${problem.answer}.`
        };
    }
};
