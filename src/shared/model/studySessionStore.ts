import { createStore } from "@shared/lib/storeFactory";

type SessionType = "work" | "break";

interface StudySessionState {
  isTimerActive: boolean;
  timeRemaining: number;
  sessionType: SessionType;
  workDuration: number;
  breakDuration: number;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setWorkDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  tick: () => void;
  getFormattedTime: () => string;
}

export const useStudySessionStore = createStore<StudySessionState>(
  (set, get) => ({
    isTimerActive: false,
    timeRemaining: 25 * 60,
    sessionType: "work",
    workDuration: 25,
    breakDuration: 5,

    startTimer: () => set({ isTimerActive: true }),
    pauseTimer: () => set({ isTimerActive: false }),
    resetTimer: () => {
      const { sessionType, workDuration, breakDuration } = get();
      set({
        isTimerActive: false,
        timeRemaining:
          (sessionType === "work" ? workDuration : breakDuration) * 60,
      });
    },
    setWorkDuration: (minutes) =>
      set({ workDuration: minutes, timeRemaining: minutes * 60 }),
    setBreakDuration: (minutes) => set({ breakDuration: minutes }),

    tick: () => {
      const { timeRemaining, sessionType, workDuration, breakDuration } = get();
      if (timeRemaining > 0) {
        set({ timeRemaining: timeRemaining - 1 });
      } else {
        if (sessionType === "work") {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { useUserStatsStore } = require("./userStatsStore");
          useUserStatsStore.getState().completeSession();
        }

        // Timer finished, switch mode
        const nextType = sessionType === "work" ? "break" : "work";
        const nextDuration = nextType === "work" ? workDuration : breakDuration;
        set({
          sessionType: nextType,
          timeRemaining: nextDuration * 60,
          isTimerActive: false, // Auto-pause?
        });
        // Play sound? Handled by component effect.
      }
    },

    getFormattedTime: () => {
      const { timeRemaining } = get();
      const m = Math.floor(timeRemaining / 60);
      const s = timeRemaining % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    },
  }),
  {
    name: "study-session",
    persist: false,
  }
);
