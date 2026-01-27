import { createStore } from "@shared/lib/storeFactory";
import { Achievement, UserStats } from "@shared/types/user";

interface UserStatsState extends UserStats {
  // Actions
  addXp: (amount: number) => void;
  checkLevelUp: () => void;
  unlockAchievement: (id: string) => void;
  updateStreak: () => void;
  updateSkill: (subject: string, impact: number) => void;
  recordPerfectQuiz: () => void;
  completeSession: () => void;

  // Setters (for hydration/reset)
  setStats: (stats: Partial<UserStats>) => void;
}

const LEVEL_BASE_XP = 1000;

// Default Data
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "new_nerd",
    title: "Nieuwe Nerd",
    description: "Je hebt je eerste studiesessie voltooid!",
    icon: "GraduationCap",
    unlocked: false,
    rewards: { xp: 100 },
  },
  {
    id: "streak_3",
    title: "Vlambare Student",
    description: "3 dagen op rij gestudeerd.",
    icon: "Flame",
    unlocked: false,
    target: 3,
    rewards: { xp: 300 },
  },
  {
    id: "quiz_master",
    title: "Quiz Master I",
    description: "10 quizzen foutloos gemaakt.",
    icon: "Trophy",
    unlocked: false,
    target: 10,
    rewards: { xp: 500 },
  },
];

const INITIAL_STATE: UserStats = {
  xp: { current: 0, total: 0, level: 1, nextLevelThreshold: LEVEL_BASE_XP },
  streak: { current: 0, best: 0, lastLoginDate: "" },
  skills: {},
  achievements: DEFAULT_ACHIEVEMENTS,
  totalStudyTime: 0,
  questionsAnswered: 0,
  perfectQuizzesCount: 0,
};

export const useUserStatsStore = createStore<UserStatsState>(
  (set, get) => ({
    ...INITIAL_STATE,

    addXp: (amount) => {
      set((state) => {
        const newTotal = state.xp.total + amount;
        const newCurrent = state.xp.current + amount;

        // Simple level check logic
        let { level, nextLevelThreshold } = state.xp;
        if (newCurrent >= nextLevelThreshold) {
          level++;
          nextLevelThreshold = level * LEVEL_BASE_XP;
        }

        return {
          xp: {
            current: newCurrent,
            total: newTotal,
            level,
            nextLevelThreshold,
          },
        };
      });
    },

    checkLevelUp: () => {
      // Already handled in addXp for simplicity, but can be explicit here
    },

    unlockAchievement: (id) => {
      set((state) => {
        const exists = state.achievements.find((a) => a.id === id);
        if (!exists || exists.unlocked) return {};

        const updatedAchievements = state.achievements.map((a) =>
          a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a,
        );

        // Add reward XP
        const reward = exists.rewards?.xp || 0;
        get().addXp(reward);

        return { achievements: updatedAchievements };
      });
    },

    updateStreak: () => {
      const today = new Date().toISOString().split("T")[0];
      set((state) => {
        const lastLogin = state.streak.lastLoginDate;
        if (lastLogin === today) return {}; // Already logged today

        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];
        let newCurrent = state.streak.current;

        if (lastLogin === yesterday) {
          newCurrent++;
        } else {
          newCurrent = 1; // Reset or Start
        }

        // Achievement check
        const newState = {
          streak: {
            current: newCurrent,
            best: Math.max(newCurrent, state.streak.best),
            lastLoginDate: today,
          },
        };

        return newState;
      });

      // Check for streak achievement
      if (get().streak.current >= 3) {
        get().unlockAchievement("streak_3");
      }
    },

    updateSkill: (subject, impact) => {
      set((state) => {
        const currentSkill = state.skills[subject] || {
          level: 1,
          xp: 0,
          mastery: 0,
        };
        let newMastery = currentSkill.mastery + impact;
        newMastery = Math.max(0, Math.min(100, newMastery));

        return {
          skills: {
            ...state.skills,
            [subject]: {
              ...currentSkill,
              mastery: newMastery,
            },
          },
        };
      });
    },

    recordPerfectQuiz: () => {
      set((state) => ({
        perfectQuizzesCount: state.perfectQuizzesCount + 1,
      }));
      if (get().perfectQuizzesCount >= 10) {
        get().unlockAchievement("quiz_master");
      }
    },

    completeSession: () => {
      get().unlockAchievement("new_nerd");
      // Could also increment a session counter here
    },

    setStats: (stats) => set((state) => ({ ...state, ...stats })),
  }),
  {
    name: "user-stats",
    sanitize: (state) => ({
      ...state,
      // Ensure specific achievements are always in sync with constants but keep unlocked state
      achievements: DEFAULT_ACHIEVEMENTS.map((ref) => {
        const current = state.achievements?.find((a) => a.id === ref.id);
        return current ? { ...ref, ...current } : ref;
      }),
    }),
  }
);
