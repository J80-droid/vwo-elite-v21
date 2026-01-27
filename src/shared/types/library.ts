/* eslint-disable @typescript-eslint/no-explicit-any */

// Shared library subject type - moved from features/library to allow shared layer access
export interface LibrarySubject {
  id: string;
  name: string;
  theme:
    | "blue"
    | "amber"
    | "emerald"
    | "rose"
    | "orange"
    | "purple"
    | "cyan"
    | "indigo"
    | "slate"
    | "sky"
    | "violet"
    | "lime"
    | "teal"
    | "fuchsia"
    | "stone"
    | "yellow"
    | "pink"
    | "red";
  icon: any; // Lucide icon
  averageGrade?: number;
  nextTestDate?: string; // YYYY-MM-DD
  nextTestName?: string;
  nextLessonDate?: string;
  nextLessonTopic?: string;
  progress?: number; // 0-100
  legacyName?: string; // For data store compatibility (e.g. "Wiskunde B")
}
