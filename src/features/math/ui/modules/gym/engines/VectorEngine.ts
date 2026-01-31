import { all, create } from "mathjs";

import { Difficulty, GymEngine, GymProblem } from "../types";

const math = create(all!);

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const VectorEngine: GymEngine = {
  id: "vectors",
  name: "Vector Velocity",
  description: "Train vectorbewerkingen en meetkundig inzicht.",

  generate: async (level: Difficulty): Promise<GymProblem> => {
    const timestamp = Date.now();

    switch (level) {
      case 1: {
        // Vector addition
        const x1 = rand(-5, 5);
        const y1 = rand(-5, 5);
        const x2 = rand(-5, 5);
        const y2 = rand(-5, 5);
        return {
          id: `vec-1-${timestamp}`,
          question: `$$\\binom{${x1}}{${y1}} + \\binom{${x2}}{${y2}}$$`,
          answer: `[${x1 + x2}, ${y1 + y2}]`,
          displayAnswer: `\\binom{${x1 + x2}}{${y1 + y2}}`,
          context: "Bereken de somvector",
          solutionSteps: [
            `Tel de x-componenten op: $${x1} + ${x2} = ${x1 + x2}$`,
            `Tel de y-componenten op: $${y1} + ${y2} = ${y1 + y2}$`,
            `Antwoord: $$\\binom{${x1 + x2}}{${y1 + y2}}$$`,
          ],
          explanation: "Bij het optellen van vectoren tel je de overeenkomstige componenten (x bij x, y bij y) onafhankelijk van elkaar op. Je verplaatst de tweede vector naar het eindpunt van de eerste."
        };
      }

      case 2: {
        // Inner product
        const x1 = rand(-5, 5);
        const y1 = rand(-5, 5);
        const x2 = rand(-5, 5);
        const y2 = rand(-5, 5);
        const dot = x1 * x2 + y1 * y2;
        return {
          id: `vec-2-${timestamp}`,
          question: `$$\\binom{${x1}}{${y1}} \\cdot \\binom{${x2}}{${y2}}$$`,
          answer: `${dot}`,
          displayAnswer: `${dot}`,
          context: "Bereken het inproduct",
          solutionSteps: [
            `Inproduct: $x_1 \\cdot x_2 + y_1 \\cdot y_2$`,
            `$${x1} \\cdot ${x2} + ${y1} \\cdot ${y2} = ${dot}$`,
            `Antwoord: $${dot}$`,
          ],
          explanation: "Het inproduct (ook wel dot-product genoemd) is een scalar: je krijgt een getal als uitkomst. Het wordt berekend door de som van de producten van de componenten."
        };
      }

      case 3: // Orthogonality check
        if (Math.random() > 0.5) {
          const x = rand(1, 5);
          const y = rand(1, 5);
          return {
            id: `vec-3-${timestamp}`,
            question: `Staan $$\\binom{${x}}{${y}}$$ en $$\\binom{${-y}}{${x}}$$ loodrecht?`,
            answer: `ja`,
            context: "Ja of Nee?",
            solutionSteps: [
              `Twee vectoren staan loodrecht als hun inproduct $0$ is.`,
              `$${x} \\cdot (${-y}) + ${y} \\cdot ${x} = ${-x * y} + ${x * y} = 0$.`,
              `Antwoord: Ja`,
            ],
            explanation: "Vectoren staan orthogonaal (loodrecht) op elkaar als hun inproduct precies $0$ is. De hoek tussen de vectoren is dan $90^\\circ$."
          };
        } else {
          const x = rand(1, 4);
          const y = rand(1, 4);
          return {
            id: `vec-3b-${timestamp}`,
            question: `Staan $$\\binom{${x}}{${y}}$$ en $$\\binom{${x}}{${y}}$$ loodrecht?`,
            answer: `nee`,
            context: "Ja of Nee?",
            solutionSteps: [
              `Inproduct: ${x} \\cdot ${x} + ${y} \\cdot ${y} = ${x * x + y * y}.`,
              `Dit is niet gelijk aan 0.`,
              `Antwoord: Nee`,
            ],
          };
        }

      case 4: {
        // Magnitude (Length)
        // Use pythagorean triples for nice answers
        const triples: [number, number, number][] = [
          [3, 4, 5],
          [5, 12, 13],
          [6, 8, 10],
          [8, 15, 17],
        ];
        const triple = triples[rand(0, triples.length - 1)];
        if (!triple) return await VectorEngine.generate(1);
        const [a, b, c] = triple;
        const x = Math.random() > 0.5 ? a : -a;
        const y = Math.random() > 0.5 ? b : -b;
        return {
          id: `vec-4-${timestamp}`,
          question: `$$\\left| \\binom{${x}}{${y}} \\right|$$`,
          answer: `${c}`,
          displayAnswer: `${c}`,
          context: "Bereken de lengte van de vector",
          solutionSteps: [
            `Lengte: $$\\sqrt{x^2 + y^2}$$`,
            `$$\\sqrt{(${x})^2 + (${y})^2} = \\sqrt{${x * x} + ${y * y}} = \\sqrt{${c * c}} = ${c}$$`,
            `Antwoord: $${c}$`,
          ],
          explanation: "De lengte (magnitude) van een vector wordt berekend met de stelling van Pythagoras. Je neemt de wortel uit de som van de kwadraten van de componenten."
        };
      }

      case 5: {
        // Scalar multiplication & Subtraction mix
        const k = rand(2, 4);
        const x1 = rand(-3, 3);
        const y1 = rand(-3, 3);
        const x2 = rand(-3, 3);
        const y2 = rand(-3, 3);
        const rx = k * x1 - x2;
        const ry = k * y1 - y2;

        return {
          id: `vec-5-${timestamp}`,
          question: `$$${k} \\cdot \\binom{${x1}}{${y1}} - \\binom{${x2}}{${y2}}$$`,
          answer: `[${rx}, ${ry}]`,
          displayAnswer: `\\binom{${rx}}{${ry}}`,
          context: "Lineaire combinatie",
          solutionSteps: [
            `Vermenigvuldig eerst de eerste vector met $${k}$: $$\\binom{${k * x1}}{${k * y1}}$$`,
            `Trek daar de tweede vector van af: $$\\binom{${k * x1} - ${x2}}{${k * y1} - ${y2}}$$`,
            `Antwoord: $$\\binom{${rx}}{${ry}}$$`,
          ],
        };
      }

      default:
        return await VectorEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    let clean = input.toLowerCase().trim();

    // Handle Ja/Nee specifically
    if (problem.answer === "ja" || problem.answer === "nee") {
      const isMatch = clean === problem.answer;
      return {
        correct: isMatch,
        ...(!isMatch
          ? { feedback: `Hint: Bereken het inproduct. Is het 0?` }
          : {}),
      };
    }

    const isExpectedVector = problem.answer.includes("[");

    // 1. Pre-process input for vectors
    if (isExpectedVector) {
      // If user forgot brackets but used commas, add them
      if (!clean.includes("[") && !clean.includes("(") && clean.includes(",")) {
        clean = `[${clean}]`;
      }
      // Replace () with [] for mathjs
      clean = clean.replace(/\(/g, "[").replace(/\)/g, "]");
    } else {
      // If scalar expected but user wrapped in brackets/parens, strip them
      if (
        (clean.startsWith("(") && clean.endsWith(")")) ||
        (clean.startsWith("[") && clean.endsWith("]"))
      ) {
        clean = clean.slice(1, -1).trim();
      }
    }

    try {
      const formattedAnswer = problem.answer
        .replace(/\(/g, "[")
        .replace(/\)/g, "]");

      const inputVal = math.evaluate(clean);
      const answerVal = math.evaluate(formattedAnswer);

      // Deep equal for structures
      if (math.deepEqual(inputVal, answerVal)) {
        return { correct: true };
      }
    } catch {
      // Silent fallthrough to generic check
    }

    // fallback for scalar expressions if not already caught
    if (!isExpectedVector) {
      try {
        const isCorrect = math.evaluate(`(${clean}) == (${problem.answer})`);
        if (isCorrect === true) return { correct: true };
      } catch {
        // Ignore evaluation errors
      }
    }

    return {
      correct: false,
      feedback: "Niet correct. Check je berekening.",
    };
  },
};
