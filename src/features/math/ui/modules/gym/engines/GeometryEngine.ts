import { Difficulty, GymEngine, GymProblem } from "../types";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const GeometryEngine: GymEngine = {
  id: "geometry",
  name: "Geometry Recall",
  description:
    "Stamp de stellingen en eigenschappen van Domein E in je geheugen.",

  generate: (level: Difficulty): GymProblem => {
    const timestamp = Date.now();

    const THEOREMS_LVL1 = [
      {
        q: "Wanneer geldt de stelling van Thales?",
        a: "middellijn",
        hint: "Als de zijde de ... van de cirkel is.",
        steps: [
          "Eén zijde van de driehoek is de middellijn van de omgeschreven cirkel.",
          "De overstaande hoek is dan 90 graden.",
        ],
      },
      {
        q: "Wat is de eigenschap van een raaklijn aan een cirkel?",
        a: "loodrecht",
        hint: "Hoek met de straal.",
        steps: ["De raaklijn staat loodrecht op de straal naar het raakpunt."],
      },
      {
        q: "Wat is de som van de hoeken in een driehoek?",
        a: "180",
        hint: "Totaal aantal graden.",
        steps: ["De som van de hoeken in elke driehoek is 180 graden."],
      },
    ];

    const THEOREMS_LVL2 = [
      {
        q: "Wat is een belangrijke eigenschap van een koordenvierhoek?",
        a: "180",
        hint: "Som van overstaande hoeken.",
        steps: ["Overstaande hoeken zijn samen 180 graden."],
      },
      {
        q: "Wat zegt de stelling van de omtrekshoek?",
        a: "boog",
        hint: "Hoeken op dezelfde boog zijn...",
        steps: ["Hoeken die op dezelfde boog staan zijn gelijk."],
      },
      {
        q: "Wat is de relatie tussen een middelpuntshoek en een omtrekshoek op dezelfde boog?",
        a: "dubbel",
        hint: "De middelpuntshoek is ... zo groot.",
        steps: [
          "De middelpuntshoek is twee keer zo groot als de omtrekshoek op dezelfde boog.",
        ],
      },
    ];

    const THEOREMS_LVL3 = [
      {
        q: "Wanneer zijn twee driehoeken congruent volgens ZHZ?",
        a: "insluitende hoek|insluitend",
        hint: "Twee zijden en de...",
        steps: ["Twee zijden en de insluitende hoek zijn gelijk."],
      },
      {
        q: "Twee driehoeken zijn gelijkvormig als ze twee gelijke ... hebben.",
        a: "hoeken",
        hint: "Kortste kenmerk (hh).",
        steps: ["Beide driehoeken hebben twee hoeken die gelijk zijn (hh)."],
      },
      {
        q: "Wat is de eigenschap van de deellijn van een hoek in een driehoek?",
        a: "tegenoverliggende|overstaande",
        hint: "De deellijn deelt de ... zijde.",
        steps: [
          "De deellijn deelt de overstaande zijde in de verhouding van de aanliggende zijden.",
        ],
      },
    ];

    const THEOREMS_LVL4 = [
      {
        q: "Hoe bereken je de oppervlakte van een driehoek met de sinus?",
        a: "0.5|half",
        hint: "Opp = ... * a * b * sin(C)",
        steps: [
          "Oppervlakte = 0.5 * a * b * sin(gamma).",
          "Dit volgt uit de hoogtelijn h = b * sin(gamma).",
        ],
      },
      {
        q: "Wat zegt de cosinusregel over a^2?",
        a: "2bccos",
        hint: "Pythagoras met correctie: a^2 = b^2 + c^2 - ...",
        steps: ["a^2 = b^2 + c^2 - 2bc \\cdot \\cos(A)"],
      },
    ];

    const list =
      level === 1
        ? THEOREMS_LVL1
        : level === 2
          ? THEOREMS_LVL2
          : level === 3
            ? THEOREMS_LVL3
            : THEOREMS_LVL4;
    const theorem = list[rand(0, list.length - 1)]!;

    return {
      id: `geo-${level}-${timestamp}`,
      question: theorem.q,
      answer: theorem.a,
      context: "Vul het ontbrekende kernwoord in",
      solutionSteps: theorem.steps,
    };
  },

  validate: (input: string, problem: GymProblem) => {
    if (!input.trim()) return { correct: false };

    const clean = input.toLowerCase().replace(/\s+/g, "");
    const keywords = problem.answer
      .toLowerCase()
      .split("|")
      .map((k) => k.replace(/\s+/g, ""));

    // Exact match or contains for keyword engines (normalized)
    const isCorrect = keywords.some(
      (k) => clean === k || (clean.length > 3 && clean.includes(k)),
    );

    if (isCorrect) {
      return { correct: true };
    }

    return {
      correct: false,
      feedback: `Probeer het juiste kernwoord (bijv. ${problem.answer}).`,
    };
  },
};
