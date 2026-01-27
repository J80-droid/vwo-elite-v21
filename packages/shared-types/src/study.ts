import { Subject } from "./common";
import { QuizQuestion } from "./quiz";

// --- STUDY MATERIAL ---
export interface StudyMaterial {
  id: string;
  name?: string; // Display name for the material
  type:
    | "note"
    | "flashcard"
    | "summary"
    | "diagram"
    | "quiz"
    | "pdf"
    | "txt"
    | "text"
    | "image"
    | "chat";
  title?: string;
  content: string;
  subject: Subject | string; // Allow string for PWS subjects
  date?: string;
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
  embedding?: number[]; // Vector embedding for semantic search
}

export type UploadedMaterial = StudyMaterial; // Alias for compatibility

export type LearningIntent = "summarize" | "apply" | "criticize" | string;
export type SourceReliability = "high" | "medium" | "low" | string;

export interface Section {
  heading: string;
  content: string;
  imageUrl?: string | undefined;
  imagePrompt?: string | undefined;
  imageError?: string | undefined;
  examples?: string[] | undefined;
}

export interface SavedLesson {
  id: string;
  title: string;
  subject: string;
  summary?: string;
  sections: Section[];
  keyConcepts?: string[];
  // Generic quiz items, defined formally in the Quiz feature
  quiz?: QuizQuestion[];
  practiceQuestions?: string[];
  createdAt: number;
  updatedAt?: number;
}
export type GeneratedLesson = SavedLesson;
