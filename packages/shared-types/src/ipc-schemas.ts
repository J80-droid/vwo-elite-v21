import { z } from "zod";

/**
 * SHARED FRAGMENTS
 */

export const DocMetaSchema = z.object({
    id: z.string().uuid().optional().or(z.string()), // Flexible for now
    title: z.string().min(1),
    uploadDate: z.string(),
    status: z.enum(["indexing", "indexed", "failed"]),
    path: z.string().optional(),
});

export const TaskIntentSchema = z.enum([
    "general_chat",
    "execute_tool",
    "education_help",
    "content_creation",
    "complex_reasoning",
    "code_generation",
    "general" // Compatibility
]);

/**
 * IPC HANDLER ARGUMENTS (VALDIATION & TYPES)
 */

// AI:GENERATE
export const AiGenerateSchema = z.object({
    prompt: z.string().min(1).max(50000), // Elite limit
    options: z.object({
        intent: TaskIntentSchema.optional(),
    }).catchall(z.unknown()).optional(),
});

// DB:SAVE-TUTOR-STATE
export const DbSaveStateSchema = z.object({
    topic: z.string().optional(),
    history: z.array(
        z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
            metadata: z.unknown().optional(),
        }),
    ),
    context: z.unknown().optional(),
});

// DB:QUERY
export const DbQuerySchema = z.object({
    sql: z.string().min(5),
    params: z.array(z.unknown()).optional(),
    method: z.enum(["run", "get", "all"]).optional().default("all"),
});

// TASK:ADD
export const TaskAddSchema = z.object({
    prompt: z.string().min(1),
    intent: z.string().optional().default("general"),
    priority: z.number().optional().default(1),
    isLocal: z.boolean().optional().default(false),
});

// DOC:ADD
export const DocAddSchema = z.tuple([
    z.string().min(1), // filePath
    DocMetaSchema      // meta
]);

// DOC:SEARCH
export const DocSearchSchema = z.string().nullable().optional();

// DOC:DELETE
export const DocDeleteSchema = z.string().min(1);

// CONFIG:UPDATE
export const ConfigUpdateSchema = z.record(z.string(), z.unknown());

// AI:CHECK-ENDPOINT
export const AiCheckEndpointSchema = z.string().url();

// SYS:OPEN-PATH
export const SysOpenPathSchema = z.string().min(1);

/**
 * DERIVED TYPES FOR VWO-API
 */

export type AiGenerateArgs = z.infer<typeof AiGenerateSchema>;
export type DbSaveStateArgs = z.infer<typeof DbSaveStateSchema>;
export type DbQueryArgs = z.infer<typeof DbQuerySchema>;
export type TaskAddArgs = z.infer<typeof TaskAddSchema>;
export type DocMeta = z.infer<typeof DocMetaSchema>;
export type DocAddArgs = z.infer<typeof DocAddSchema>;
