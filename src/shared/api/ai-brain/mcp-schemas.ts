import { z } from "zod";

/**
 * Zod schemas for all internal tools
 * Used for runtime validation in ToolRunner
 */

export const PlanningSchemas = {
    sync_somtoday: z.object({}),
    get_schedule: z.object({
        start_date: z.string().describe("ISO date string (YYYY-MM-DD)"),
        end_date: z.string().describe("ISO date string (YYYY-MM-DD)"),
    }),
    create_task: z.object({
        title: z.string().min(3),
        due_date: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    }),
    get_deadlines: z.object({}),
    optimize_schedule: z.object({
        entries: z.array(z.object({
            id: z.string(),
            title: z.string(),
            start_time: z.string(),
            end_time: z.string(),
            priority: z.string().optional(),
        })),
    }),
    sync_calendar: z.object({
        provider: z.string().optional(),
    }),
    track_progress: z.object({
        subject: z.string(),
    }),
    proactive_reminder: z.object({
        context: z.string(),
    }),
};

export const ToolSchemaRegistry: Record<string, z.ZodObject<Record<string, z.ZodTypeAny>>> = {
    ...PlanningSchemas,
    // More categories will be added here
};
