import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const MagneticFieldEngine: GymEngine = {
    id: "magnetic-field",
    name: "Flux Master",
    description: "Lorentzkracht, magnetische velden en inductie.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // Lorentzkracht op draad: F_L = B * I * l
            const B = rand(1, 50) / 10; // 0.1 - 5.0 Tesla
            const I = rand(1, 10); // Ampere
            const l_cm = rand(5, 50); // cm
            const l_m = l_cm / 100; // meters

            const F_L = B * I * l_m;

            return {
                id: `mag-1-${timestamp}`,
                question: `Een stroomdraad met lengte **${l_cm} cm** voert een stroom van **${I} A**. Hij bevindt zich loodrecht in een homogeen magnetisch veld van **${B} T**.\n\nBereken de Lorentzkracht ($F_L$).`,
                answer: F_L.toFixed(2).replace(".", ","),
                context: "F_L = B · I · l",
                solutionSteps: [
                    `Reken lengte om naar meter: ${l_cm} cm = ${l_m} m.`,
                    `$F_L = B \\cdot I \\cdot \\ell$`,
                    `$F_L = ${B} \\cdot ${I} \\cdot ${l_m} = ${F_L.toFixed(2)}$ N.`
                ]
            };
        } else {
            // Lorentzkracht op deeltje: F_L = B * q * v
            const B = rand(1, 20) / 100; // 0.01 - 0.20 T
            const v_exp = rand(4, 7);
            const velocity = rand(1, 9) * Math.pow(10, v_exp); // snelheid
            const q_charge = 1.6e-19; // elementairlading

            const F_L = B * q_charge * velocity;

            return {
                id: `mag-2-${timestamp}`,
                question: `Een proton ($q=1,6 \\cdot 10^{-19}$ C) beweegt met een snelheid van **$${velocity.toExponential(1).replace(".", ",")} $ m/s** loodrecht op een magnetisch veld van **${B} T**.\n\nBereken de Lorentzkracht op het proton.`,
                answer: F_L.toExponential(2).replace(".", ","),
                context: "F_L = B · q · v",
                solutionSteps: [
                    `$F_L = B \\cdot q \\cdot v$`,
                    `$F_L = ${B} \\cdot 1,6 \\cdot 10^{-19} \\cdot ${velocity.toExponential(1)}$`,
                    `$F_L \\approx ${F_L.toExponential(2)}$ N.`
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
