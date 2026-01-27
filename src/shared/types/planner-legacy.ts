import { Subject } from "./common";

// --- PLANNER TYPES ---
export interface StudyPlanItem {
  id: string;
  title: string;
  subject: Subject | string; // Allow string for AI-generated subjects
  topic?: string; // For AI-generated plan items
  chapter?: string; // Chapter reference for school books
  date: string; // ISO date string YYYY-MM-DD
  startTime?: string; // HH:mm
  duration?: number; // minutes
  durationMinutes?: number; // Alternative duration format
  completed: boolean;
  notes?: string;
  priority?: "low" | "medium" | "high" | "Low" | "Medium" | "High";
  type:
    | "study"
    | "homework"
    | "exam-prep"
    | "review"
    | "repair"
    | "read"
    | "practice";
  estimatedHours?: number;
}

export interface SubjectProgress {
  subject: Subject;
  currentGrade: number;
  targetGrade: number;
  studyHoursTotal: number;
  topicsMastered: number;
  topicsTotal: number;
}
