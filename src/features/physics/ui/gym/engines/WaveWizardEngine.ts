import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (num: number, dec: number) => Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

export const WaveWizardEngine: GymEngine = {
    id: "wave-wizard",
    name: "Golf Wizard",
    description: "Trillingen, golven en de brekingswet van Snellius.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // T = 1/f
            const f = rand(10, 500); // 10 - 500 Hz
            const t = 1 / f;

            return {
                id: `wave-1-${timestamp}`,
                question: `Een trilling heeft een frequentie van **${f} Hz**. Wat is de trillingstijd ($T$) in seconden?`,
                answer: t.toExponential(3).replace(".", ","),
                context: "T = 1 / f",
                solutionSteps: [
                    `$T = 1 / f = 1 / ${f} \\approx ${t.toExponential(3)}$ s.`
                ]
            };
        } else if (level === 2) {
            // v = f * lambda
            const f = rand(100, 1000);
            const lambda = rand(1, 10) / 10; // 0.1 - 1.0 m
            const v = f * lambda;

            return {
                id: `wave-2-${timestamp}`,
                question: `Een golf heeft een golflengte van **${lambda} m** en een frequentie van **${f} Hz**. Wat is de voortplantingssnelheid ($v$)?`,
                answer: round(v, 1).toString().replace(".", ","),
                context: "v = f * lambda",
                solutionSteps: [
                    `$v = f \\cdot \\lambda = ${f} \\cdot ${lambda} = ${round(v, 1)}$ m/s.`
                ]
            };
        } else {
            // Snellius (n1 * sin(i) = n2 * sin(r))
            const angleI = rand(10, 60);
            const n1 = 1.00; // Lucht
            const n2 = 1.33; // Water
            const angleR = Math.asin((n1 * Math.sin(angleI * Math.PI / 180)) / n2) * 180 / Math.PI;

            return {
                id: `wave-3-${timestamp}`,
                question: `Een lichtstraal valt in van lucht ($n=1,00$) naar water ($n=1,33$) met een invalshoek van **${angleI}°**. Bereken de hoek van breking ($r$).`,
                answer: round(angleR, 1).toString().replace(".", ","),
                context: "Wet van Snellius",
                solutionSteps: [
                    `$n_1 \\cdot \\sin(i) = n_2 \\cdot \\sin(r)$`,
                    `$1,00 \\cdot \\sin(${angleI}°) = 1,33 \\cdot \\sin(r)$`,
                    `$\\sin(r) = \\frac{\\sin(${angleI}°)}{1,33} \\implies r \\approx ${round(angleR, 1)}°.`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const val = parseFloat(input.trim().replace(",", "."));
        const ans = parseFloat(problem.answer.replace(",", "."));
        const isCorrect = !isNaN(val) && Math.abs(val - ans) < 0.3;
        return {
            correct: isCorrect,
            feedback: isCorrect ? "Kraakhelder!" : `Niet helemaal. Het was: ${problem.answer}`
        };
    }
};
