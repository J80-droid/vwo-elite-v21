/**
 * Planner Elite - Core Type Definitions
 *
 * This file contains all the type definitions for the intelligent
 * VWO study planner, including:
 * - EliteTask: The main task interface with energy/priority awareness
 * - PlannerSettings: User preferences for bio-rhythm & scheduling
 * - Dutch holidays and vacation regions
 */

// ===== ENERGY & PRIORITY =====
export type EnergyLevel = "high" | "medium" | "low";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done" | "skipped";

// ===== TASK TYPES =====
export type TaskType =
  | "lesson" // Fixed schedule (school roster)
  | "homework" // Teacher assignments
  | "study" // Self-study blocks
  | "exam" // PTA exams
  | "repair" // Auto-generated review (from ExamSimulator)
  | "review" // Spaced repetition
  | "pws" // Profielwerkstuk milestones
  | "personal" // Sports, work, free time
  | "vacation" // Holidays (blocked time)
  | "recovery"; // Bio-rhythm charger

// ===== MAIN TASK INTERFACE =====
export interface EliteTask {
  id: string;
  title: string;
  description?: string | undefined;

  // --- Scheduling ---
  date: string; // ISO "2024-11-24"
  startTime?: string | undefined; // "14:30" (optional for floating tasks)
  endTime?: string | undefined; // Calculated from duration
  duration: number; // Minutes
  isFixed: boolean; // True = cannot be moved (lessons, exams)
  isAllDay: boolean; // Vacation days, deadlines

  // --- VWO Context ---
  subject?: string | undefined; // "wiskunde", "geschiedenis"
  topic?: string | undefined; // "Differentiëren"
  chapter?: string | undefined; // "H4"

  // --- PTA/Grading ---
  gradeGoal?: number | undefined; // Target grade (8.0)
  gradeAchieved?: number | undefined; // Actual grade (e.g. 5.4)
  weight?: number | undefined; // PTA weighting (1x, 2x, 3x)
  examType?: "SO" | "SE" | "CE" | "PWS" | undefined;

  // --- Intelligence Layer ---
  type: TaskType;
  priority: TaskPriority;
  energyRequirement: EnergyLevel;

  // --- Linking ---
  linkedContentId?: string | undefined; // Opens specific lesson/quiz
  pwsProjectId?: string | undefined; // Link to PWS project
  parentTaskId?: string | undefined; // For recurring/split tasks

  // --- Recurrence ---
  recurrencePattern?:
  | "daily"
  | "weekdays"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom"
  | undefined;
  recurrenceEndDate?: string | undefined;

  // --- Status ---
  completed: boolean;
  status: TaskStatus;
  completedAt?: string | undefined;

  // --- Metadata ---
  createdAt: string;
  updatedAt: string;
  source: "manual" | "import" | "ai" | "repair";
  color?: string | undefined; // Custom color override
  rescheduleCount?: number | undefined; // How many times moved?
  reflection?:
  | {
    rating: "easy" | "medium" | "hard";
    notes?: string;
  }
  | undefined;
}

// ===== USER SETTINGS =====
export type Chronotype = "morning_lark" | "neutral" | "night_owl";
import type { DutchRegion } from "@shared/types/planner";
export type { DutchRegion };

export interface PlannerSettings {
  // Bio-rhythm
  chronotype: Chronotype;
  peakHoursStart: number; // 8-22 (hour)
  peakHoursEnd: number;

  // Schedule preferences
  workDayStart: number; // Default: 8
  workDayEnd: number; // Default: 22
  preferredStudyDuration: number; // Default: 45 min
  bufferMinutes: number; // Default: 15
  freeTimePerDay: number; // Minutes of free time goal

  // Netherlands-specific
  region: DutchRegion;
  examYear: number; // 2026, 2027, etc.

  // Features
  examMode: boolean; // Enable "grind time" restrictions
  autoRescheduleEnabled: boolean;
  spacedRepetitionEnabled: boolean;
  universityMode: boolean;
  showBioRhythm: boolean;
}

