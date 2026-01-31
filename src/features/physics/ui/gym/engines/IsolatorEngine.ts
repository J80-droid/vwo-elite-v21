import "nerdamer/Algebra"; // Importeer algebra module voor symbolic solving
import "nerdamer/Solve";

import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";
import nerdamer from "nerdamer";

// Helper: Kies random item
const pick = <T>(arr: T[]): T => {
  if (arr.length === 0) throw new Error("Cannot pick from empty array");
  return arr[Math.floor(Math.random() * arr.length)] as T;
};

interface FormulaTemplate {
  id: string;
  latex: string; // Weergave: "F = m \cdot a"
  equation: string; // Nerdamer syntax: "F = m * a"
  variables: string[]; // Variabelen die we kunnen isoleren: ["m", "a"]
  context: string; // Fysica context: "Tweede Wet Newton"
}

// DATABASE VAN FORMULES PER LEVEL
const FORMULAS: Record<number, FormulaTemplate[]> = {
  // LEVEL 1: Lineair (x = a * b)
  1: [
    {
      id: "newton2",
      latex: "F = m \\cdot a",
      equation: "F = m * a",
      variables: ["m", "a"],
      context: "2e Wet Newton",
    },
    {
      id: "ohm",
      latex: "U = I \\cdot R",
      equation: "U = I * R",
      variables: ["I", "R"],
      context: "Wet van Ohm",
    },
    {
      id: "velocity",
      latex: "s = v \\cdot t",
      equation: "s = v * t",
      variables: ["v", "t"],
      context: "Eenparige Beweging",
    },
    {
      id: "density",
      latex: "\\rho = \\frac{m}{V}",
      equation: "rho = m / V",
      variables: ["m", "V"],
      context: "Dichtheid",
    },
  ],
  // LEVEL 2: Kwadraten (x = a * b^2)
  2: [
    {
      id: "power_el",
      latex: "P = I^2 \\cdot R",
      equation: "P = I^2 * R",
      variables: ["I", "R"],
      context: "Elektrisch Vermogen",
    },
    {
      id: "circle_area",
      latex: "A = \\pi \\cdot r^2",
      equation: "A = pi * r^2",
      variables: ["r"],
      context: "Oppervlakte Cirkel",
    },
    {
      id: "fall_dist",
      latex: "s = \\frac{1}{2} g t^2",
      equation: "s = 0.5 * g * t^2",
      variables: ["g", "t"],
      context: "Vrije Val",
    },
  ],
  // LEVEL 3: Wortels & Breuken
  3: [
    {
      id: "kinetic",
      latex: "E_k = \\frac{1}{2} m v^2",
      equation: "Ek = 0.5 * m * v^2",
      variables: ["m", "v"],
      context: "Kinetische Energie",
    },
    {
      id: "period_spring",
      latex: "T = 2\\pi \\sqrt{\\frac{m}{C}}",
      equation: "T = 2 * pi * sqrt(m / C)",
      variables: ["m", "C"],
      context: "Massa-Veersysteem",
    },
    {
      id: "freq_wave",
      latex: "v = f \\cdot \\lambda",
      equation: "v = f * lambda",
      variables: ["f", "lambda"],
      context: "Golfsnelheid",
    },
  ],
  // LEVEL 4: Complexe Breuken & Inverse
  4: [
    {
      id: "gravity",
      latex: "F_g = G \\frac{m M}{r^2}",
      equation: "Fg = G * (m * M) / r^2",
      variables: ["r", "M"],
      context: "Gravitatiewet",
    },
    {
      id: "lens",
      latex: "\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{b}",
      equation: "1/f = 1/v + 1/b",
      variables: ["f", "v", "b"],
      context: "Lenzenformule",
    },
    {
      id: "ideal_gas",
      latex: "\\frac{p V}{T} = n R",
      equation: "(p * V) / T = n * R",
      variables: ["T", "V", "n"],
      context: "Ideale Gaswet",
    },
  ],
  // LEVEL 5: Elite Manipulatie
  5: [
    {
      id: "doppler",
      latex: "f_w = f_b \\frac{v}{v - v_b}",
      equation: "fw = fb * (v / (v - vb))",
      variables: ["vb", "v"],
      context: "Dopplereffect",
    },
    {
      id: "escape",
      latex: "v_{ont} = \\sqrt{\\frac{2GM}{r}}",
      equation: "v = sqrt((2*G*M)/r)",
      variables: ["r", "M"],
      context: "Ontsnappingssnelheid",
    },
    {
      id: "quantum_energy",
      latex: "E_n = -\\frac{13.6}{n^2}",
      equation: "En = -13.6 / n^2",
      variables: ["n"],
      context: "Bohr Model",
    },
  ],
};

