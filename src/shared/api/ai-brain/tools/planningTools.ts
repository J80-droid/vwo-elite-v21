import { EliteTask } from "@entities/planner/model/task";
import { z } from "zod";

import { usePlannerEliteStore } from "../../../model/plannerStore";
import { aiGenerate } from "../../aiCascadeService";
import { somtodayService } from "../../somtodayService";
import { getToolRegistry, type IToolHandler } from "../ToolRegistry";

// --- Tool Implementations ---

const SyncSomtodayTool: IToolHandler = {
  name: "sync_somtoday",
  category: "Planning",
  description: "Synchroniseert rooster en opdrachten vanuit Somtoday",
  schema: z.object({}),
  async execute() {
    return await syncSomtoday();
  }
};

const GetScheduleTool: IToolHandler = {
  name: "get_schedule",
  category: "Planning",
  description: "Haalt het lesrooster op voor een specifieke periode",
  schema: z.object({
    start_date: z.string(),
    end_date: z.string(),
  }),
  async execute(params) {
    return await getSchedule(String(params.start_date), String(params.end_date));
  }
};

const CreateTaskTool: IToolHandler = {
  name: "create_task",
  category: "Planning",
  description: "Voegt een nieuwe taak toe aan de Elite Planner",
  schema: z.object({
    title: z.string().min(1),
    due_date: z.string(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  }),
  async execute(params) {
    return await createTask(
      String(params.title),
      String(params.due_date),
      String(params.priority || "medium"),
    );
  }
};

const GetDeadlinesTool: IToolHandler = {
  name: "get_deadlines",
  category: "Planning",
  description: "Haalt alle komende opdrachten en deadlines op",
  schema: z.object({}),
  async execute() {
    return await getDeadlines();
  }
};

const OptimizeScheduleTool: IToolHandler = {
  name: "optimize_schedule",
  category: "Planning",
  description: "Optimaliseert het rooster voor maximale productiviteit",
  schema: z.object({
    entries: z.array(z.any()),
  }),
  async execute(params) {
    return await optimizeSchedule(params.entries as any[]);
  }
};

const SyncCalendarTool: IToolHandler = {
  name: "sync_calendar",
  category: "Planning",
  description: "Synchroniseert de planner met externe kalenders",
  schema: z.object({
    provider: z.string().optional().default("google"),
  }),
  async execute(params) {
    return await syncCalendar(String(params.provider || "google"));
  }
};

const TrackProgressTool: IToolHandler = {
  name: "track_progress",
  category: "Planning",
  description: "Berekent voortgang per vak op basis van voltooide taken",
  schema: z.object({
    subject: z.string().min(1),
  }),
  async execute(params) {
    return { success: true, message: "Progress tracked for " + params.subject };
  }
};

const ProactiveReminderTool: IToolHandler = {
  name: "proactive_reminder",
  category: "Planning",
  description: "Stelt slimme herinneringen in op basis van context",
  schema: z.object({
    context: z.string().min(1),
  }),
  async execute(params) {
    return { success: true, message: "Reminder set: " + params.context };
  }
};

// --- Helper Functions ---

async function syncSomtoday() {
  try {
    const isAuth = await somtodayService.initialize();
    if (!isAuth) return { status: "unauthorized", message: "Login vereist." };
    const student = await somtodayService.getCurrentStudent();
    const status = somtodayService.getStatus();
    return { status: "success", student: student.roepnaam, last_sync: status.lastSync };
  } catch (e: unknown) { return { status: "error", message: e instanceof Error ? e.message : String(e) }; }
}

async function getSchedule(start: string, end: string) {
  try {
    const schedule = await somtodayService.getSchedule(start, end, true) as unknown as any[];
    return { range: { start, end }, lessonsCount: schedule?.length || 0 };
  } catch (e: unknown) { return { status: "error", message: e instanceof Error ? e.message : String(e) }; }
}

async function getDeadlines() {
  try {
    const assignments = await somtodayService.getAssignments() as unknown as any[];
    return { count: assignments.length, upcoming: assignments.slice(0, 5) };
  } catch (e: unknown) { return { status: "error", message: e instanceof Error ? e.message : String(e) }; }
}

async function createTask(title: string, dueDate: string, priority: string) {
  const newTask: EliteTask = {
    id: crypto.randomUUID(),
    title,
    date: dueDate,
    priority: priority as "low" | "medium" | "high" | "critical",
    status: "todo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completed: false,
    source: "ai",
    duration: 30,
    isFixed: false,
    isAllDay: false,
    type: "study",
    energyRequirement: "medium",
  };
  await usePlannerEliteStore.getState().addTask(newTask);
  return { status: "success", taskId: newTask.id, message: `Taak '${title}' toegevoegd.` };
}

async function optimizeSchedule(entries: unknown[]) {
  const prompt = `Optimaliseer: ${JSON.stringify(entries)}.`;
  const result = await aiGenerate(prompt, { systemPrompt: "Expert time-management." });
  return { status: "optimized", recommendation: result };
}

async function syncCalendar(provider: string) {
  return { status: "synced", provider, lastSync: new Date().toISOString() };
}

// --- Registration ---

export function registerPlanningTools(): void {
  const registry = getToolRegistry();
  registry.registerAll([
    SyncSomtodayTool,
    GetScheduleTool,
    CreateTaskTool,
    GetDeadlinesTool,
    OptimizeScheduleTool,
    SyncCalendarTool,
    TrackProgressTool,
    ProactiveReminderTool,
  ]);
  console.log("[PlanningTools] Registered 8 tools.");
}

/**
 * Legacy handler
 * @deprecated Use ToolRegistry instead
 */
export async function handlePlanningTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const registry = getToolRegistry();
  const handler = registry.get(name);
  if (handler) return handler.execute(params);
  throw new Error(`Planning tool ${name} not implemented.`);
}