export interface WeeklyReview {
  id: string; // ISO date of the Sunday
  date: string; // ISO date
  good: string;
  bad: string;
  plan: string;
  completed: boolean;
  completedAt?: string | undefined;
}

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  chronotype: "neutral",
  peakHoursStart: 10,
  peakHoursEnd: 17,
  workDayStart: 8,
  workDayEnd: 22,
  preferredStudyDuration: 45,
  bufferMinutes: 15,
  freeTimePerDay: 120, // 2 hours default
  region: "midden",
  examYear: new Date().getFullYear(),
  examMode: false,
  autoRescheduleEnabled: true,
  spacedRepetitionEnabled: true,
  universityMode: false,
  showBioRhythm: false,
};

// ===== UNAVAILABLE BLOCKS =====
export interface UnavailableBlock {
  id: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  startTime: string; // "19:00"
  endTime: string; // "21:00"
  reason: string; // "Hockey training"
  recurring: boolean; // Every week?
}

// DutchHoliday interface moved to @shared/types/planner

// ===== PEAK HOURS CONFIG =====
export const CHRONOTYPE_PEAK_HOURS: Record<
  Chronotype,
  { start: number; end: number }
> = {
  morning_lark: { start: 9, end: 14 },
  neutral: { start: 10, end: 17 },
  night_owl: { start: 19, end: 23 },
};

// ===== SUBJECT ENERGY MAPPING =====
// Beta subjects typically require more mental energy
export const SUBJECT_ENERGY_MAP: Record<string, EnergyLevel> = {
  // High energy (Beta)
  wiskunde: "high",
  "wiskunde a": "high",
  "wiskunde b": "high",
  "wiskunde c": "medium",
  "wiskunde d": "high",
  natuurkunde: "high",
  scheikunde: "high",
  informatica: "high",
  latijn: "high",
  grieks: "high",

  // Medium energy
  biologie: "medium",
  economie: "medium",
  bedrijfseconomie: "medium",
  geschiedenis: "medium",
  aardrijkskunde: "medium",
  maatschappijleer: "medium",
  filosofie: "medium",

  // Lower energy (more reading/memory based)
  nederlands: "low",
  engels: "low",
  frans: "low",
  duits: "low",
  spaans: "low",
  kunst: "low",
  muziek: "low",
  "lichamelijke opvoeding": "low",
  lo: "low",
};

// ===== HELPER FUNCTIONS =====
export const getEnergyForSubject = (subject: string): EnergyLevel => {
  const key = subject.toLowerCase().trim();
  return SUBJECT_ENERGY_MAP[key] || "medium";
};

export const getPriorityForWeight = (weight?: number): TaskPriority => {
  if (weight == null) return "medium"; // Elite fix: 0 is a valid weight, use nullish check
  if (weight >= 3) return "critical";
  if (weight >= 2) return "high";
  return "medium";
};

// ===== TASK TYPE COLORS =====
export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  lesson: "#3b82f6", // blue
  homework: "#f59e0b", // amber
  study: "#10b981", // emerald
  exam: "#ef4444", // red
  repair: "#f97316", // orange
  review: "#8b5cf6", // violet
  pws: "#ec4889", // pink
  personal: "#6b7280", // gray
  vacation: "#06b6d4", // cyan
  recovery: "#84cc16", // lime-500
};

// ===== THEME COLORS (Mapped to Subjects) =====
export const THEME_COLORS = {
  cyan: "#06b6d4",
  blue: "#3b82f6",
  rose: "#f43f5e",
  emerald: "#10b981",
  purple: "#a855f7",
  orange: "#f97316",
  amber: "#f59e0b",
  slate: "#64748b",
  red: "#ef4444",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
  lime: "#84cc16",
  teal: "#14b8a6",
  fuchsia: "#d946ef",
  stone: "#78716c",
  yellow: "#eab308",
  pink: "#ec4899",
};

/**
 * Get the color for a task based on its subject or type
 */
