// --- FLASHCARD (FSRS) ---
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  sourceMaterialId?: string;
  tags?: string[];
  topic?: string;
  state: "New" | "Learning" | "Review" | "Relearning";
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  lastReview: number;
  deck?: string;
}

export interface ReviewLog {
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  state: "New" | "Learning" | "Review" | "Relearning";
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  review: number;
}
