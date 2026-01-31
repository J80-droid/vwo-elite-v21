import { GymEngine, GymProblem } from "@shared/types/gym";

import { PHYSICS_DEFINITIONS } from "./PhysicsDefinitions";

const pick = <T>(arr: T[]): T => {
  if (arr.length === 0) throw new Error("Cannot pick from empty array");
  return arr[Math.floor(Math.random() * arr.length)] as T;
};

export const FlashcardEngine: GymEngine = {
  id: "flashcards",
  name: "Begrippen",
  description: "Oefen belangrijke natuurkunde definities.",
  generate: (level: number): GymProblem => {
    // Level 1: Definition -> Term (Multiple Choice style context?)
    // Level 2: Cloze -> Term

    const def = pick(PHYSICS_DEFINITIONS);
    const isCloze = level > 1 || Math.random() > 0.5;

    // In standard Gym we expect exact string input.
    // For definitions, this is hard ("resonansie" vs "resonantie").
    // We will supply the ANSWER as the term.
    // The Question should be clear.

    const question = isCloze
      ? def.cloze.replace("[...]", "_______")
      : `Wat betekent: "${def.definition}"?`;
    // Hinting approach: Display steps that reveal letters?
    // Or just standard steps.

    const steps = [
      `Categorie: ${def.category}`,
      `Begint met: ${def.term[0]}...`,
      `Aantal letters: ${def.term.length}`,
      `Antwoord: ${def.term}`,
    ];

    return {
      id: "fc-" + Math.random(),
      question,
      context: "Begrippen Trainer",
      solutionSteps: steps,
      answer: def.term, // Exact match required (case insensitive handled by gym)
      displayAnswer: def.term,
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    const cleanInput = input.toLowerCase().trim();
    const cleanAnswer = problem.answer.toLowerCase().trim();

    if (cleanInput === cleanAnswer) return { correct: true };

    // Levenshtein distance check voor kleine typefouten
    const distance = getLevenshteinDistance(cleanInput, cleanAnswer);
    if (distance <= 2 && cleanAnswer.length > 4) {
      return {
        correct: true,
        feedback: `Bijna goed! Let op de spelling: **${problem.answer}**`,
      };
    }

    if (cleanAnswer.includes(cleanInput) && cleanInput.length > 3) {
      return { correct: false, feedback: "Je bent warm, maar niet volledig." };
    }

    return { correct: false, feedback: "Niet correct. Let op de spelling." };
  },
};

// Helper: Levenshtein Distance
function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) tmp[i] = [i] as number[];
  for (let j = 0; j <= b.length; j++) tmp[0]![j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i]![j] = Math.min(
        tmp[i - 1]![j]! + 1,
        tmp[i]![j - 1]! + 1,
        tmp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return tmp[a.length]![b.length]!;
}
