import { checkEquivalence } from "@shared/lib/MathValidator";

import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const TRIG_VALUES = [
  { deg: 0, rad: "0", sin: "0", cos: "1" },
  {
    deg: 30,
    rad: "\\frac{1}{6}\\pi",
    sin: "\\frac{1}{2}",
    cos: "\\frac{1}{2}\\sqrt{3}",
  },
  {
    deg: 45,
    rad: "\\frac{1}{4}\\pi",
    sin: "\\frac{1}{2}\\sqrt{2}",
    cos: "\\frac{1}{2}\\sqrt{2}",
  },
  {
    deg: 60,
    rad: "\\frac{1}{3}\\pi",
    sin: "\\frac{1}{2}\\sqrt{3}",
    cos: "\\frac{1}{2}",
  },
  { deg: 90, rad: "\\frac{1}{2}\\pi", sin: "1", cos: "0" },
  {
    deg: 120,
    rad: "\\frac{2}{3}\\pi",
    sin: "\\frac{1}{2}\\sqrt{3}",
    cos: "-\\frac{1}{2}",
  },
  {
    deg: 135,
    rad: "\\frac{3}{4}\\pi",
    sin: "\\frac{1}{2}\\sqrt{2}",
    cos: "-\\frac{1}{2}\\sqrt{2}",
  },
  {
    deg: 150,
    rad: "\\frac{5}{6}\\pi",
    sin: "\\frac{1}{2}",
    cos: "-\\frac{1}{2}\\sqrt{3}",
  },
  { deg: 180, rad: "\\pi", sin: "0", cos: "-1" },
  {
    deg: 210,
    rad: "\\frac{7}{6}\\pi",
    sin: "-\\frac{1}{2}",
    cos: "-\\frac{1}{2}\\sqrt{3}",
  },
  {
    deg: 225,
    rad: "\\frac{5}{4}\\pi",
    sin: "-\\frac{1}{2}\\sqrt{2}",
    cos: "-\\frac{1}{2}\\sqrt{2}",
  },
  {
    deg: 240,
    rad: "\\frac{4}{3}\\pi",
    sin: "-\\frac{1}{2}\\sqrt{3}",
    cos: "-\\frac{1}{2}",
  },
  { deg: 270, rad: "\\frac{1}{2}\\pi", sin: "-1", cos: "0" },
  {
    deg: 300,
    rad: "\\frac{5}{3}\\pi",
    sin: "-\\frac{1}{2}\\sqrt{3}",
    cos: "\\frac{1}{2}",
  },
  {
    deg: 315,
    rad: "\\frac{7}{4}\\pi",
    sin: "-\\frac{1}{2}\\sqrt{2}",
    cos: "\\frac{1}{2}\\sqrt{2}",
  },
  {
    deg: 330,
    rad: "\\frac{11}{6}\\pi",
    sin: "-\\frac{1}{2}",
    cos: "\\frac{1}{2}\\sqrt{3}",
  },
];

export const TrigEngine: GymEngine = {
  id: "trig",
  name: "The Unit Circle Sprint",
  description: "Train je parate kennis van de eenheidscirkel.",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();

    switch (level) {
      case 1: {
        // First quadrant values
        const idx = rand(0, 4);
        const val = TRIG_VALUES[idx];
        if (!val) return TrigEngine.generate(1);
        const isSin = Math.random() > 0.5;
        return {
          id: `trig-1-${timestamp}`,
          question: isSin ? `\\sin(${val.rad})` : `\\cos(${val.rad})`,
          answer: isSin ? val.sin : val.cos,
          context: "Geef de exacte waarde",
          solutionSteps: [
            `Kijk in de eenheidscirkel bij hoek ${val.rad}.`,
            `De ${isSin ? "y-coördinaat (sinus)" : "x-coördinaat (cosinus)"} is ${isSin ? val.sin : val.cos}.`,
          ],
        };
      }

      case 2: {
        // All quadrants
        const idx = rand(0, TRIG_VALUES.length - 1);
        const val = TRIG_VALUES[idx];
        if (!val) return TrigEngine.generate(1);
        const isSin = Math.random() > 0.5;
        return {
          id: `trig-2-${timestamp}`,
          question: isSin ? `\\sin(${val.rad})` : `\\cos(${val.rad})`,
          answer: isSin ? val.sin : val.cos,
          context: "Geef de exacte waarde",
          solutionSteps: [
            `Bepaal het kwadrant van ${val.rad} (${val.deg}°).`,
            `De ${isSin ? "sinus" : "cosinus"} is ${isSin ? val.sin : val.cos}.`,
          ],
        };
      }

      case 3: {
        // Radian conversion
        if (Math.random() > 0.5) {
          const idx = rand(1, TRIG_VALUES.length - 1);
          const val = TRIG_VALUES[idx];
          if (!val) return TrigEngine.generate(1);
          return {
            id: `trig-3-${timestamp}`,
            question: `${val.deg}^\\circ`,
            answer: val.rad,
            context: "Reken om naar radialen",
            solutionSteps: [
              `Omrekenen: hoek / 180 * \\pi.`,
              `${val.deg} / 180 = ${val.rad.replace("\\frac{", "").replace("}{", "/").replace("}\\pi", "")}`,
              `Antwoord: ${val.rad}`,
            ],
          };
        } else {
          const idx = rand(1, TRIG_VALUES.length - 1);
          const val = TRIG_VALUES[idx];
          if (!val) return TrigEngine.generate(1);
          return {
            id: `trig-3b-${timestamp}`,
            question: val.rad,
            answer: `${val.deg}`,
            context: "Reken om naar graden",
            solutionSteps: [
              `Vervang \\pi door 180 graden.`,
              `Lijn ${val.rad} komt overeen met ${val.deg} graden.`,
            ],
          };
        }
      }

      case 4: {
        // Inverse trig (Solve x)
        const idx = rand(0, 8); // Stick to 0-180 for simpler inverse context
        const val = TRIG_VALUES[idx];
        if (!val) return TrigEngine.generate(1);
        const isSin = Math.random() > 0.5;
        return {
          id: `trig-4-${timestamp}`,
          question: `${isSin ? "\\sin(x)" : "\\cos(x)"} = ${isSin ? val.sin : val.cos}`,
          answer: val.rad,
          context: `Wat is x op [0, \\pi]?`,
          solutionSteps: [
            `Zoek de hoek in de eenheidscirkel waarbij de ${isSin ? "sinus" : "cosinus"} gelijk is aan ${isSin ? val.sin : val.cos}.`,
            `Antwoord: ${val.rad}`,
          ],
        };
      }

      default:
        return TrigEngine.generate(1);
    }
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    // Trig answers often involve fractions of pi or roots
    // MathValidator handles checkEquivalence with symbolic and numeric evaluation
    const isCorrect = checkEquivalence(input, problem.answer);

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback:
        "Niet correct. Denk aan de eenheidscirkel en de tekens in de verschillende kwadranten.",
    };
  },
};