export const IsolatorEngine: GymEngine = {
  id: "isolator",
  name: "Isolator",
  description: "Formules ombouwen en variabelen isoleren.",
  generate: (level: Difficulty): GymProblem => {
    // Fallback naar level 1 als level leeg is (safety)
    const templates = FORMULAS[level as number] || FORMULAS[1]!;
    const tmpl = pick(templates);

    // Kies een variabele om te isoleren (Target)
    const targetVar = pick(tmpl.variables);

    // Symbolisch oplossen voor het antwoord (Ground Truth)
    let correctAnswer = "";
    let texAnswer = "";
    try {
      const sol = nerdamer.solve(tmpl.equation, targetVar);
      const solStr = sol.toString();

      // Clean up array brackets if present
      let firstSol = solStr;
      if (solStr.startsWith("[") && solStr.endsWith("]")) {
        firstSol = solStr.slice(1, -1).split(",")[0].trim();
      }

      correctAnswer = firstSol;
      // Convert to TeX for beautiful display
      texAnswer = firstSol ? nerdamer(firstSol).toTeX() : "";
    } catch (error) {
      console.error(error);
      correctAnswer = "error";
      texAnswer = "error";
    }

    return {
      id: `iso-${tmpl.id}-${targetVar}`,
      question: `Isoleer **${targetVar}** uit de formule:\n\n$$${tmpl.latex}$$`,
      context: `${tmpl.context} (Level ${level})`,
      answer: correctAnswer,
      displayAnswer: `${targetVar} = ${texAnswer}`,
      solutionSteps: [
        `Startformule: $$${tmpl.latex}$$`,
        `Doel: Zorg dat $$${targetVar}$$ alleen staat.`,
        `Wiskundige operatie: Los op voor ${targetVar}.`,
        `Antwoord: $$${targetVar} = ${texAnswer}$$`,
      ],
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    if (!input.trim()) return { correct: false, feedback: "Voer iets in" };

    try {
      // Stap 1: Normaliseer input
      // Leerlingen gebruiken vaak ^ voor macht, dat snapt nerdamer.
      // Wortel: 'sqrt()' of 'wortel()' -> replace
      const cleanInput = input
        .replace(/wortel/gi, "sqrt") // case insensitive replace voor het woord wortel
        .replace(/√/g, "sqrt")
        .replace(/cdot/g, "*") // vangt LaTeX users af
        .replace(/:/g, "/"); // vangt 'gedeeld door' dubbele punt af

      // Stap 2: Symbolische Vergelijking
      // We trekken het antwoord van de user af van het correcte antwoord.
      // Als (UserAnswer - CorrectAnswer) == 0, dan zijn ze gelijk.

      const diff = nerdamer(`${cleanInput} - (${problem.answer})`);
      const simplified = diff.simplify().toString();

      if (simplified === "0") {
        return { correct: true, feedback: "Perfect geïsoleerd!" };
      }

      return {
        correct: false,
        feedback: "Wiskundig niet equivalent. Check je haakjes en volgorde.",
      };
    } catch {
      return {
        correct: false,
        feedback: "Syntaxfout. Gebruik haakjes (), *, /, ^ en sqrt()",
      };
    }
  },
};
