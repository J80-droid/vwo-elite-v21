import { create } from "zustand";

import type { AITask, TaskQueueState } from "../../types/ai-brain";

// =============================================================================
// TASK QUEUE STORE (FRONTEND SLAVE)
// =============================================================================

interface TaskQueueActions {
  addTask: (task: Omit<AITask, "id" | "status" | "createdAt">) => string;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
  getTask: (id: string) => AITask | undefined;
  getPendingTasks: () => AITask[];
  updateTask: (id: string, updates: Partial<AITask>) => void;
}

export interface TaskExecutor {
  processLocalQueue: () => Promise<void>;
}

export const getTaskExecutor = (): TaskExecutor => {
  return {
    processLocalQueue: async () => {
      if (typeof window !== "undefined" && window.vwoApi) {
        console.log("[TaskQueue] Triggering local queue processing via IPC...");
        await window.vwoApi.invoke("queue:process_local");
      } else {
        console.warn("[TaskQueue] No VWO API found, cannot process local queue.");
      }
    },
  };
};

export const useTaskQueueStore = create<TaskQueueState & TaskQueueActions>()((
  set,
  get,
) => {
  // Listen for IPC updates from Backend Master
  if (typeof window !== "undefined" && window.vwoApi) {
    window.vwoApi.on("queue:update", (...args: unknown[]) => {
      const data = args[1] as { localQueue?: AITask[]; cloudQueue?: AITask[]; isLocalRunning?: boolean };
      if (!data) return;
      set({
        localQueue: data.localQueue || [],
        cloudQueue: data.cloudQueue || [],
        isLocalRunning: data.isLocalRunning || false,
      });
    });
  }

  return {
    // Initial state
    localQueue: [],
    cloudQueue: [],
    isLocalRunning: false,
    activeCloudTasks: 0,
    maxParallelCloud: 3,

    addTask: (taskData) => {
      const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Optimistic Update: Push to local state immediately for UI snappiness
      const newTask: AITask = {
        ...taskData,
        id,
        status: "pending",
        createdAt: Date.now(),
        steps: []
      };

      set(state => ({
        localQueue: taskData.isLocal ? [...state.localQueue, newTask] : state.localQueue,
        cloudQueue: !taskData.isLocal ? [...state.cloudQueue, newTask] : state.cloudQueue
      }));

      // Send to Backend
      if (typeof window !== "undefined" && window.vwoApi) {
        window.vwoApi.invoke("task:add", { ...taskData, id });
      }
      return id;
    },

    updateTask: (id: string, updates: Partial<AITask>) => {
      // Optimistic update
      set(state => ({
        localQueue: state.localQueue.map(t => t.id === id ? { ...t, ...updates } : t),
        cloudQueue: state.cloudQueue.map(t => t.id === id ? { ...t, ...updates } : t)
      }));

      if (typeof window !== "undefined" && window.vwoApi) {
        window.vwoApi.invoke("task:update", { id, updates });
      }
    },

    removeTask: (id: string) => {
      set(state => ({
        localQueue: state.localQueue.filter(t => t.id !== id),
        cloudQueue: state.cloudQueue.filter(t => t.id !== id)
      }));

      if (typeof window !== "undefined" && window.vwoApi) {
        window.vwoApi.invoke("task:remove", { id });
      }
    },

    clearCompleted: () => {
      set(state => ({
        localQueue: state.localQueue.filter(t => t.status !== "completed"),
        cloudQueue: state.cloudQueue.filter(t => t.status !== "completed")
      }));

      if (typeof window !== "undefined" && window.vwoApi) {
        window.vwoApi.invoke("task:clear");
      }
    },

    // =========================
    // STATUS (READ ONLY FROM STATE)
    // =========================

    getTask: (id) => {
      const state = get();
      return (
        state.localQueue.find((t) => t.id === id) ||
        state.cloudQueue.find((t) => t.id === id)
      );
    },

    getPendingTasks: () => {
      const state = get();
      return [
        ...state.localQueue.filter((t) => t.status === "pending"),
        ...state.cloudQueue.filter((t) => t.status === "pending"),
      ];
    },

    getQueuePosition: (id: string) => {
      // ... (existing logic works on local state)
      const state = get();
      const localIndex = state.localQueue.findIndex((t) => t.id === id);
      if (localIndex !== -1) {
        return state.localQueue
          .slice(0, localIndex + 1)
          .filter((t) => t.status === "pending").length;
      }
      const cloudIndex = state.cloudQueue.findIndex((t) => t.id === id);
      if (cloudIndex !== -1) {
        return state.cloudQueue
          .slice(0, cloudIndex + 1)
          .filter((t) => t.status === "pending").length;
      }
      return -1;
    },
    // Mock methods for compatibility if needed
    startNextLocal: () => null,
    finishLocalTask: () => { },
  };
});

// =============================================================================
// HELPER HOOKS
// =============================================================================

export function usePendingTaskCount(): number {
  const localPending = useTaskQueueStore(
    (s) => s.localQueue.filter((t) => t.status === "pending").length,
  );
  const cloudPending = useTaskQueueStore(
    (s) => s.cloudQueue.filter((t) => t.status === "pending").length,
  );
  return localPending + cloudPending;
}

export function useIsLocalProcessing(): boolean {
  return useTaskQueueStore((s) => s.isLocalRunning);
}

export function useCurrentTask(): AITask | undefined {
  return useTaskQueueStore((s) =>
    s.localQueue.find((t) => t.status === "running"),
  );
}
