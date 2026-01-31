import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const toSci = (num: number) => num.toExponential(2).replace(".", ",");

// Constanten
const h = 6.63e-34; // Planck
const c = 3.00e8;   // Lichtsnelheid
// const e_charge = 1.60e-19; // Elementairlading

export const QuantumEngine: GymEngine = {
    id: "quantum-leap",
    name: "Quantum Sprinter",
    description: "Fotonen, energie en golflengtes. $E=hf$ en spectra.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        if (level === 1) {
            // E = h*c/lambda
            const lambdaNm = rand(400, 800); // Zichtbaar licht
            const lambda = lambdaNm * 1e-9;
            const E = (h * c) / lambda;

            return {
                id: `qm-1-${timestamp}`,
                question: `Een foton heeft een golflengte van **${lambdaNm} nm**. Bereken de energie ($E$) in Joule.`,
                answer: toSci(E),
                context: "Gebruik $E = h \\cdot c / \\lambda$",
                solutionSteps: [
                    `$h = 6,63 \\cdot 10^{-34}$ en $c = 3,00 \\cdot 10^8$.`,
                    `$\\lambda = ${lambdaNm} \\cdot 10^{-9}$ m.`,
                    `$E = \\frac{6,63 \\cdot 10^{-34} \\cdot 3,00 \\cdot 10^8}{${lambdaNm} \\cdot 10^{-9}} \\approx ${toSci(E)}$ J.`
                ]
            };
        } else {
            // Foto-elektrisch effect: Ek = Ef - Uit
            const Uit = rand(200, 500) / 100; // 2.00 - 5.00 eV
            const Ef = Uit + (rand(10, 300) / 100); // Iets hoger dan Uit
            const Ek = Ef - Uit;

            return {
                id: `qm-2-${timestamp}`,
                question: `Licht met een fotonenergie van **${Ef.toFixed(2)} eV** valt op een metaal met uittree-energie **${Uit.toFixed(2)} eV**.\n\nBereken de maximale kinetische energie van de vrijgekomen elektronen (in eV).`,
                answer: Ek.toFixed(2).replace(".", ","),
                context: "Wet van behoud van energie (Einstein)",
                solutionSteps: [
                    `Formule: $E_{foton} = E_{uittree} + E_{kin}$`,
                    `$E_{kin} = E_{foton} - E_{uittree}$`,
                    `$E_{kin} = ${Ef.toFixed(2)} - ${Uit.toFixed(2)} = ${Ek.toFixed(2)}$ eV.`
                ]
            };
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const clean = input.replace(",", ".").replace("ev", "").replace("j", "").trim();
        const userVal = parseFloat(clean);
        const correctVal = parseFloat(problem.answer.replace(",", "."));

        if (isNaN(userVal)) return { correct: false, feedback: "Voer een geldig getal in." };
        if (Math.abs(userVal - correctVal) < (Math.max(correctVal, 1e-25) * 0.05)) return { correct: true };

        return { correct: false, feedback: `Helaas. Het antwoord is ${problem.answer}.` };
    }
};
