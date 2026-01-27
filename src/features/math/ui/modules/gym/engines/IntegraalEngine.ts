import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const IntegraalEngine: GymEngine = {
  id: "integraal",
  name: "Integraal Sprint",
  description: "Word een meester in het omgekeerd differentiëren.",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();
    const a = rand(2, 9);
    const b = rand(2, 5);

    switch (level) {
      case 1: {
        // Polynomials: ax^n
        const n = rand(1, 4);
        return {
          id: `int-1-${timestamp}`,
          question: `\\int ${a}x^{${n}} \\, dx`,
          answer: `(${a / (n + 1)})x^(${n + 1})`,
          displayAnswer: `\\frac{${a}}{${n + 1}}x^{${n + 1}} + C`,
          context: "Bepaal de onbepaalde integraal (laat +C weg in invoer)",
          solutionSteps: [
            `Gebruik de machtsregel voor integreren: \\int x^n dx = \\frac{1}{n+1}x^{n+1}.`,
            `Term: ${a}x^{${n}} \\to \\frac{${a}}{${n}+1}x^{${n}+1} = \\frac{${a}}{${n + 1}}x^{${n + 1}}`,
            `Antwoord: \\frac{${a}}{${n + 1}}x^{${n + 1}}`,
          ],
        };
      }

      case 2: {
        // e^ax forms
        return {
          id: `int-2-${timestamp}`,
          question: `\\int e^{${a}x} \\, dx`,
          answer: `(1/(${a}))e^(${a}x)`,
          displayAnswer: `\\frac{1}{${a}}e^{${a}x} + C`,
          context: "Bepaal de onbepaalde integraal (laat +C weg in invoer)",
          solutionSteps: [
            `De integraal van e^{kx} is \\frac{1}{k}e^{kx}.`,
            `Hier is k = ${a}.`,
            `Antwoord: \\frac{1}{${a}}e^{${a}x}`,
          ],
        };
      }

      case 3: {
        // 1/(ax+b) forms -> ln|ax+b|
        return {
          id: `int-3-${timestamp}`,
          question: `\\int \\frac{1}{${a}x + ${b}} \\, dx`,
          answer: `(1/(${a}))*ln(|(${a})x + (${b})|)`,
          displayAnswer: `\\frac{1}{${a}}\\ln|${a}x + ${b}| + C`,
          context: "Bepaal de onbepaalde integraal (gebruik ln|...|)",
          solutionSteps: [
            `De integraal van \\frac{1}{ax+b} is \\frac{1}{a}\\ln|ax+b|.`,
            `Hier is a = ${a} en b = ${b}.`,
            `Antwoord: \\frac{1}{${a}}\\ln|${a}x + ${b}|`,
          ],
        };
      }

      case 4: {
        // Trig primitives: sin(ax) or cos(ax)
        if (Math.random() > 0.5) {
          return {
            id: `int-4-${timestamp}`,
            question: `\\int \\sin(${a}x) \\, dx`,
            answer: `-(1/(${a}))*cos((${a})x)`,
            displayAnswer: `-\\frac{1}{${a}}\\cos(${a}x) + C`,
            context: "Bepaal de onbepaalde integraal",
            solutionSteps: [
              `De integraal van \\sin(kx) is -\\frac{1}{k}\\cos(kx).`,
              `Hier is k = ${a}.`,
              `Antwoord: -\\frac{1}{${a}}\\cos(${a}x)`,
            ],
          };
        } else {
          return {
            id: `int-4b-${timestamp}`,
            question: `\\int \\cos(${a}x) \\, dx`,
            answer: `(1/(${a}))*sin((${a})x)`,
            displayAnswer: `\\frac{1}{${a}}\\sin(${a}x) + C`,
            context: "Bepaal de onbepaalde integraal",
            solutionSteps: [
              `De integraal van \\cos(kx) is \\frac{1}{k}\\sin(kx).`,
              `Hier is k = ${a}.`,
              `Antwoord: \\frac{1}{${a}}\\sin(${a}x)`,
            ],
          };
        }
      }

      default:
        return IntegraalEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    // Handle common user variations (with or without +C)
    const cleanInput = input.replace(/\+ ?c$/i, "").trim();

    const isCorrect = checkEquivalence(cleanInput, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback: "Focus op de 'omgekeerde kettingregel' (de factor 1/a).",
    };
  },
};
