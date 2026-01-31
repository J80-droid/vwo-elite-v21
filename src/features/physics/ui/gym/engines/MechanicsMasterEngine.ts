import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (num: number, dec: number) => Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

export const MechanicsMasterEngine: GymEngine = {
    id: "mechanics-master",
    name: "Mechanica Meester",
    description: "Krachten, arbeid en energie-omzettingen op VWO niveau.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // F = m * a
            const m = rand(5, 50) * 10; // 50 - 500 kg
            const a = rand(1, 15); // 1 - 15 m/s^2
            const f = m * a;

            return {
                id: `mech-1-${timestamp}`,
                question: `Een voorwerp met een massa van **${m} kg** versnelt met **${a} m/s²**. Wat is de resulterende kracht ($F_{res}$) op het voorwerp?`,
                answer: f.toString().replace(".", ","),
                context: "F = m * a",
                solutionSteps: [
                    `Formule: $F_{res} = m \\cdot a$`,
                    `$F_{res} = ${m} \\cdot ${a} = ${f}$ N.`
                ]
            };
        } else if (level === 2) {
            // Arbeid (W = F * s)
            const f = rand(10, 100) * 5; // 50 - 500 N
            const s = rand(2, 20); // 2 - 20 m
            const w = f * s;

            return {
                id: `mech-2-${timestamp}`,
                question: `Een kracht van **${f} N** werkt over een afstand van **${s} meter**. Hoeveel arbeid ($W$) wordt er verricht?`,
                answer: w.toString().replace(".", ","),
                context: "W = F * s",
                solutionSteps: [
                    `Formule: $W = F \\cdot s$`,
                    `$W = ${f} \\cdot ${s} = ${w}$ J.`
                ]
            };
        } else {
            // Energie omzetting (E_pot -> E_kin)
            const m = rand(1, 10); // 1-10 kg
            const h = rand(5, 50); // 5-50 m
            const g = 9.81;
            const v = Math.sqrt(2 * g * h);

            return {
                id: `mech-3-${timestamp}`,
                question: `Een voorwerp met massa **${m} kg** valt vanaf een hoogte van **${h} meter** (zonder wrijving). Bereken de snelheid ($v$) op het moment van inslag.`,
                answer: round(v, 1).toString().replace(".", ","),
                context: "Energiebehoud (g = 9,81)",
                solutionSteps: [
                    `$E_{pot} = m \\cdot g \\cdot h$ en $E_{kin} = \\frac{1}{2} m \\cdot v^2$`,
                    `$m \\cdot g \\cdot h = \\frac{1}{2} m \\cdot v^2 \\implies v = \\sqrt{2gh}$`,
                    `$v = \\sqrt{2 \\cdot 9,81 \\cdot ${h}} \\approx ${round(v, 1)}$ m/s.`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const val = parseFloat(input.trim().replace(",", "."));
        const ans = parseFloat(problem.answer.replace(",", "."));
        const isCorrect = !isNaN(val) && Math.abs(val - ans) < 0.2;
        return {
            correct: isCorrect,
            feedback: isCorrect ? "Goeie grip op de mechanica!" : `Niet helemaal. Het was: ${problem.answer}`
        };
    }
};
