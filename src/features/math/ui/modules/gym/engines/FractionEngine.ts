import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const vars = ["x", "y", "a", "b", "p", "q"];

export const FractionEngine: GymEngine = {
  id: "fractions",
  name: "De Breukenbreker",
  description: "Train algebraïsche manipulatie en breuksplitsing.",

  generate: (level: Difficulty): GymProblem => {
    const v1 = vars[rand(0, 2)];
    const v2 = vars[rand(3, 5)];
    const n1 = rand(2, 9);
    const n2 = rand(2, 9);
    const timestamp = Date.now();

    switch (level) {
      case 1: // Basis: Numeriek / Simpel
        // Vraag: a/n + b/n
        if (Math.random() > 0.5) {
          return {
            id: `frac-1-${timestamp}`,
            question: `$$\\frac{${n1}}{${v1}} + \\frac{${n2}}{${v1}}$$`,
            answer: `(${n1}+${n2})/${v1}`,
            displayAnswer: `$$\\frac{${n1 + n2}}{${v1}}$$`,
            context: "Tel op (gelijke noemers)",
            solutionSteps: [
              `De noemers zijn gelijk: beide $${v1}$`,
              `Tel alleen de tellers op: $${n1} + ${n2} = ${n1 + n2}$`,
              `Antwoord: $$\\frac{${n1 + n2}}{${v1}}$$`,
            ],
          };
        } else {
          const gcd = (a: number, b: number): number =>
            b === 0 ? a : gcd(b, a % b);
          const sum = n1 + n2;
          const prod = n1 * n2;
          const g = gcd(sum, prod);
          return {
            id: `frac-1b-${timestamp}`,
            question: `$$\\frac{1}{${n1}} + \\frac{1}{${n2}}$$`,
            answer: `${sum / g}/${prod / g}`,
            displayAnswer: `$$\\frac{${sum / g}}{${prod / g}}$$`,
            context: "Maak gelijknamig (getallen)",
            solutionSteps: [
              `Maak de noemers gelijk: $KGV(${n1}, ${n2}) = ${prod}$`,
              `$$\\frac{1}{${n1}} = \\frac{${n2}}{${prod}}$$ en $$\\frac{1}{${n2}} = \\frac{${n1}}{${prod}}$$`,
              `Tel de tellers op: $${n1} + ${n2} = ${sum}$`,
              g > 1
                ? `Vereenvoudig: $$\\frac{${sum}}{${prod}} = \\frac{${sum / g}}{${prod / g}}$$`
                : `Antwoord: $$\\frac{${sum}}{${prod}}$$`,
            ],
          };
        }

      case 2: // Algebraïsch: Gelijknamig maken
        // Vraag: 1/x + 2/y
        return {
          id: `frac-2-${timestamp}`,
          question: `$$\\frac{1}{${v1}} + \\frac{2}{${v2}}$$`,
          answer: `(${v2} + 2*${v1}) / (${v1}*${v2})`,
          displayAnswer: `$$\\frac{${v2} + 2${v1}}{${v1}${v2}}$$`,
          context: "Schrijf als één breuk",
          misconceptions: {
            [`3/(${v1}+${v2})`]:
              "Je mag tellers en noemers niet zomaar optellen!",
          },
          solutionSteps: [
            `Gemeenschappelijke noemer: $${v1} \\cdot ${v2}$`,
            `$$\\frac{1}{${v1}} = \\frac{${v2}}{${v1}${v2}}$$ en $$\\frac{2}{${v2}} = \\frac{2${v1}}{${v1}${v2}}$$`,
            `Tel op: $$\\frac{${v2} + 2${v1}}{${v1}${v2}}$$`,
          ],
        };

      case 3: // Algebraïsch: Breuksplitsen
        // Vraag: (x + y) / xy
        return {
          id: `frac-3-${timestamp}`,
          question: `$$\\frac{${v1} + ${v2}}{${v1}${v2}}$$`,
          answer: `1/${v2} + 1/${v1}`,
          displayAnswer: `$$\\frac{1}{${v2}} + \\frac{1}{${v1}}$$`,
          context: "Splits in twee losse breuken",
          misconceptions: {
            [`${v1}/${v1}${v2} + ${v2}/${v1}${v2}`]:
              "Goed, maar vereenvoudig nu verder!",
          },
          solutionSteps: [
            `Splits de teller: $$\\frac{${v1}}{${v1}${v2}} + \\frac{${v2}}{${v1}${v2}}$$`,
            `Vereenvoudig elk deel: $$\\frac{1}{${v2}} + \\frac{1}{${v1}}$$`,
          ],
        };

      case 4: // Complex: Kwadratische noemers / Factoren
        // Vraag: 1/(x-1) + 1/(x+1)
        return {
          id: `frac-4-${timestamp}`,
          question: `$$\\frac{1}{${v1}-1} + \\frac{1}{${v1}+1}$$`,
          answer: `2*${v1}/(${v1}^2-1)`,
          displayAnswer: `$$\\frac{2${v1}}{${v1}^2-1}$$`,
          context: "Breng onder één noemer",
          solutionSteps: [
            `Gemeenschappelijke noemer: $(${v1}-1)(${v1}+1) = ${v1}^2 - 1$`,
            `$$\\frac{${v1}+1}{${v1}^2-1} + \\frac{${v1}-1}{${v1}^2-1}$$`,
            `Tel tellers op: $(${v1}+1) + (${v1}-1) = 2${v1}$`,
            `Antwoord: $$\\frac{2${v1}}{${v1}^2-1}$$`,
          ],
        };

      default:
        return FractionEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    const cleanInputForLookup = input.replace(/\s+/g, "");
    if (problem.misconceptions && problem.misconceptions[cleanInputForLookup]) {
      return {
        correct: false,
        feedback: problem.misconceptions[cleanInputForLookup],
      };
    }

    const isCorrect = checkEquivalence(input, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback: "Niet wiskundig equivalent. Check je haakjes en tekens.",
    };
  },
};
