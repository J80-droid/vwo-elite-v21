import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MotivationState {
  likedQuotes: string[];
  dislikedQuotes: string[];
  history: {
    quote: string;
    action: "like" | "dislike" | "view";
    timestamp: number;
  }[];

  // Actions
  logFeedback: (quote: string, action: "like" | "dislike") => void;
  logView: (quote: string) => void;
  getSentiment: (quote: string) => "liked" | "disliked" | "neutral";
}

export const useMotivationStore = create<MotivationState>()(
  persist(
    (set, get) => ({
      likedQuotes: [],
      dislikedQuotes: [],
      history: [],

      logFeedback: (quote, action) => {
        set((state) => {
          const timestamp = Date.now();
          const newHistory = [
            ...state.history,
            { quote, action, timestamp },
          ].slice(-100); // Keep last 100 interaction

          if (action === "like") {
            return {
              likedQuotes: [...new Set([...state.likedQuotes, quote])],
              dislikedQuotes: state.dislikedQuotes.filter((q) => q !== quote),
              history: newHistory,
            };
          } else {
            return {
              dislikedQuotes: [...new Set([...state.dislikedQuotes, quote])],
              likedQuotes: state.likedQuotes.filter((q) => q !== quote),
              history: newHistory,
            };
          }
        });
      },

      logView: (quote) => {
        set((state) => ({
          history: [
            ...state.history,
            { quote, action: "view" as const, timestamp: Date.now() },
          ].slice(-100),
        }));
      },

      getSentiment: (quote) => {
        const { likedQuotes, dislikedQuotes } = get();
        if (likedQuotes.includes(quote)) return "liked";
        if (dislikedQuotes.includes(quote)) return "disliked";
        return "neutral";
      },
    }),
    {
      name: "elite-motivation-prefs",
    },
  ),
);
