import { z } from "zod";

import { DocSearchResult } from "./db";
import {
  AiCheckEndpointSchema,
  AiGenerateArgs,
  DbQueryArgs,
  DbSaveStateArgs,
  DocAddArgs,
  TaskAddArgs,
} from "./ipc-schemas";

// Specific channel names
export enum IpcChannels {
  // Document Handlers
  DOC_ADD = "doc:add",
  DOC_SEARCH = "doc:search",
  DOC_DELETE = "doc:delete",
  DOC_PROGRESS = "doc:progress", // Event

  // AI & Orchestrator
  AI_GENERATE = "ai:generate",
  AI_CHECK_ENDPOINT = "ai:check-endpoint",
  ORCHESTRATOR_EXECUTE = "orchestrator:execute",
  ORCHESTRATOR_ROUTING_DECISION = "orchestrator:routing_decision", // Event
  ORCHESTRATOR_MODELS_UPDATED = "orchestrator:models_updated", // Event

  // Database
  DB_SAVE_TUTOR_STATE = "db:save-tutor-state",
  DB_LOAD_TUTOR_STATE = "db:load-tutor-state",
  DB_QUERY = "db:query",

  // Tasks
  TASK_ADD = "task:add",
  TASK_UPDATE = "task:update",
  TASK_REMOVE = "task:remove",
  TASK_CLEAR = "task:clear",
  QUEUE_PROCESS_LOCAL = "queue:process_local",
  QUEUE_UPDATE = "queue:update", // Event

  // System & Config
  SYS_PING = "sys:ping",
  SYS_OPEN_PATH = "sys:open-path",
  SYSTEM_STATUS = "system:status",
  CONFIG_UPDATE = "config:update",

  // Performance
  PERF_TRACE_START = "perf:trace-start",
  PERF_TRACE_STOP = "perf:trace-stop",

  // Knowledge System (Filesystem Caching)
  KNOWLEDGE_SAVE = "knowledge:save",
  KNOWLEDGE_LOAD = "knowledge:load",

  // Window Controls
  WINDOW_MINIMIZE = "window:minimize",
  WINDOW_MAXIMIZE = "window:maximize",
  WINDOW_CLOSE = "window:close",
  WINDOW_IS_MAXIMIZED = "window:is-maximized",

  // Elite Vault (Physical Backup)
  VAULT_EXPORT = "vault:export",
  VAULT_IMPORT = "vault:import",
}

// Interface that window.vwoApi will implement
export interface VwoApi {
  // Generic invoke method
  invoke: (channel: string | IpcChannels, ...args: unknown[]) => Promise<unknown>;

  // Event Listener (e.g. for progress updates)
  on: (channel: string | IpcChannels, callback: (...args: unknown[]) => void) => () => void;

  documents: {
    add: (...args: DocAddArgs) => Promise<unknown>;
    search: (query: z.infer<typeof import("./ipc-schemas").DocSearchSchema>) => Promise<DocSearchResult[]>;
    delete: (id: z.infer<typeof import("./ipc-schemas").DocDeleteSchema>) => Promise<boolean>;
  };
  system: {
    ping: () => Promise<string>;
    openPath: (path: z.infer<typeof import("./ipc-schemas").SysOpenPathSchema>) => Promise<boolean>;
    status: () => Promise<unknown>;
    getResourcesPath: () => Promise<string>;
  };
  ai: {
    generate: (args: AiGenerateArgs) => Promise<unknown>;
    checkEndpoint: (url: z.infer<typeof AiCheckEndpointSchema>) => Promise<boolean>;
  };
  db: {
    query: (params: DbQueryArgs) => Promise<unknown>;
    saveTutorState: (state: DbSaveStateArgs) => Promise<boolean>;
    loadTutorState: () => Promise<unknown>;
  };
  tasks: {
    add: (task: TaskAddArgs) => Promise<string>;
    clear: () => Promise<boolean>;
  };
  utils: {
    getPathForFile: (file: File) => string;
    saveKnowledge: (data: string) => Promise<boolean>;
    loadKnowledge: () => Promise<string | null>;
  };
  vault: {
    export: () => Promise<boolean>;
    import: () => Promise<boolean>;
  };
}
