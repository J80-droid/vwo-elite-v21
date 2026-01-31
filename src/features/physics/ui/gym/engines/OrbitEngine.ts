import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Constanten
const G_CONST = 6.674e-11; // Gravitatieconstante
const M_EARTH = 5.972e24;
const R_EARTH = 6.371e6;

export const OrbitEngine: GymEngine = {
    id: "orbit-engine",
    name: "Gravity Guru",
    description: "Satellietbanen, gravitatiekracht en de wetten van Kepler.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // Gravitatiekracht: Fg = G * M * m / r^2
            const m_sat = rand(100, 2000); // Satelliet massa
            const h_km = rand(200, 1000); // Hoogte boven aardoppervlak
            const r_total = R_EARTH + (h_km * 1000); // Totale straal in m

            const F_g = (G_CONST * M_EARTH * m_sat) / (r_total * r_total);

            return {
                id: `orb-1-${timestamp}`,
                question: `Een satelliet van **${m_sat} kg** draait op een hoogte van **${h_km} km** boven het aardoppervlak.\n\nBereken de gravitatiekracht ($F_g$).`,
                answer: F_g.toExponential(2).replace(".", ","),
                context: "Let op: r is afstand tot middelpunt",
                solutionSteps: [
                    `Straal $r = R_{aarde} + h = 6,371 \\cdot 10^6 + ${h_km} \\cdot 10^3 = ${r_total.toExponential(2)}$ m.`,
                    `$F_g = G \\cdot \\frac{M \\cdot m}{r^2}$`,
                    `$F_g = 6,67 \\cdot 10^{-11} \\cdot \\frac{5,97 \\cdot 10^{24} \\cdot ${m_sat}}{(${r_total.toExponential(2)})^2} \\approx ${F_g.toExponential(2)}$ N.`
                ]
            };
        } else {
            // Baansnelheid: v = sqrt(GM/r)
            const h_km = rand(400, 36000);
            const r_total = R_EARTH + (h_km * 1000);

            const velocity = Math.sqrt((G_CONST * M_EARTH) / r_total);

            return {
                id: `orb-2-${timestamp}`,
                question: `Bereken de baansnelheid ($v$) van een satelliet die op **${h_km} km** hoogte rond de aarde draait.`,
                answer: velocity.toFixed(0),
                context: "F_mpz = F_g",
                solutionSteps: [
                    `Stel $F_{mpz} = F_g \\implies \\frac{mv^2}{r} = G \\frac{mM}{r^2}$`,
                    `Hieruit volgt: $v = \\sqrt{\\frac{GM}{r}}$`,
                    `$r = 6,371 \\cdot 10^6 + ${h_km} \\cdot 10^3$ m.`,
                    `$v = \\sqrt{\\frac{6,67 \\cdot 10^{-11} \\cdot 5,97 \\cdot 10^{24}}{r}} \\approx ${velocity.toFixed(0)}$ m/s.`
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
