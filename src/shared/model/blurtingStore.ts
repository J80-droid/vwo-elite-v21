import { saveStudyMaterialSQL } from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";

export interface BlurtingSession {
  id: string;
  topic: string;
  date: number;
  userContent: string;
  score: number;
  missingPoints: string[];
  misconceptions: string[];
  // New: Link to previous session ID for tracking improvement
  retryOfId?: string;
}

interface BlurtingState {
  sessions: BlurtingSession[];

  // Actions
  addSession: (session: BlurtingSession) => void;
  getHistoryByTopic: (topic: string) => BlurtingSession[];
  getLastSessionForTopic: (topic: string) => BlurtingSession | undefined;
}

export const useBlurtingStore = createStore<BlurtingState>(
  (set, get) => ({
    sessions: [],

    addSession: async (session) => {
      // 1. Update local state
      set((state) => ({
        sessions: [session, ...state.sessions],
      }));

      // 2. Persist to SQLite (Async, fire & forget)
      try {
        await saveStudyMaterialSQL({
          id: session.id,
          name: `Blurting: ${session.topic}`,
          subject: "Active Recall",
          type: "blurting_session",
          content: JSON.stringify(session),
          date: new Date(session.date).toISOString(),
        });
      } catch (e) {
        console.error("[BlurtingStore] Failed to save to SQLite:", e);
      }
    },

    getHistoryByTopic: (topic) => {
      return get().sessions.filter((s) =>
        s.topic.toLowerCase().includes(topic.toLowerCase()),
      );
    },

    getLastSessionForTopic: (topic) => {
      return get().sessions.find(
        (s) => s.topic.toLowerCase() === topic.toLowerCase(),
      );
    },
  }),
  {
    name: "blurting",
  }
);
