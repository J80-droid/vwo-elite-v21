import { createStore } from "@shared/lib/storeFactory";

interface AIStatusState {
  status: "idle" | "thinking" | "generating" | "error";
  message?: string;
  modelError?: { provider: string; model: string; message: string };
  setStatus: (
    status: "idle" | "thinking" | "generating" | "error",
    message?: string,
  ) => void;
  setModelError: (error: {
    provider: string;
    model: string;
    message: string;
  }) => void;
  clearModelError: () => void;
  clearStatus: () => void;
}

export const useAIStatusStore = createStore<AIStatusState>(
  (set) => ({
    status: "idle",
    setStatus: (status, message) =>
      set({ status, ...(message !== undefined ? { message } : {}) }),
    setModelError: (error) =>
      set({
        status: "error",
        message: `${error.provider}: ${error.message}`,
        modelError: error,
      }),
    clearModelError: () =>
      set((state) => {
        if (state.status === "error") {
          const { message: _m, modelError: _me, ...rest } = state;
          return { ...rest, status: "idle" };
        }
        const { modelError: _me, ...rest } = state;
        return rest;
      }),
    clearStatus: () =>
      set((state) => {
        const { message: _m, modelError: _me, ...rest } = state;
        return { ...rest, status: "idle" };
      }),
  }),
  {
    name: "ai-status",
    persist: false, // UI status doesn't need persistence
  }
);

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  provider: string;
  model: string;
  durationMs: number;
  ttft?: number; // Time to First Token (simulated or real)
  tps: number; // Tokens Per Second
  status: "success" | "error";
  errorType?: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number; // Estimated cost
  systemFingerprint?: string; // Model version identifier from API
}

interface AIAnalyticsState {
  events: TelemetryEvent[];
  addEvent: (event: TelemetryEvent) => void;
  clearHistory: () => void;
  getAggregatedStats: () => {
    totalTokens: number;
    totalRequests: number;
    avgLatency: number;
    avgTps: number;
    errorRate: number;
  };
}

export const useAIAnalyticsStore = createStore<AIAnalyticsState>(
  (set, get) => ({
    events: [],
    addEvent: (event) =>
      set((state) => ({ events: [event, ...state.events].slice(0, 100) })), // Keep last 100 for now
    clearHistory: () => set({ events: [] }),
    getAggregatedStats: () => {
      const { events } = get();
      const totalRequests = events.length;
      if (totalRequests === 0)
        return {
          totalTokens: 0,
          totalRequests: 0,
          avgLatency: 0,
          avgTps: 0,
          errorRate: 0,
        };

      const totalTokens = events.reduce((acc, e) => acc + e.tokens.total, 0);
      const totalLatency = events.reduce((acc, e) => acc + e.durationMs, 0);
      const totalTps = events.reduce((acc, e) => acc + (e.tps || 0), 0);
      const errorCount = events.filter((e) => e.status === "error").length;
      const successCount = totalRequests - errorCount;

      return {
        totalTokens,
        totalRequests,
        avgLatency: totalLatency / totalRequests,
        avgTps: successCount > 0 ? totalTps / successCount : 0,
        errorRate: errorCount / totalRequests,
      };
    },
  }),
  {
    name: "ai-analytics",
    persist: true,
  }
);
