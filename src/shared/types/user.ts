/**
 * Shared User Types
 * Moved from entities/user to resolve FSD violations
 */

export interface UserXP {
  current: number;
  total: number;
  level: number;
  nextLevelThreshold: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
  rewards?: {
    xp: number;
    badge?: string;
  };
}

export interface SkillMatrix {
  [subject: string]: {
    level: number;
    xp: number;
    mastery: number; // 0-100%
  };
}

export interface UserStats {
  xp: UserXP;
  streak: {
    current: number;
    best: number;
    lastLoginDate: string;
  };
  skills: SkillMatrix;
  achievements: Achievement[];
  totalStudyTime: number; // total minutes
  questionsAnswered: number;
  perfectQuizzesCount: number;
}
