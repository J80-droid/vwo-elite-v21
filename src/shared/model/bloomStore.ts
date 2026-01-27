import { createStore } from "@shared/lib/storeFactory";

// Types
export type BloomLevelType =
  | "Onthouden"
  | "Begrijpen"
  | "Toepassen"
  | "Analyseren"
  | "Evalueren"
  | "Creëren";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface BloomQuestionData {
  id: string;
  text: string;
  // Removed simple userAnswer/aiFeedback in favor of chatHistory
  chatHistory: ChatMessage[];
  isCorrect?: boolean;
}

export interface BloomLevelData {
  level: BloomLevelType;
  description: string;
  actionVerb: string;
  color: string;
  status: "locked" | "open" | "completed";
  questions: BloomQuestionData[];
}

export interface BloomSession {
  id: string;
  date: string;
  sourceText: string;
  levels: BloomLevelData[];
}

// Raw level from AI generation
interface RawBloomLevel {
  level: BloomLevelType;
  description: string;
  actionVerb: string;
  color: string;
  questions: string[];
}

interface BloomState {
  sessions: BloomSession[];
  activeSessionId: string | null;

  // Actions
  createSession: (text: string, rawLevels: RawBloomLevel[]) => void;
  addChatMessage: (
    sessionId: string,
    levelIdx: number,
    questionIdx: number,
    message: ChatMessage,
    isCorrect?: boolean,
  ) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
}

export const useBloomStore = createStore<BloomState>(
  (set) => ({
    sessions: [],
    activeSessionId: null,

    createSession: (text, rawLevels) => {
      const newSession: BloomSession = {
        id: `bloom-${Date.now()}`,
        date: new Date().toISOString(),
        sourceText: text,
        levels: rawLevels.map((l: RawBloomLevel, i: number) => ({
          ...l,
          status: i === 0 ? "open" : "locked",
          questions: l.questions.map((q: string, qIdx: number) => ({
            id: `q-${i}-${qIdx}`,
            text: q,
            chatHistory: [], // Initialize empty chat
          })),
        })),
      };

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: newSession.id,
      }));
    },

    addChatMessage: (sessionId, lIdx, qIdx, message, isCorrect) => {
      set((state) => {
        const session = state.sessions.find((s) => s.id === sessionId);
        if (!session) return state;

        const newLevels = [...session.levels];
        const level = newLevels[lIdx];
        if (!level) return state;

        const currentQuestion = level.questions[qIdx];
        if (!currentQuestion) return state;

        // Append message
        currentQuestion.chatHistory = [
          ...currentQuestion.chatHistory,
          message,
        ];

        // Update correctness if specified (e.g. AI approves it)
        if (isCorrect !== undefined) {
          currentQuestion.isCorrect = isCorrect;
        }

        // Check Level Completion
        const allCorrect = level.questions.every((q) => q.isCorrect);

        if (allCorrect) {
          level.status = "completed";
          const nextLevel = newLevels[lIdx + 1];
          if (nextLevel && nextLevel.status === "locked") {
            nextLevel.status = "open";
          }
        }

        return {
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, levels: newLevels } : s,
          ),
        };
      });
    },

    loadSession: (id) => set({ activeSessionId: id }),

    deleteSession: (id) =>
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSessionId:
          state.activeSessionId === id ? null : state.activeSessionId,
      })),
  }),
  { name: "bloom-trainer" }
);