export const getTaskColor = (task: EliteTask): string => {
  // 1. Check Explicit Color override (e.g. from Somtoday)
  if (task.color) return task.color;

  // 2. Check Subject
  if (task.subject) {
    // Elite fix: Safe extraction with proper type guards
    let subjectName: string | undefined;
    if (typeof task.subject === "string") {
      subjectName = task.subject;
    } else if (typeof task.subject === "object" && task.subject !== null) {
      const subjectObj = task.subject as { defaultName?: string; name?: string };
      subjectName = subjectObj.defaultName || subjectObj.name;
    }

    if (!subjectName) return TASK_TYPE_COLORS[task.type] || "#6b7280";

    // Try direct English/Dutch name mapping for older tasks
    const lower = subjectName.toLowerCase();

    // Robust Tokenization Strategy (Standardized with somtodayService)
    const tokens = new Set(lower.split(/[^a-z0-9]+/));
    const hasCode = (code: string) => tokens.has(code);

    if (
      lower.includes("wis") ||
      hasCode("wi") ||
      hasCode("wa") ||
      hasCode("wb") ||
      hasCode("wc")
    )
      return THEME_COLORS.blue; // Math = Blue
    if (lower.includes("nat") || hasCode("na") || hasCode("phy"))
      return THEME_COLORS.amber; // Physics = Amber
    if (
      lower.includes("schei") ||
      lower.includes("chem") ||
      hasCode("sk") ||
      hasCode("sc")
    )
      return THEME_COLORS.emerald; // Chemistry = Emerald
    if (lower.includes("bio") || hasCode("bi")) return THEME_COLORS.lime; // Biology = Lime
    if (lower.includes("ned") || hasCode("nl") || hasCode("ne"))
      return THEME_COLORS.rose; // Dutch = Rose
    if (lower.includes("eng") || hasCode("en")) return THEME_COLORS.violet; // English = Violet
    if (lower.includes("fran") || hasCode("fa") || hasCode("fr"))
      return THEME_COLORS.orange;
    if (lower.includes("duit") || hasCode("du") || hasCode("de"))
      return THEME_COLORS.orange;
    if (lower.includes("filo")) return THEME_COLORS.fuchsia;
    if (lower.includes("ges") || hasCode("gs")) return THEME_COLORS.fuchsia; // History = Fuchsia
    if (lower.includes("eco") || hasCode("ec") || hasCode("beco"))
      return THEME_COLORS.emerald; // Economics = Green/Emerald
    if (lower.includes("maat") || hasCode("ma")) return THEME_COLORS.teal;
    if (lower.includes("inf") || hasCode("in")) return THEME_COLORS.slate;
    if (lower.includes("gym") || lower.includes("lo"))
      return THEME_COLORS.slate;
    if (
      lower.includes("kun") ||
      lower.includes("ckv") ||
      hasCode("te") ||
      hasCode("mu") ||
      hasCode("ha")
    )
      return THEME_COLORS.pink;
  }

  // 2. Check Type
  return TASK_TYPE_COLORS[task.type] || "#6b7280";
};

// ===== MIGRATION HELPER =====
// For converting old StudyPlanItem to new EliteTask
export interface LegacyStudyPlanItem {
  id: string;
  title: string;
  subject: string;
  topic?: string;
  chapter?: string;
  date: string;
  startTime?: string;
  duration?: number;
  durationMinutes?: number;
  completed: boolean;
  notes?: string;
  priority?: "low" | "medium" | "high" | "Low" | "Medium" | "High";
  type: string;
  estimatedHours?: number;
}

export const migrateToEliteTask = (legacy: LegacyStudyPlanItem): EliteTask => {
  const now = new Date().toISOString();
  const duration =
    legacy.duration ||
    legacy.durationMinutes ||
    (legacy.estimatedHours ? legacy.estimatedHours * 60 : 30);

  // Map old type to new TaskType
  const typeMap: Record<string, TaskType> = {
    study: "study",
    homework: "homework",
    "exam-prep": "study",
    review: "review",
    repair: "repair",
    read: "study",
    practice: "study",
  };

  // Map old priority to new
  const priorityMap: Record<string, TaskPriority> = {
    low: "low",
    Low: "low",
    medium: "medium",
    Medium: "medium",
    high: "high",
    High: "high",
  };

  return {
    id: legacy.id,
    title: legacy.title,
    description: legacy.notes || "",
    date: legacy.date,
    startTime: legacy.startTime || undefined,
    duration,
    isFixed: false,
    isAllDay: false,
    subject: legacy.subject,
    topic: legacy.topic || undefined,
    chapter: legacy.chapter || undefined,
    type: typeMap[legacy.type] || "study",
    priority: priorityMap[legacy.priority || "medium"] || "medium",
    energyRequirement: getEnergyForSubject(legacy.subject),
    completed: legacy.completed,
    status: legacy.completed ? "done" : "todo",
    createdAt: now,
    updatedAt: now,
    source: "manual",
  };
};
