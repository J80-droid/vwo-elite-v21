import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const DomainEngine: GymEngine = {
  id: "domain",
  name: "Domain Defender",
  description: "Bewaak de grenzen van functies. Wat mag er wel en niet in?",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();
    const a = rand(2, 9);
    const b = rand(2, 9);

    switch (level) {
      case 1: {
        // sqrt(f(x)) -> f(x) >= 0
        return {
          id: `dom-1-${timestamp}`,
          question: `f(x) = \\sqrt{x - ${a}}`,
          answer: `x >= ${a}`,
          displayAnswer: `x \\ge ${a}`,
          context: "Wat is de domein-eis?",
          solutionSteps: [
            `De uitdrukking onder een wortel moet groter dan of gelijk aan 0 zijn.`,
            `x - ${a} \\ge 0 \\implies x \\ge ${a}.`,
            `Antwoord: x \\ge ${a}`,
          ],
        };
      }

      case 2: {
        // ln(f(x)) -> f(x) > 0
        return {
          id: `dom-2-${timestamp}`,
          question: `f(x) = \\ln(${a} - x)`,
          answer: `x < ${a}`,
          displayAnswer: `x < ${a}`,
          context: "Wat is de domein-eis?",
          solutionSteps: [
            `Het argument van een logaritme moet strikt groter dan 0 zijn.`,
            `${a} - x > 0 \\implies x < ${a}.`,
            `Antwoord: x < ${a}`,
          ],
        };
      }

      case 3: {
        // 1/f(x) -> f(x) != 0
        const b2 = b * b;
        return {
          id: `dom-3-${timestamp}`,
          question: `f(x) = \\frac{1}{x^2 - ${b2}}`,
          answer: `x != ${b} or x != -${b}`,
          displayAnswer: `x \\ne ${b} \\land x \\ne -${b}`,
          context: "Welke x-waarden zijn uitgesloten van het domein?",
          solutionSteps: [
            `De noemer mag nooit gelijk aan 0 zijn.`,
            `x^2 - ${b2} = 0 \\implies x^2 = ${b2} \\implies x = ${b} \\text{ of } x = -${b}.`,
            `Antwoord: x \\ne ${b} \\land x \\ne -${b}`,
          ],
        };
      }

      case 4: {
        // Combined constraints
        return {
          id: `dom-4-${timestamp}`,
          question: `f(x) = \\frac{\\ln(x)}{\\sqrt{${a} - x}}`,
          answer: `x > 0 and x < ${a}`,
          displayAnswer: `0 < x < ${a}`,
          context: "Wat is het domein van deze functie?",
          solutionSteps: [
            `Eis 1 (logaritme): x > 0.`,
            `Eis 2 (wortel in noemer): ${a} - x > 0 \\implies x < ${a}.`,
            `Combineer: 0 < x < ${a}.`,
            `Antwoord: 0 < x < ${a}`,
          ],
        };
      }

      default:
        return DomainEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    const clean = input
      .toLowerCase()
      .replace(/\\le/g, "<=")
      .replace(/\\ge/g, ">=")
      .replace(/\\ne/g, "!=")
      .replace(/\\land/g, "and")
      .trim();

    // This engine requires more flexible check for and/or and inequalities
    // Standard checkEquivalence might handle some, but we add custom simple match for common forms
    const isCorrect = checkEquivalence(clean, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback:
        "Denk aan de eisen voor wortels (>=0), logaritmen (>0) en noemers (!=0).",
    };
  },
};
