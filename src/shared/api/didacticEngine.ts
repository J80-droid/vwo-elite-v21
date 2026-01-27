import { QuizAnswerResult, TestLabQuestion } from "../types";

export interface PerformanceAnalysis {
  score: number;
  factScore: number; // MCQ, Fill Blank
  applicationScore: number; // Open, Ordering, Error Spotting
  diagnosis: string;
  strategy: "maintain" | "application_focus" | "foundation_repair";
  blockedTypes: string[];
  recommendedActions: string[];
}

export const analyzePerformance = (
  results: QuizAnswerResult[],
  questions: TestLabQuestion[],
): PerformanceAnalysis => {
  const total = results.length;
  if (total === 0) {
    return {
      score: 0,
      factScore: 0,
      applicationScore: 0,
      diagnosis: "Nog geen resultaten.",
      strategy: "maintain",
      blockedTypes: [],
      recommendedActions: [],
    };
  }

  const correct = results.filter((r) => r.isCorrect).length;
  const score = (correct / total) * 10;

  // 1. Splitsen op vaardigheid (Skill Split)
  // Fact: Reproduction of knowledge
  const factTypes = ["multiple_choice", "fill_blank"];
  // Application: Insight, Process, Structuring
  const appTypes = [
    "error_spotting",
    "ordering",
    "open_question",
    "source_analysis",
  ];

  const factResults = results.filter((r) => {
    const q = questions.find((q) => q.id === r.questionId);
    return q && factTypes.includes(q.type);
  });

  const appResults = results.filter((r) => {
    const q = questions.find((q) => q.id === r.questionId);
    return q && appTypes.includes(q.type);
  });

  // Sub-scores (0-100)
  const factScore =
    factResults.length > 0
      ? (factResults.filter((r) => r.isCorrect).length / factResults.length) *
        100
      : 0;

  const applicationScore =
    appResults.length > 0
      ? (appResults.filter((r) => r.isCorrect).length / appResults.length) * 100
      : 0;

  // 2. Determine Strategy (The "Elite" Logic)
  let diagnosis = "";
  let strategy: PerformanceAnalysis["strategy"] = "maintain";
  let blockedTypes: string[] = [];
  let recommendedActions: string[] = [];

  // Scenario: High Fact Knowledge, Low Application (The "Illusion of Competence")
  if (factScore >= 75 && applicationScore < 55 && appResults.length > 0) {
    diagnosis =
      "⚠️ Je parate kennis is top, maar je loopt vast op de toepassing en structuur.";
    strategy = "application_focus";

    // Action: Block MCQ to prevent passive guessing
    blockedTypes = ["multiple_choice"];

    recommendedActions = [
      "Mistake Repair: Focus op 'Why-Review'",
      "Micro-Learning: Stappenplannen bestuderen",
      "Video Lab: Visualiseer het proces",
    ];
  } else if (score < 5.5) {
    diagnosis = "De basis ontbreekt nog. We gaan terug naar de kern.";
    strategy = "foundation_repair";
    recommendedActions = ["Review Theorie", "Eenvoudige Oefeningen"];
  } else if (score >= 8.5) {
    diagnosis = "Uitstekende prestatie! Je beheerst dit onderwerp volledig.";
    strategy = "maintain";
    recommendedActions = ["Verdieping (Extra Stof)", "Help anderen"];
  } else {
    diagnosis = "Solide prestatie. Blijf oefenen met variatie.";
    strategy = "maintain";
  }

  return {
    score,
    factScore,
    applicationScore,
    diagnosis,
    strategy,
    blockedTypes,
    recommendedActions,
  };
};
