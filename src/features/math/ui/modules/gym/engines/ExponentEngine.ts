import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const ExponentEngine: GymEngine = {
  id: "exponents",
  name: "The Power Plant",
  description: "Master machten, wortels en logaritmen.",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();
    const n = rand(2, 6);

    switch (level) {
      case 1: // Roots to fractional powers
        // \sqrt[n]{x} -> x^(1/n)
        if (n === 2) {
          return {
            id: `exp-1-${timestamp}`,
            question: `\\sqrt{x}`,
            answer: `x^(1/2)`,
            displayAnswer: `x^{1/2}`,
            context: "Schrijf als macht",
            solutionSteps: [
              `Een gewone wortel is een macht van 1/2.`,
              `Antwoord: x^{1/2}`,
            ],
          };
        }
        return {
          id: `exp-1b-${timestamp}`,
          question: `\\sqrt[${n}]{x}`,
          answer: `x^(1/${n})`,
          displayAnswer: `x^{1/${n}}`,
          context: "Schrijf als macht",
          solutionSteps: [
            `De n-de machtswortel van x is gelijk aan x tot de macht 1/n.`,
            `Hier is n = ${n}`,
            `Antwoord: x^{1/${n}}`,
          ],
        };

      case 2: // Negative powers
        // 1/x^n -> x^-n
        return {
          id: `exp-2-${timestamp}`,
          question: `\\frac{1}{x^{${n}}}`,
          answer: `x^-${n}`,
          displayAnswer: `x^{-${n}}`,
          context: "Schrijf als macht",
          solutionSteps: [
            `Een factor in de noemer kan naar de teller met een negatieve exponent.`,
            `Antwoord: x^{-${n}}`,
          ],
        };

      case 3: // Combinations
        // 1 / (x * \sqrt[n]{x}) -> x^-(1 + 1/n)
        if (Math.random() > 0.5) {
          return {
            id: `exp-3-${timestamp}`,
            question: `\\frac{1}{x\\sqrt{x}}`,
            answer: `x^(-1.5)`,
            displayAnswer: `x^{-1,5}`,
            context: "Schrijf als macht",
            solutionSteps: [
              `Stap 1: Noemer omschrijven: x \\cdot x^{1/2} = x^{1.5}`,
              `Stap 2: Naar de teller brengen: x^{-1.5}`,
              `Antwoord: x^{-1.5} of x^{-3/2}`,
            ],
          };
        } else {
          const power = 1 + 1 / n;
          const powerStr = power % 1 === 0 ? `${power}` : `${n + 1}/${n}`;
          return {
            id: `exp-3b-${timestamp}`,
            question: `\\frac{1}{x\\sqrt[${n}]{x}}`,
            answer: `x^-(${powerStr})`,
            displayAnswer: `x^{-\\frac{${n + 1}}{${n}}}`,
            context: "Schrijf als macht",
            solutionSteps: [
              `Stap 1: Wortel als macht: \\sqrt[${n}]{x} = x^{1/${n}}`,
              `Stap 2: Noemer combineren: x^1 \\cdot x^{1/${n}} = x^{1 + 1/${n}} = x^{${n + 1}/${n}}`,
              `Stap 3: Naar de teller brengen: x^{-${n + 1}/${n}}`,
            ],
          };
        }

      case 4: // Logarithms
        if (Math.random() > 0.5) {
          // ln(e^n) -> n
          const val = rand(2, 9);
          return {
            id: `exp-4-${timestamp}`,
            question: `\\ln(e^{${val}})`,
            answer: `${val}`,
            context: "Vereenvoudig",
            solutionSteps: [
              `De natuurlijke logaritme (ln) is de inverse van de e-macht.`,
              `\\ln(e^A) = A`,
              `Antwoord: ${val}`,
            ],
          };
        } else {
          // ln(a) + ln(b) -> ln(ab)
          const a = rand(2, 5);
          const b = rand(6, 9);
          return {
            id: `exp-4b-${timestamp}`,
            question: `\\ln(${a}) + \\ln(${b})`,
            answer: `ln(${a * b})`,
            context: "Schrijf als één logaritme",
            solutionSteps: [
              `Rekenregel: \\ln(A) + \\ln(B) = \\ln(A \\cdot B)`,
              `${a} \\cdot ${b} = ${a * b}`,
              `Antwoord: \\ln(${a * b})`,
            ],
          };
        }

      default:
        return ExponentEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    const isCorrect = checkEquivalence(input, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback:
        "Niet wiskundig equivalent. Check je rekenregels (bijv. wortel is macht 1/2).",
    };
  },
};
