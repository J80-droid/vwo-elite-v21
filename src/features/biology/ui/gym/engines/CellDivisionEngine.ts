import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const CellDivisionEngine: GymEngine = {
    id: "cell-division",
    name: "Chromosomen Teller",
    description: "Mitose, Meiose, 2n en n. Raak de tel niet kwijt tijdens de deling.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        // Genereer een organisme met een even aantal chromosomen (2n)
        // Bijv: Fruitvlieg (8), Mens (46), Hond (78), Ui (16)
        const possibleN = [4, 8, 12, 16, 23, 30, 39];
        const n = possibleN[rand(0, possibleN.length - 1)]!;
        const twoN = n * 2;

        switch (level) {
            case 1: {
                // Basisbegrippen: n vs 2n in cellen
                const isGamete = Math.random() > 0.5;
                const cellType = isGamete ? "een geslachtscel (spermacel/eicel)" : "een levercel";

                return {
                    id: `cd-1-${timestamp}`,
                    question: `Een organisme heeft in lichaamscellen **2n = ${twoN}** chromosomen.\n\nHoeveel chromosomen zitten er in **${cellType}**?`,
                    answer: (isGamete ? n : twoN).toString(),
                    context: "Lichaamscel = 2n, Geslachtscel = n",
                    solutionSteps: [
                        `2n = ${twoN}, dus n = ${n}.`,
                        isGamete
                            ? "Geslachtscellen zijn haploïde (n)."
                            : "Levercellen zijn diploïde lichaamscellen (2n).",
                        `Antwoord: ${isGamete ? n : twoN}.`
                    ]
                };
            }

            case 2: {
                // Mitose: Tellen van chromatiden (DNA moleculen)
                const phase = Math.random() > 0.5 ? "G1-fase" : "Metafase";
                const isG1 = phase === "G1-fase";

                return {
                    id: `cd-2-${timestamp}`,
                    question: `Een celkern bevat **${twoN} chromosomen** ($2n$). Hoeveel **DNA-moleculen** (chromatiden) bevat deze kern in de **${phase}** van de mitose?`,
                    answer: (isG1 ? twoN : twoN * 2).toString(),
                    context: "Let op: is het DNA al verdubbeld?",
                    solutionSteps: [
                        `Aantal chromosomen = ${twoN}.`,
                        isG1
                            ? "In de G1-fase is het DNA nog niet verdubbeld. Elk chromosoom bestaat uit 1 chromatide."
                            : "In de Metafase is de S-fase al geweest. Elk chromosoom bestaat uit 2 chromatiden (zusterchromatiden).",
                        `Rekensom: ${twoN} x ${isG1 ? 1 : 2} = ${isG1 ? twoN : twoN * 2}.`
                    ]
                };
            }

            case 3: {
                // Meiose I vs Meiose II
                return {
                    id: `cd-3-${timestamp}`,
                    question: `Een organisme heeft **2n = ${twoN}**.\n\nWe kijken naar een cel in de **Metafase II** van de meiose. Hoeveel chromosomen bevinden zich in deze cel?`,
                    answer: n.toString(),
                    context: "Meiose I was de reductiedeling.",
                    solutionSteps: [
                        "Meiose I scheidt de homologe chromosomenparen.",
                        `De cel gaat dus van 2n (${twoN}) naar n (${n}).`,
                        "In Metafase II bevat de cel n chromosomen (die elk nog wel uit 2 chromatiden bestaan).",
                        `Antwoord: ${n}.`
                    ]
                };
            }

            default:
                return CellDivisionEngine.generate(1);
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.trim();
        const isCorrect = clean === problem.answer;
        return {
            correct: isCorrect,
            feedback: isCorrect ? "Correct!" : `Helaas. Het juiste aantal is ${problem.answer}.`
        };
    }
};
