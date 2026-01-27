import { Flashcard } from "../types";

// FSRS v4/5 Inspired Parameters (Default)

// Weights for difficulty/stability update (simplified)
const W = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
  0.34, 1.26, 0.29, 2.61,
];

export const createEmptyCard = (
  front: string = "",
  back: string = "",
  subject: string = "General",
  sourceId?: string,
): Flashcard => {
  return {
    id: crypto.randomUUID(),
    front,
    back,
    subject,
    ...(sourceId ? { sourceMaterialId: sourceId } : {}),
    difficulty: 0,
    stability: 0,
    due: Date.now(),
    lastReview: 0,
    state: "New",
    reps: 0,
    lapses: 0,
  };
};

/**
 * Calculates new stability and difficulty based on rating
 * Rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 */
export const scheduleCard = (
  card: Flashcard,
  rating: 1 | 2 | 3 | 4,
): Flashcard => {
  const now = Date.now();
  let newDifficulty = card.difficulty;
  let newStability = card.stability;
  let nextInterval = 0; // in days

  // Initialize if New
  if (card.state === "New") {
    newDifficulty = initDifficulty(rating);
    newStability = initStability(rating);
    card.state = rating === 1 ? "Learning" : "Review"; // Simplify: 1=Learning, others=Review
  } else {
    // Update Difficulty
    newDifficulty = nextDifficulty(card.difficulty, rating);

    // Update Stability
    const daysElapsed = (now - card.lastReview) / (1000 * 60 * 60 * 24);
    // [LOGIC REPAIR LV-006] Guard against division by zero
    const safeStability = Math.max(0.01, card.stability);
    const retrievability = Math.exp(
      (Math.log(0.9) * daysElapsed) / safeStability,
    );

    if (rating === 1) {
      // Lapse
      newStability = nextForgetStability(
        card.stability,
        card.difficulty,
        retrievability,
      );
      card.lapses += 1;
      card.state = "Relearning";
    } else {
      newStability = nextRecallStability(
        card.stability,
        card.difficulty,
        retrievability,
        rating,
      );
      card.state = "Review";
    }
  }

  // Calculate Interval (target retention 90%)
  // I = S * 9 * (1/R - 1) -> For R=0.9, interval ~= S.
  // We strictly use S as days for 90% retention in this simplified model.
  nextInterval = Math.max(1, Math.round(newStability));

  // Hard cap max interval (e.g., 365 days)
  if (nextInterval > 365) nextInterval = 365;

  // Apply strict "Again" rule
  if (rating === 1) nextInterval = 0; // Due immediately (or very short)

  // Update Card
  return {
    ...card,
    difficulty: newDifficulty,
    stability: newStability,
    lastReview: now,
    due: now + nextInterval * 24 * 60 * 60 * 1000,
    reps: card.reps + 1,
  };
};

// --- FSRS Maths (Simplified Implementation) ---

function initDifficulty(rating: number): number {
  // Rating 1-4 mapped to D 1-10 scale essentially
  // Official FSRS uses D in [1, 10]
  return Math.min(Math.max(1, 5 - (rating - 3)), 10);
}

function initStability(rating: number): number {
  // Initial S in days
  switch (rating) {
    case 1:
      return 0.5; // < 1 day
    case 2:
      return 2;
    case 3:
      return 5;
    case 4:
      return 10;
    default:
      return 1;
  }
}

function nextDifficulty(d: number, r: number): number {
  const nextD = d - 0.8 + 0.28 * (5 - r) * (0.02 * (5 - r)); // Simplified formula
  return Math.min(Math.max(1, nextD), 10);
}

function nextRecallStability(
  s: number,
  d: number,
  r: number,
  rating: number,
): number {
  const hardPenalty = rating === 2 ? 0.5 : 1;
  const easyBonus = rating === 4 ? 1.3 : 1;
  const newS =
    s *
    (1 +
      Math.exp(W[8]!) *
      (11 - d) *
      Math.pow(s, -0.5) *
      (Math.exp((1 - r) * W[9]!) - 1) *
      hardPenalty *
      easyBonus);
  return newS;
}

function nextForgetStability(s: number, _d: number, _r: number): number {
  return Math.max(0.2, Math.min(s / 2, 2)); // Simple cut in half, min 0.2 days
}
