import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const LimitEngine: GymEngine = {
  id: "limits",
  name: "Limieten Launch",
  description: "Jaag op asymptoten en bedwing het oneindige.",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();
    const a = rand(1, 9);
    const b = rand(1, 9);

    switch (level) {
      case 1: {
        // Standard infinity limits (1/x^n)
        const n = rand(1, 3);
        return {
          id: `lim-1-${timestamp}`,
          question: `$$\\lim_{x \\to \\infty} \\frac{${a}}{x^{${n}}}$$`,
          answer: "0",
          displayAnswer: "0",
          context: "Bereken de limiet",
          solutionSteps: [
            `Wanneer $x$ naar oneindig gaat, wordt de noemer $x^{${n}}$ extreem groot.`,
            `Een constante gedeeld door een oneindig groot getal nadert naar $0$.`,
            `Antwoord: $0$`,
          ],
        };
      }

      case 2: {
        // Dominant terms (Rational functions)
        const n = rand(1, 3);
        const a2 = rand(2, 5);
        const b2 = rand(2, 5);
        return {
          id: `lim-2-${timestamp}`,
          question: `$$\\lim_{x \\to \\infty} \\frac{${a2}x^{${n}} + ${a}}{${b2}x^{${n}} - ${b}}$$`,
          answer: `${a2}/${b2}`,
          displayAnswer: `\\frac{${a2}}{${b2}}`,
          context: "Bereken de limiet",
          solutionSteps: [
            `Kijk naar de hoogste machten in de teller en noemer (dominante termen).`,
            `Teller: $${a2}x^{${n}}$, Noemer: $${b2}x^{${n}}$.`,
            `De limiet is de verhouding van de coëfficiënten: $${a2}/${b2}$.`,
            `Antwoord: $$\\frac{${a2}}{${b2}}$$`,
          ],
        };
      }

      case 3: {
        // Vertical asymptotes (Poles)
        const pole = rand(1, 5);
        return {
          id: `lim-3-${timestamp}`,
          question: `$$f(x) = \\frac{1}{x - ${pole}}$$`,
          answer: `${pole}`,
          displayAnswer: `x = ${pole}`,
          context: "Bij welke x-waarde bevindt zich de verticale asymptoot?",
          solutionSteps: [
            `Een verticale asymptoot treedt op waar de noemer $0$ is (en de teller niet).`,
            `$x - ${pole} = 0 \\implies x = ${pole}$.`,
            `Antwoord: $${pole}$`,
          ],
        };
      }

      case 4: {
        // Removable discontinuities (Holes)
        const hole = rand(1, 4);
        // (x-hole)(x+rand) / (x-hole)
        const other = rand(1, 5);
        return {
          id: `lim-4-${timestamp}`,
          question: `$$f(x) = \\frac{(x - ${hole})(x + ${other})}{x - ${hole}}$$`,
          answer: `${hole}`,
          displayAnswer: `x = ${hole}`,
          context: "Bij welke x-waarde bevindt zich een perforatie (gat)?",
          solutionSteps: [
            `Een perforatie treedt op als zowel de teller als de noemer $0$ worden voor dezelfde $x$.`,
            `De factor $(x - ${hole})$ komt in beiden voor.`,
            `Antwoord: $${hole}$`,
          ],
        };
      }

      default:
        return LimitEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    const clean = input
      .toLowerCase()
      .replace(/x ?= ?/, "")
      .trim();
    const isCorrect = checkEquivalence(clean, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback: "Denk aan dominante termen of waar de noemer nul wordt.",
    };
  },
};
