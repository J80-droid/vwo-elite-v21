import { logSystemEvent } from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";

export interface LogEntry {
  id: string;
  message: string;
  level: "info" | "warn" | "error";
  timestamp: number;
  data?: unknown;
}

interface DebugState {
  isOpen: boolean;
  activeTab: "logs" | "database" | "state" | "actions";
  logs: LogEntry[];
  toggle: () => void;
  setTab: (tab: "logs" | "database" | "state" | "actions") => void;
  addLog: (level: LogEntry["level"], message: string, data?: unknown) => void;
  clearLogs: () => void;
  restoreLogs: (logs: LogEntry[]) => void;
}

export const useDebugStore = createStore<DebugState>(
  (set) => ({
    isOpen: false,
    activeTab: "logs",
    logs: [],
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setTab: (activeTab) => set({ activeTab }),
    addLog: (level, message, data) =>
      set((state) => ({
        logs: [
          {
            id: Math.random().toString(36).substring(7),
            level,
            message,
            data,
            timestamp: Date.now(),
          },
          ...state.logs,
        ].slice(0, 100),
      })),
    clearLogs: () => set({ logs: [] }),
    restoreLogs: (logs) => set({ logs: logs.slice(0, 100) }),
  }),
  {
    name: "debug",
    persist: false,
  }
);

// Logger utility for non-hook usage (like in ErrorBoundary)
export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data);
    useDebugStore.getState().addLog("info", message, data);
    logSystemEvent("info", message, data).catch(() => { });
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
    useDebugStore.getState().addLog("warn", message, data);
    logSystemEvent("warn", message, data).catch(() => { });
  },
  error: (message: string, data?: unknown) => {
    console.error(`[ERROR] ${message}`, data);
    useDebugStore.getState().addLog("error", message, data);
    logSystemEvent("error", message, data).catch(() => { });
  },
};

// Log boot up sequence
logger.info("VWO Elite Engine Started", {
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node',
  timestamp: new Date().toISOString()
});
