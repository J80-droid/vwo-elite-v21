import { z } from "zod";

import { Subject } from "./common";
import { InteractiveComponentSchema, SavedLesson } from "./lesson.schema";

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
  fileFingerprint?: string; // SHA-256 or similar to identify duplicates
  createdAt: number;
  updatedAt?: number;
  embedding?: number[]; // Vector embedding for semantic search
  blob?: Blob | File; // Native binary data for performance (prevents memory bleed)
}

export type UploadedMaterial = StudyMaterial; // Alias for compatibility

export type LearningIntent = "summarize" | "apply" | "criticize" | string;
export type SourceReliability = "high" | "medium" | "low" | string;

export interface Section {
  id?: string;
  heading: string;
  content: string;
  imageUrl?: string | undefined;
  imagePrompt?: string | undefined;
  imageError?: string | undefined;
  examples: string[];
  interactive?: z.infer<typeof InteractiveComponentSchema>;
}

export { type SavedLesson };
export type GeneratedLesson = SavedLesson;

export type GenerationStage = "idle" | "ingest" | "digest" | "cache" | "generating" | "complete";
