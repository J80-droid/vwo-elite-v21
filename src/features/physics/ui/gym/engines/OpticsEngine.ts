import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const roundToOne = (num: number) => Math.round(num * 10) / 10;

export const OpticsEngine: GymEngine = {
    id: "optics-engine",
    name: "Focus Fanaat",
    description: "Lenzenwet, vergroting en dioptrie.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // Lenzenwet: 1/f = 1/v + 1/b
            const f_cm = rand(5, 20); // brandpuntsafstand
            const v_cm = f_cm + rand(5, 30); // voorwerpsafstand

            const inv_b = (1 / f_cm) - (1 / v_cm);
            const b_cm = 1 / inv_b;

            return {
                id: `opt-1-${timestamp}`,
                question: `Een voorwerp staat op **${v_cm} cm** afstand van een positieve lens met een brandpuntsafstand van **${f_cm} cm**.\n\nBereken de beeldafstand ($b$).`,
                answer: roundToOne(b_cm).toString().replace(".", ","),
                context: "Lenzenwet (alles in cm mag)",
                solutionSteps: [
                    `Formule: $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{b}$`,
                    `Invullen: $\\frac{1}{${f_cm}} = \\frac{1}{${v_cm}} + \\frac{1}{b}$`,
                    `$\\frac{1}{b} = \\frac{1}{${f_cm}} - \\frac{1}{${v_cm}} \\approx ${inv_b.toFixed(4)}$`,
                    `$b = \\frac{1}{${inv_b.toFixed(4)}} \\approx ${roundToOne(b_cm)}$ cm.`
                ]
            };
        } else {
            // Vergroting N = |b/v|
            const f_cm = rand(10, 50);
            const N_magnify = rand(2, 5);
            const v_cm = (f_cm * (N_magnify + 1)) / N_magnify;
            const b_cm = N_magnify * v_cm;

            return {
                id: `opt-2-${timestamp}`,
                question: `Je wilt met een lens ($f=${f_cm}$ cm) een beeld projecteren dat **${N_magnify} keer zo groot** is als het voorwerp.\n\nHoever moet het scherm van de lens staan (beeldafstand $b$)?`,
                answer: roundToOne(b_cm).toString().replace(".", ","),
                context: "N = b / v",
                solutionSteps: [
                    `Vergroting $N = \\frac{b}{v} = ${N_magnify} \\implies v = \\frac{b}{${N_magnify}}$`,
                    `Lenzenwet: $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{b}$`,
                    `Vervang $v$: $\\frac{1}{f} = \\frac{${N_magnify}}{b} + \\frac{1}{b} = \\frac{${N_magnify + 1}}{b}$`,
                    `$b = f \\cdot (${N_magnify} + 1) = ${f_cm} \\cdot ${N_magnify + 1} = ${roundToOne(b_cm)}$ cm.`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const userVal = parseFloat(input.replace(",", "."));
        const correctVal = parseFloat(problem.answer.replace(",", "."));
        if (isNaN(userVal)) return { correct: false, feedback: "Voer een getal in." };
        if (Math.abs(userVal - correctVal) < (correctVal * 0.05)) return { correct: true };
        return { correct: false, feedback: `Antwoord: ${problem.answer} cm` };
    }
};
