import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const roundTo = (num: number, dec: number) => Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

export const MechanicsProEngine: GymEngine = {
    id: "mechanics-pro",
    name: "Newton's Pro",
    description: "Impuls, hefbomen en trillingstijden.",

    generate: (_level: Difficulty): GymProblem => {
        const timestamp = Date.now();
        const topic = rand(0, 2);

        if (topic === 0) {
            // IMPULS (Botsing)
            const m1 = rand(1, 5) * 1000; // auto
            const m2 = rand(1, 5) * 1000; // stilstaand
            const v1 = rand(10, 30);
            const v_na = (m1 * v1) / (m1 + m2);

            return {
                id: `pro-1-${timestamp}`,
                question: `Een auto van **${m1} kg** rijdt met **${v1} m/s** tegen een stilstaande vrachtwagen van **${m2} kg**.\nZe blijven aan elkaar haken. Wat is de snelheid direct na de botsing?`,
                answer: roundTo(v_na, 1).toString().replace(".", ","),
                context: "Behoud van impuls: p = m·v",
                solutionSteps: [
                    `$p_{voor} = m_1 v_1 + m_2 v_2 = ${m1} \\cdot ${v1} + 0 = ${m1 * v1}$`,
                    `$p_{na} = (m_1 + m_2) \\cdot v_{na} = ${m1 + m2} \\cdot v_{na}$`,
                    `$v_{na} = \\frac{${m1 * v1}}{${m1 + m2}} \\approx ${roundTo(v_na, 1)}$ m/s.`
                ]
            };
        } else if (topic === 1) {
            // MOMENTEN (Wipwap)
            const m1 = rand(20, 80);
            const r1 = rand(15, 40) / 10;
            const m2 = rand(20, 80);
            const r2 = (m1 * r1) / m2;

            return {
                id: `pro-2-${timestamp}`,
                question: `Jantje (**${m1} kg**) zit op **${r1} m** van het draaipunt van een wip. Pietje (**${m2} kg**) wil aan de andere kant gaan zitten om in evenwicht te komen.\n\nOp welke afstand ($r$) moet Pietje zitten?`,
                answer: roundTo(r2, 2).toString().replace(".", ","),
                context: "Momentenwet: F₁·r₁ = F₂·r₂",
                solutionSteps: [
                    `$M_1 = M_2 \\implies m_1 g \\cdot r_1 = m_2 g \\cdot r_2$`,
                    `De $g$ valt weg: $${m1} \\cdot ${r1} = ${m2} \\cdot r_2$`,
                    `$r_2 = \\frac{${m1} \\cdot ${r1}}{${m2}} \\approx ${roundTo(r2, 2)}$ m.`
                ]
            };
        } else {
            // MASSAVEER
            const mass_kg = rand(100, 500) / 1000;
            const C_const = rand(10, 50);
            const period_T = 2 * Math.PI * Math.sqrt(mass_kg / C_const);

            return {
                id: `pro-3-${timestamp}`,
                question: `Een blokje van **${mass_kg * 1000} gram** hangt aan een veer met veerconstante **$C = ${C_const}$ N/m**.\n\nBereken de trillingstijd ($T$).`,
                answer: roundTo(period_T, 2).toString().replace(".", ","),
                context: "T = 2π√(m/C)",
                solutionSteps: [
                    `Massa in kg: $m = ${mass_kg}$ kg.`,
                    `$T = 2\\pi \\sqrt{\\frac{m}{C}}$`,
                    `$T = 2\\pi \\sqrt{\\frac{${mass_kg}}{${C_const}}} \\approx ${roundTo(period_T, 2)}$ s.`
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
