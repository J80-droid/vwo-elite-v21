import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const FormulaEngine: GymEngine = {
  id: "formulas",
  name: "The Formula Factory",
  description: "Automatiseer goniometrische en algebraïsche identiteiten.",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();

    switch (level) {
      case 1: {
        // Standard Sin/Cos 2x
        if (Math.random() > 0.5) {
          return {
            id: `form-1-${timestamp}`,
            question: `$$\\sin(2x)$$`,
            answer: `2*sin(x)*cos(x)`,
            displayAnswer: `2\\sin(x)\\cos(x)`,
            context: "Schrijf om naar een vorm zonder 2x",
            solutionSteps: [
              `Verdubbelingsformule: $$\\sin(2A) = 2\\sin(A)\\cos(A)$$.`,
              `Antwoord: $$2\\sin(x)\\cos(x)$$`,
            ],
          };
        } else {
          return {
            id: `form-1b-${timestamp}`,
            question: `$$\\cos^2(x) + \\sin^2(x)$$`,
            answer: `1`,
            displayAnswer: `1`,
            context: "Vereenvoudig tot een getal",
            solutionSteps: [
              `De grondformule van de goniometrie: $$\\cos^2(A) + \\sin^2(A) = 1$$.`,
              `Antwoord: $1$`,
            ],
          };
        }
      }

      case 2: {
        // Cos 2x variants
        const cos2xVars = [
          { a: `cos^2(x) - sin^2(x)`, hint: "Standaard vorm" },
          { a: `2*cos^2(x) - 1`, hint: "Vorm met alleen cosinus" },
          { a: `1 - 2*sin^2(x)`, hint: "Vorm met alleen sinus" },
        ];
        const variant = cos2xVars[rand(0, 2)]!;
        return {
          id: `form-2-${timestamp}`,
          question: `$$\\cos(2x)$$`,
          answer: variant.a,
          displayAnswer: variant.a
            .replace(/\*/g, "")
            .replace(/cos\^2\(x\)/g, "\\cos^2(x)")
            .replace(/sin\^2\(x\)/g, "\\sin^2(x)"),
          context: `Schrijf om (${variant.hint})`,
          solutionSteps: [
            `Verdubbelingsformule voor cosinus heeft drie vormen.`,
            `Gevraagd: ${variant.hint}`,
            `Antwoord: $${variant.a.replace(/\*/g, "")}$`,
          ],
        };
      }

      case 3: {
        // Pattern recognition: Square terms
        if (Math.random() > 0.5) {
          return {
            id: `form-3-${timestamp}`,
            question: `$$1 - \\sin^2(x)$$`,
            answer: `cos^2(x)`,
            displayAnswer: `\\cos^2(x)`,
            context: "Vereenvoudig",
            solutionSteps: [
              `Uit $$\\sin^2(x) + \\cos^2(x) = 1$$ volgt dat $$1 - \\sin^2(x) = \\cos^2(x)$$.`,
              `Antwoord: $$\\cos^2(x)$$`,
            ],
          };
        } else {
          return {
            id: `form-3b-${timestamp}`,
            question: `$$\\sin(x)\\cos(x)$$`,
            answer: `0.5*sin(2x)`,
            displayAnswer: `\\frac{1}{2}\\sin(2x)`,
            context: "Schrijf om met de sinus-verdubbelingsformule",
            solutionSteps: [
              `$$\\sin(2x) = 2\\sin(x)\\cos(x)$$`,
              `Dus $$\\sin(x)\\cos(x) = \\frac{1}{2}\\sin(2x)$$.`,
              `Antwoord: $$0,5\\sin(2x)$$`,
            ],
          };
        }
      }

      case 4: {
        // Algebraic identities (Difference of squares etc.)
        const algs = [
          { q: `x^2 - 16`, a: `(x-4)(x+4)`, c: "Ontbind in factoren" },
          { q: `(x+3)^2`, a: `x^2 + 6x + 9`, c: "Werk haakjes uit" },
          { q: `x^2 + 8x + 16`, a: `(x+4)^2`, c: "Schrijf als kwadraat" },
        ];
        const alg = algs[rand(0, algs.length - 1)]!;
        return {
          id: `form-4-${timestamp}`,
          question: `$$${alg.q}$$`,
          answer: alg.a,
          context: alg.c,
          solutionSteps: [
            `Gebruik de merkwaardige producten.`,
            `Antwoord: $$${alg.a}$$`,
          ],
        };
      }

      default:
        return FormulaEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    // For Gonio, equivalence check is essential as there are many forms
    const isCorrect = checkEquivalence(input, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback: "Niet equivalent. Check je gonio-formules of rekenregels.",
    };
  },
};
