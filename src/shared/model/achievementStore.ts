import { createStore } from "@shared/lib/storeFactory";
import { Achievement } from "@shared/types";

interface AchievementState {
  achievements: Achievement[];
  recentUnlock: Achievement | null;
  addAchievement: (achievement: Achievement) => void;
  unlock: (id: string) => void;
  clearRecentUnlock: () => void;
  setInitialState: (xp: number, level: number, unlockedIds: string[]) => void;
  xp: number;
  level: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-login",
    title: "Startschot",
    description: "Log voor het eerst in",
    icon: "🚀",
    unlocked: false,
    rewards: { xp: 50 },
  },
  {
    id: "streak-3",
    title: "Volhouder",
    description: "3 dagen streak",
    icon: "🔥",
    unlocked: false,
    rewards: { xp: 150 },
  },
  {
    id: "quiz-master",
    title: "Quiz Master",
    description: "Haal 100% op een quiz",
    icon: "👑",
    unlocked: false,
    rewards: { xp: 200 },
  },
];

export const useAchievementStore = createStore<AchievementState>(
  (set) => ({
    achievements: ACHIEVEMENTS,
    recentUnlock: null,
    xp: 0,
    level: 1,
    addAchievement: (achievement) =>
      set((state) => ({ achievements: [...state.achievements, achievement] })),
    unlock: (id) =>
      set((state) => ({
        achievements: state.achievements.map((a) =>
          a.id === id ? { ...a, unlocked: true } : a,
        ),
        recentUnlock: state.achievements.find((a) => a.id === id) || null,
      })),
    clearRecentUnlock: () => set({ recentUnlock: null }),
    setInitialState: (xp, level, unlockedIds) =>
      set((state) => ({
        xp,
        level,
        achievements: state.achievements.map((a) =>
          unlockedIds.includes(a.id) ? { ...a, unlocked: true } : a,
        ),
      })),
  }),
  {
    name: "achievements",
    sanitize: (state) => ({
      ...state,
      // Ensure specific achievements are always in sync with constants but keep unlocked state
      achievements: ACHIEVEMENTS.map(ref => {
        const current = state.achievements?.find(a => a.id === ref.id);
        return current ? { ...ref, unlocked: current.unlocked } : ref;
      })
    })
  }
);
