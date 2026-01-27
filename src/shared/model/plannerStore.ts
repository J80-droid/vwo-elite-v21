/**
 * Planner Store - Zustand State Management for Planner Elite
 *
 * Uses SQLite for persistent storage (100% future-proof)
 *
 * Manages:
 * - EliteTask items (the new intelligent task format)
 * - PlannerSettings (bio-rhythm, region, preferences)
 * - UnavailableBlocks (recurring busy times)
 */

import {
  DEFAULT_PLANNER_SETTINGS,
  EliteTask,
  PlannerSettings,
  UnavailableBlock,
  WeeklyReview,
} from "@entities/planner/model/task";
import {
  mapAfspraakToEliteTask,
  somtodayService,
} from "@shared/api/somtodayService";
import {
  deletePersonalTaskSQL,
  deleteUnavailableBlockSQL,
  getAllPersonalTasksSQL,
  getAllUnavailableBlocksSQL,
  getAllWeeklyReviewsSQL,
  getPlannerSettingsSQL,
  saveBulkPersonalTasksSQL,
  savePlannerSettingsSQL,
  saveUnavailableBlockSQL,
  saveWeeklyReviewSQL,
} from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";

// ===== HELPERS =====
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ===== STATE INTERFACE =====
interface PlannerEliteState {
  // Data
  tasks: EliteTask[];
  settings: PlannerSettings;
  unavailableBlocks: UnavailableBlock[];
  weeklyReviews: WeeklyReview[];

  // UI State
  activeModule: string;
  selectedTaskId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  lastSync: string | null;

  // Generator UI State (Shared between modules)
  generatorSubject: string;
  generatorExamDate: string;

