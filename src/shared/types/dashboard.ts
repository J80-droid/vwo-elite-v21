import { StudyPlanItem } from "./planner-legacy";

// --- DASHBOARD TYPES ---
export interface ActivityItem {
  id: string;
  type: "quiz" | "study" | "achievement" | "milestone";
  title: string;
  subtitle?: string;
  date: number; // timestamp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Context specific data
  xpEarned?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rewards: { xp: number };
}

export interface DashboardData {
  greeting: string;
  quote: string;
  nextStudySession?: StudyPlanItem;
  recentActivity: ActivityItem[];
  statsOverview: {
    streak: number;
    level: number;
    weeklyProgress: number; // 0-100
  };
}

export interface ExamIndexEntry {
  id: string;
  title: string;
  subject: string;
  year: number | string;
  period: number | string;
  questionFile: string;
  answerFile: string;
  conversionFile?: string; // Omzettingstabel
  addendumFile?: string; // Aanvulling correctievoorschrift
  worksheetFile?: string; // Uitwerkbijlage
  term?: number;
}
