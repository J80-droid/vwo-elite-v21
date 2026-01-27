import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const DerivEngine: GymEngine = {
  id: "derivs",
  name: "The Derivative Dash",
  description: "Automatiseer standaard afgeleiden.",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();
    const a = rand(2, 9);
    const b = rand(2, 5);

    switch (level) {
      case 1: {
        // Polynomials
        // f(x) = ax^n - bx
        const n = rand(2, 5);
        return {
          id: `deriv-1-${timestamp}`,
          question: `f(x) = ${a}x^{${n}} - ${b}x`,
          answer: `${a * n}x^{${n - 1}} - ${b}`,
          displayAnswer: `${a * n}x^{${n - 1}} - ${b}`,
          context: "Bepaal de afgeleide f'(x)",
          solutionSteps: [
            `Machtsregel: (x^n)' = nx^{n-1}.`,
            `Term 1: ${a} \\cdot ${n}x^{${n - 1}} = ${a * n}x^{${n - 1}}`,
            `Term 2: -${b}x \\to -${b}`,
            `Antwoord: ${a * n}x^{${n - 1}} - ${b}`,
          ],
        };
      }

      case 2: {
        // Trig derivatives
        if (Math.random() > 0.5) {
          return {
            id: `deriv-2-${timestamp}`,
            question: `f(x) = \\cos(x)`,
            answer: `-sin(x)`,
            displayAnswer: `-\\sin(x)`,
            context: "Bepaal de afgeleide f'(x)",
            solutionSteps: [
              `Standaard afgeleide: de afgeleide van cosinus is negatieve sinus.`,
              `Antwoord: -\\sin(x)`,
            ],
          };
        } else {
          return {
            id: `deriv-2b-${timestamp}`,
            question: `f(x) = ${a}\\sin(x)`,
            answer: `${a}*cos(x)`,
            displayAnswer: `${a}\\cos(x)`,
            context: "Bepaal de afgeleide f'(x)",
            solutionSteps: [
              `Standaard afgeleide: de afgeleide van sinus is cosinus.`,
              `De constante factor ${a} blijft staan.`,
              `Antwoord: ${a}\\cos(x)`,
            ],
          };
        }
      }

      case 3: {
        // e^x and ln(x)
        if (Math.random() > 0.5) {
          return {
            id: `deriv-3-${timestamp}`,
            question: `f(x) = e^{${a}x}`,
            answer: `${a}*e^{${a}x}`,
            displayAnswer: `${a}e^{${a}x}`,
            context: "Bepaal de afgeleide f'(x)",
            solutionSteps: [
              `Kettingregel: de afgeleide van e^{ax} is a \\cdot e^{ax}.`,
              `Antwoord: ${a}e^{${a}x}`,
            ],
          };
        } else {
          return {
            id: `deriv-3b-${timestamp}`,
            question: `f(x) = \\ln(x^{${b}})`,
            answer: `${b}/x`,
            displayAnswer: `\\frac{${b}}{x}`,
            context: "Bepaal de afgeleide f'(x)",
            solutionSteps: [
              `Optie 1: Voor $x > 0$ geldt $\\ln(x^b) = b \\cdot \\ln(x)$.`,
              `De afgeleide f'(x) is dan $b \\cdot \\frac{1}{x} = \\frac{b}{x}$.`,
              b % 2 === 0
                ? "Merk op: Omdat de macht even is, is het domein $x \\neq 0$ en geldt f'(x) = \\frac{b}{x}$ voor alle $x$ in het domein."
                : "(Domein: $x > 0$)",
              `Antwoord: ${b}/x`,
            ],
          };
        }
      }

      case 4: {
        // Rule recognition
        const rules = [
          { q: "x \\cdot \\sin(x)", a: "productregel" },
          { q: "\\frac{e^x}{x}", a: "quotiëntregel" },
          { q: "\\sin(x^2)", a: "kettingregel" },
          { q: "(2x + 1)^5", a: "kettingregel" },
          { q: "\\ln(x) \\cdot \\cos(x)", a: "productregel" },
        ];
        const rule = rules[rand(0, rules.length - 1)]!;
        return {
          id: `deriv-4-${timestamp}`,
          question: rule.q,
          answer: rule.a,
          context: "Welke differentiatieregel heb je hier primair nodig?",
          solutionSteps: [
            `Kijk naar de hoofdvorm van de functie.`,
            `Antwoord: ${rule.a}`,
          ],
        };
      }

      default:
        return DerivEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    const clean = input.toLowerCase().trim();
    if (
      problem.answer === "productregel" ||
      problem.answer === "quotiëntregel" ||
      problem.answer === "kettingregel"
    ) {
      const isMatch = clean === problem.answer;
      return {
        correct: isMatch,
        ...(!isMatch
          ? { feedback: `Hint: Denk aan product-, quotiënt- of kettingregel.` }
          : {}),
      };
    }

    const isCorrect = checkEquivalence(input, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback:
        "Check je afgeleide regels (bijv. constante regel, machtsregel).",
    };
  },
};
