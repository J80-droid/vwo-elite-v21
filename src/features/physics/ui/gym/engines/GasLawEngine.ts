import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const GasLawEngine: GymEngine = {
    id: "gas-law",
    name: "Thermodynamica Tank",
    description: "Ideale gaswet en soortelijke warmte.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // Q = m * c * dT
            const m = rand(1, 50) / 10; // 0.1 - 5.0 kg
            const c_water = 4180; // Water
            const dT = rand(5, 50);
            const Q = m * c_water * dT;

            return {
                id: `gas-1-${timestamp}`,
                question: `Hoeveel energie ($Q$) is nodig om **${m} kg** water **${dT} °C** in temperatuur te laten stijgen? ($c_{water} = 4180$ J/kg·K)`,
                answer: Q.toExponential(2).replace(".", ","),
                context: "Soortelijke warmte",
                solutionSteps: [
                    `$Q = m \\cdot c \\cdot \\Delta T$`,
                    `$Q = ${m} \\cdot 4180 \\cdot ${dT} \\approx ${Q.toExponential(2)}$ J.`
                ]
            };
        } else {
            // pV = nRT (Bereken V)
            const n = rand(1, 10);
            const T_celsius = rand(20, 100);
            const T_kelvin = T_celsius + 273;
            const p = 100000; // Standaard druk approx
            const R_const = 8.31;
            const V = (n * R_const * T_kelvin) / p;

            return {
                id: `gas-2-${timestamp}`,
                question: `Bereken het volume ($V$ in $m^3$) van **${n} mol** ideaal gas bij een temperatuur van **${T_celsius} °C** en een druk van **$1,0 \\cdot 10^5$ Pa**.\n($R = 8,31$)`,
                answer: V.toFixed(3).replace(".", ","),
                context: "Ideale gaswet (let op Kelvin!)",
                solutionSteps: [
                    `Reken T om naar Kelvin: $${T_celsius} + 273 = ${T_kelvin}$ K.`,
                    `$p \\cdot V = n \\cdot R \\cdot T \\implies V = \\frac{nRT}{p}$`,
                    `$V = \\frac{${n} \\cdot 8,31 \\cdot ${T_kelvin}}{100000} \\approx ${V.toFixed(3)}$ m³.`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const userVal = parseFloat(input.replace(",", "."));
        const correctVal = parseFloat(problem.answer.replace(",", "."));
        if (isNaN(userVal)) return { correct: false, feedback: "Voer een getal in." };
        if (Math.abs(userVal - correctVal) < (correctVal * 0.05)) return { correct: true };
        return { correct: false, feedback: `Antwoord: ${problem.answer}` };
    }
};