  // Actions
  setActiveModule: (module: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setGeneratorSubject: (subject: string) => void;
  setGeneratorExamDate: (date: string) => void;

  // Initialization
  initialize: () => Promise<void>;

  // Task Actions
  addTask: (task: EliteTask) => Promise<void>;
  addTasks: (tasks: EliteTask[]) => Promise<void>;
  updateTask: (id: string, updates: Partial<EliteTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;

  // Bulk Operations
  importTasks: (tasks: EliteTask[], replace?: boolean) => Promise<void>;
  rescheduleTask: (
    id: string,
    newDate: string,
    newTime?: string,
  ) => Promise<void>;
  setAllTasks: (tasks: EliteTask[]) => Promise<void>;
  rescheduleNonCriticalTasks: (
    startDate: string,
    endDate: string,
  ) => Promise<void>;

  // Settings Actions
  updateSettings: (updates: Partial<PlannerSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Unavailable Blocks
  addUnavailableBlock: (block: UnavailableBlock) => Promise<void>;
  removeUnavailableBlock: (id: string) => Promise<void>;

  // Weekly Review Actions
  saveWeeklyReview: (review: WeeklyReview) => Promise<void>;
  completeWeeklyReview: (
    id: string,
    rating: number,
    notes: string,
  ) => Promise<void>;

  // UI Actions
  selectTask: (id: string | null) => void;

  // Background Actions
  autoSyncSomtoday: () => Promise<void>;
  clearSomtodayTasks: () => Promise<void>;
  replaceSomtodayTasks: (newTasks: EliteTask[]) => Promise<void>;
}

// ===== STORE IMPLEMENTATION =====
export const usePlannerEliteStore = createStore<PlannerEliteState>(
  (set, get) => ({
    // Initial state
    tasks: [],
    settings: DEFAULT_PLANNER_SETTINGS,
    unavailableBlocks: [],
    weeklyReviews: [],
    activeModule: "calendar",
    selectedTaskId: null,
    isLoading: true,
    isInitialized: false,
    lastSync: null,
    generatorSubject: "",
    generatorExamDate: "",

    setActiveModule: (module) => set({ activeModule: module }),
    setSelectedTaskId: (id) => set({ selectedTaskId: id }),
    setGeneratorSubject: (subject) => set({ generatorSubject: subject }),
    setGeneratorExamDate: (date) => set({ generatorExamDate: date }),

    // ===== INITIALIZATION =====
    initialize: async () => {
      if (get().isInitialized) return;

      set({ isLoading: true });

      try {
        // 1. Load Personal/Manual Tasks from SQL
        const personalTasks = await getAllPersonalTasksSQL();

        // 2. Load Somtoday Schedule (Persistent Cache)
        const today = new Date();
        const startStr = getLocalDateStr(
          new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        );
        const endStr = getLocalDateStr(
          new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        );

        const somtodayAppointments = await somtodayService.getSchedule(
          startStr,
          endStr,
        );
        const mappedSomtoday = (somtodayAppointments || []).map(
          mapAfspraakToEliteTask,
        );

        // 3. Load Settings & History
        const [settings, blocks, reviews] = await Promise.all([
          getPlannerSettingsSQL(),
          getAllUnavailableBlocksSQL(),
          getAllWeeklyReviewsSQL(),
        ]);

        // 4. Strict de-duplication helper
        const ensureUnique = (items: EliteTask[]): EliteTask[] => {
          const seen = new Set<string>();
          return items.filter((item) => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        };

        const allTasks = ensureUnique([...personalTasks, ...mappedSomtoday]);

        set({
          tasks: allTasks,
          settings: settings
            ? { ...DEFAULT_PLANNER_SETTINGS, ...settings }
            : DEFAULT_PLANNER_SETTINGS,
          unavailableBlocks: blocks as UnavailableBlock[],
          weeklyReviews: reviews as WeeklyReview[],
          isInitialized: true,
          isLoading: false,
          lastSync: new Date().toISOString(),
        });

        console.log(
          `[PlannerStore] Initialized with ${allTasks.length} unique tasks`,
        );
      } catch (error) {
        console.error("[PlannerStore] Failed to initialize:", error);
        set({ isLoading: false, isInitialized: true });
      }
    },

    // ===== TASK ACTIONS =====
    addTask: async (task) => {
      // Ensure initialized
      if (!get().isInitialized) await get().initialize();

      const tasksToSave = [task];

      // Handle Recurrence
      if (task.recurrencePattern && task.recurrenceEndDate) {
        const nextDate = new Date(task.date);
        const endDate = new Date(task.recurrenceEndDate);

        // Safety limit: max 50 instances
        let count = 0;
        while (count < 50) {
          if (task.recurrencePattern === "daily")
            nextDate.setDate(nextDate.getDate() + 1);
          else if (task.recurrencePattern === "weekly")
            nextDate.setDate(nextDate.getDate() + 7);
          else if (task.recurrencePattern === "biweekly")
            nextDate.setDate(nextDate.getDate() + 14);
          else if (task.recurrencePattern === "monthly")
            nextDate.setMonth(nextDate.getMonth() + 1);

          if (nextDate > endDate) break;

          const newTask: EliteTask = {
            ...task,
            id: crypto.randomUUID(),
            date: getLocalDateStr(nextDate),
            parentTaskId: task.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          tasksToSave.push(newTask);
          count++;
        }
      }

      // Optimistic update
      set((state) => ({
        tasks: [...state.tasks, ...tasksToSave],
        lastSync: new Date().toISOString(),
      }));

      // Persist to SQLite (Personal/Manual only)
      await saveBulkPersonalTasksSQL(tasksToSave);
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    addTasks: async (newTasks) => {
      if (!get().isInitialized) await get().initialize();

      set((state) => ({
        tasks: [...state.tasks, ...newTasks],
        lastSync: new Date().toISOString(),
      }));

      // Persist all
      const somtodayTasks = newTasks.filter((t) => t.id.startsWith("somtoday-"));
      const personalTasks = newTasks.filter((t) => !t.id.startsWith("somtoday-"));

      if (personalTasks.length > 0) {
        await saveBulkPersonalTasksSQL(personalTasks);
      }
      if (somtodayTasks.length > 0) {
        // Somtoday tasks are persisted by the service during fetch
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    updateTask: async (id, updates) => {
      if (!get().isInitialized) await get().initialize();

      const updatedAt = new Date().toISOString();

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt } : task,
        ),
        lastSync: updatedAt,
      }));

      // Find and save updated task
      const updatedTask = get().tasks.find((t) => t.id === id);
      if (updatedTask) {
        if (updatedTask.id.startsWith("somtoday-")) {
          // If it's a Somtoday task, we usually don't allow edits
          // but just in case, we'd save to schedule table
          // However, for simplicity here, we focus on manual tasks.
        } else {
          await saveBulkPersonalTasksSQL([updatedTask]);
        }
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    deleteTask: async (id) => {
      if (!get().isInitialized) await get().initialize();

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        lastSync: new Date().toISOString(),
      }));

      // Delete from SQLite (Personal only)
      if (!id.startsWith("somtoday-")) {
        await deletePersonalTaskSQL(id);
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    toggleComplete: async (id) => {
      if (!get().isInitialized) await get().initialize();

      const now = new Date().toISOString();

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
              ...task,
              completed: !task.completed,
              status: !task.completed ? "done" : "todo",
              completedAt: !task.completed ? now : undefined,
              updatedAt: now,
            }
            : task,
        ),
        lastSync: now,
      }));

      const updatedTask = get().tasks.find((t) => t.id === id);
      if (updatedTask && !updatedTask.id.startsWith("somtoday-")) {
        await saveBulkPersonalTasksSQL([updatedTask]);
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    clearCompleted: async () => {
      if (!get().isInitialized) await get().initialize();

      const completedPersonalIds = get()
        .tasks.filter((t) => t.completed && !t.id.startsWith("somtoday-"))
        .map((t) => t.id);

      set((state) => ({
        tasks: state.tasks.filter(
          (task) => !task.completed || task.id.startsWith("somtoday-"),
        ),
        lastSync: new Date().toISOString(),
      }));

      // Delete from SQLite
      for (const id of completedPersonalIds) {
        await deletePersonalTaskSQL(id);
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    // ===== BULK OPERATIONS =====
    importTasks: async (newTasks, replace = false) => {
      if (!get().isInitialized) await get().initialize();

      if (replace) {
        // Delete all existing personal tasks
        const personalTasks = get().tasks.filter(
          (t) => !t.id.startsWith("somtoday-"),
        );
        for (const task of personalTasks) {
          await deletePersonalTaskSQL(task.id);
        }
      }

      set((state) => ({
        tasks: replace
          ? [
            ...state.tasks.filter((t) => t.id.startsWith("somtoday-")),
            ...newTasks,
          ]
          : [...state.tasks, ...newTasks],
        lastSync: new Date().toISOString(),
      }));

      // Save new personal tasks
      const newPersonal = newTasks.filter((t) => !t.id.startsWith("somtoday-"));
      if (newPersonal.length > 0) {
        await saveBulkPersonalTasksSQL(newPersonal);
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    rescheduleTask: async (id, newDate, newTime) => {
      if (!get().isInitialized) await get().initialize();

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
              ...task,
              date: newDate,
              startTime: newTime || task.startTime,
              updatedAt: new Date().toISOString(),
              rescheduleCount: (task.rescheduleCount || 0) + 1,
            }
            : task,
        ),
        lastSync: new Date().toISOString(),
      }));

      const updatedTask = get().tasks.find((t) => t.id === id);
      if (updatedTask && !updatedTask.id.startsWith("somtoday-")) {
        await saveBulkPersonalTasksSQL([updatedTask]);
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    // Panic Mode: Move non-critical tasks to next week
    rescheduleNonCriticalTasks: async (startDate, endDate) => {
      if (!get().isInitialized) await get().initialize();

      const tasksToMove = get().tasks.filter(
        (t) =>
          t.date >= startDate &&
          t.date <= endDate &&
          t.priority !== "critical" &&
          !t.completed &&
          !t.isFixed,
      );

      if (tasksToMove.length === 0) return;

      console.log(`[PanicMode] Moving ${tasksToMove.length} tasks to next week.`);

      // Update in memory
      set((state) => ({
        tasks: state.tasks.map((task) => {
          const shouldMove = tasksToMove.some((tm) => tm.id === task.id);
          if (shouldMove) {
            const originalDate = new Date(task.date);
            originalDate.setDate(originalDate.getDate() + 7);
            return {
              ...task,
              date: originalDate.toISOString().split("T")[0]!,
              updatedAt: new Date().toISOString(),
            };
          }
          return task;
        }),
        lastSync: new Date().toISOString(),
      }));

      // Persist
      const updatedTasks = tasksToMove
        .map((tm) => get().tasks.find((t) => t.id === tm.id))
        .filter(Boolean) as EliteTask[];
      const personalToSave = updatedTasks.filter(
        (t) => !t.id.startsWith("somtoday-"),
      );
      if (personalToSave.length > 0) {
        await saveBulkPersonalTasksSQL(personalToSave);
      }
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    setAllTasks: async (tasks) => {
      if (!get().isInitialized) await get().initialize();

      // Save personal tasks only
      const personalTasks = tasks.filter((t) => !t.id.startsWith("somtoday-"));
      if (personalTasks.length > 0) {
        await saveBulkPersonalTasksSQL(personalTasks);
      }

      set({
        tasks,
        lastSync: new Date().toISOString(),
      });
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    // ===== SETTINGS ACTIONS =====
    updateSettings: async (updates) => {
      if (!get().isInitialized) await get().initialize();

      const newSettings = { ...get().settings, ...updates };
      set({ settings: newSettings });
      await savePlannerSettingsSQL(newSettings);
    },

    resetSettings: async () => {
      set({ settings: DEFAULT_PLANNER_SETTINGS });
      await savePlannerSettingsSQL(DEFAULT_PLANNER_SETTINGS);
    },

    // ===== UNAVAILABLE BLOCKS =====
    addUnavailableBlock: async (block) => {
      if (!get().isInitialized) await get().initialize();

      set((state) => ({
        unavailableBlocks: [...state.unavailableBlocks, block],
      }));
      await saveUnavailableBlockSQL(block);
    },

    removeUnavailableBlock: async (id) => {
      if (!get().isInitialized) await get().initialize();

      set((state) => ({
        unavailableBlocks: state.unavailableBlocks.filter((b) => b.id !== id),
      }));
      await deleteUnavailableBlockSQL(id);
    },

    saveWeeklyReview: async (review) => {
      if (!get().isInitialized) await get().initialize();

      set((state) => ({
        weeklyReviews: [
          ...state.weeklyReviews.filter((r) => r.id !== review.id),
          review,
        ],
      }));
      await saveWeeklyReviewSQL(review);
    },

    completeWeeklyReview: async (id, rating, notes) => {
      if (!get().isInitialized) await get().initialize();

      const review: WeeklyReview = {
        id,
        date: id,
        good: `Rating: ${rating}/5`,
        bad: "",
        plan: notes,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      set((state) => ({
        weeklyReviews: [
          ...state.weeklyReviews.filter((r) => r.id !== id),
          review,
        ],
      }));

      await saveWeeklyReviewSQL(review);
    },

    // ===== UI ACTIONS =====
    selectTask: (id) => {
      set({ selectedTaskId: id });
    },

    // ===== BACKGROUND ACTIONS =====
    clearSomtodayTasks: async () => {
      if (!get().isInitialized) await get().initialize();

      const somtodayTasks = get().tasks.filter((t) =>
        t.id.startsWith("somtoday-"),
      );
      console.log(
        `[Store] Clearing ${somtodayTasks.length} Somtoday tasks from state (skipping SQLite for speed)...`,
      );

      // Delete from state ONLY (instant) - skip SQLite for now
      set((state) => ({
        tasks: state.tasks.filter((t) => !t.id.startsWith("somtoday-")),
        lastSync: new Date().toISOString(),
      }));

      console.log("[Store] Somtoday tasks cleared from state!");
      window.dispatchEvent(new Event("plannerUpdated"));
    },

    replaceSomtodayTasks: async (newTasks: EliteTask[]) => {
      if (!get().isInitialized) await get().initialize();

      console.log(
        `[Store] Atomically replacing Somtoday tasks with ${newTasks.length} items`,
      );

      // De-duplicate newTasks internally (just in case API returns duplicates)
      const uniqueNewTasks: EliteTask[] = [];
      const seenIds = new Set<string>();

      for (const task of newTasks) {
        if (!seenIds.has(task.id)) {
          seenIds.add(task.id);
          uniqueNewTasks.push(task);
        }
      }

      if (uniqueNewTasks.length !== newTasks.length) {
        console.warn(
          `[Store] Removed ${newTasks.length - uniqueNewTasks.length} duplicate appointments from Sync`,
        );
      }

      set((state) => ({
        // 1. Remove old Somtoday tasks
        // 2. Add new unique tasks
        // 3. Keep manual tasks
        tasks: [
          ...state.tasks.filter((t) => !t.id.startsWith("somtoday-")),
          ...uniqueNewTasks,
        ],
        lastSync: new Date().toISOString(),
      }));

      window.dispatchEvent(new Event("plannerUpdated"));
    },

    autoSyncSomtoday: async () => {
      const { isInitialized } = get();
      if (!isInitialized) {
        console.log("[Store] Skipping sync: store not initialized");
        return;
      }

      // Initialize (Try to refresh session if needed)
      const isConnected = await somtodayService.initialize();
      if (!isConnected) {
        console.log(
          "[Store] Skipping sync: Somtoday not connected (or session expired)",
        );
        return;
      }

      // Get fresh status after init
      const status = somtodayService.getStatus();
      const lastSyncStr = status.lastSync;
      if (lastSyncStr) {
        const lastSync = new Date(lastSyncStr);
        const now = new Date();
        const diffMs = now.getTime() - lastSync.getTime();
        const diffMins = diffMs / (1000 * 60);
        if (diffMins < 5) {
          console.log(
            "[Store] Skipping auto-sync, last sync was",
            Math.round(diffMins),
            "mins ago",
          );
          return;
        }
      }

      console.log("[Store] Starting background Somtoday sync...");
      try {
        // Get schedule for next 30 days
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);

        const schedule = await somtodayService.getSchedule(
          getLocalDateStr(today),
          getLocalDateStr(endDate),
        );

        if (schedule && schedule.length > 0) {
          // Map to EliteTasks and filter out ones we already have by ID
          // IMPORTANT: Fetch latest tasks from state to avoid using stale 'tasks' from closure
          const currentTasks = get().tasks;
          const existingIds = new Set(currentTasks.map((t) => t.id));
          const newTasks = schedule
            .map(mapAfspraakToEliteTask)
            .filter((t) => !existingIds.has(t.id));

          if (newTasks.length > 0) {
            console.log(
              `[Store] Background sync found ${newTasks.length} new tasks`,
            );
            set((state) => {
              const uniqueIds = new Set(state.tasks.map((t) => t.id));
              const filteredNew = newTasks.filter((t) => !uniqueIds.has(t.id));
              return {
                tasks: [...state.tasks, ...filteredNew],
                lastSync: new Date().toISOString(),
              };
            });
            window.dispatchEvent(new Event("plannerUpdated"));
          } else {
            console.log("[Store] Background sync: No new tasks found");
          }
        }
      } catch (error) {
        console.error("[Store] Background Somtoday sync failed:", error);
      }
    },
  }),
  {
    name: "planner-elite",
    persist: false, // SQLite handles persistence
  }
);

// ===== SELECTORS =====

/**
 * Get tasks for a specific date
 */
export const selectTasksByDate = (date: string) => (state: PlannerEliteState) =>
  state.tasks.filter((t) => t.date === date);

/**
 * Get upcoming tasks (next 7 days)
 */
export const selectUpcomingTasks = (state: PlannerEliteState) => {
  const today = new Date().toISOString().split("T")[0]!;
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const endDate = weekLater.toISOString().split("T")[0]!;

  return state.tasks
    .filter((t) => t.date >= today && t.date <= endDate && !t.completed)
    .sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
};

/**
 * Get overdue tasks
 */
export const selectOverdueTasks = (state: PlannerEliteState) => {
  const today = new Date().toISOString().split("T")[0]!;
  return state.tasks.filter((t) => t.date < today && !t.completed);
};

/**
 * Get tasks by subject
 */
export const selectTasksBySubject =
  (subject: string) => (state: PlannerEliteState) =>
    state.tasks.filter(
      (t) => t.subject?.toLowerCase() === subject.toLowerCase(),
    );

/**
 * Get tasks needing repair (from repair loop)
 */
export const selectRepairTasks = (state: PlannerEliteState) =>
  state.tasks.filter((t) => t.type === "repair" && !t.completed);

/**
 * Get high-priority tasks
 */
export const selectHighPriorityTasks = (state: PlannerEliteState) =>
  state.tasks.filter(
    (t) => (t.priority === "critical" || t.priority === "high") && !t.completed,
  );

// End of file
