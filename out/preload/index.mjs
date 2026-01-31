import { z } from "zod";
import { webUtils, contextBridge, ipcRenderer } from "electron";
var IpcChannels = /* @__PURE__ */ ((IpcChannels2) => {
  IpcChannels2["DOC_ADD"] = "doc:add";
  IpcChannels2["DOC_SEARCH"] = "doc:search";
  IpcChannels2["DOC_DELETE"] = "doc:delete";
  IpcChannels2["DOC_PROGRESS"] = "doc:progress";
  IpcChannels2["AI_GENERATE"] = "ai:generate";
  IpcChannels2["AI_CHECK_ENDPOINT"] = "ai:check-endpoint";
  IpcChannels2["ORCHESTRATOR_EXECUTE"] = "orchestrator:execute";
  IpcChannels2["ORCHESTRATOR_ROUTING_DECISION"] = "orchestrator:routing_decision";
  IpcChannels2["ORCHESTRATOR_MODELS_UPDATED"] = "orchestrator:models_updated";
  IpcChannels2["DB_SAVE_TUTOR_STATE"] = "db:save-tutor-state";
  IpcChannels2["DB_LOAD_TUTOR_STATE"] = "db:load-tutor-state";
  IpcChannels2["DB_QUERY"] = "db:query";
  IpcChannels2["TASK_ADD"] = "task:add";
  IpcChannels2["TASK_UPDATE"] = "task:update";
  IpcChannels2["TASK_REMOVE"] = "task:remove";
  IpcChannels2["TASK_CLEAR"] = "task:clear";
  IpcChannels2["QUEUE_PROCESS_LOCAL"] = "queue:process_local";
  IpcChannels2["QUEUE_UPDATE"] = "queue:update";
  IpcChannels2["SYS_PING"] = "sys:ping";
  IpcChannels2["SYS_OPEN_PATH"] = "sys:open-path";
  IpcChannels2["SYS_FETCH_URL"] = "sys:fetch-url";
  IpcChannels2["SYSTEM_STATUS"] = "system:status";
  IpcChannels2["CONFIG_UPDATE"] = "config:update";
  IpcChannels2["PERF_TRACE_START"] = "perf:trace-start";
  IpcChannels2["PERF_TRACE_STOP"] = "perf:trace-stop";
  IpcChannels2["KNOWLEDGE_SAVE"] = "knowledge:save";
  IpcChannels2["KNOWLEDGE_LOAD"] = "knowledge:load";
  IpcChannels2["WINDOW_MINIMIZE"] = "window:minimize";
  IpcChannels2["WINDOW_MAXIMIZE"] = "window:maximize";
  IpcChannels2["WINDOW_CLOSE"] = "window:close";
  IpcChannels2["WINDOW_IS_MAXIMIZED"] = "window:is-maximized";
  IpcChannels2["VAULT_EXPORT"] = "vault:export";
  IpcChannels2["VAULT_IMPORT"] = "vault:import";
  return IpcChannels2;
})(IpcChannels || {});
const DocMetaSchema = z.object({
  id: z.string().uuid().optional().or(z.string()),
  // Flexible for now
  title: z.string().min(1),
  uploadDate: z.string(),
  status: z.enum(["indexing", "indexed", "failed"]),
  path: z.string().optional()
});
const TaskIntentSchema = z.enum([
  "general_chat",
  "execute_tool",
  "education_help",
  "content_creation",
  "complex_reasoning",
  "code_generation",
  "general"
  // Compatibility
]);
z.object({
  prompt: z.string().min(1).max(5e4),
  // Elite limit
  options: z.object({
    intent: TaskIntentSchema.optional()
  }).catchall(z.unknown()).optional()
});
z.object({
  topic: z.string().optional(),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      metadata: z.unknown().optional()
    })
  ),
  context: z.unknown().optional()
});
z.object({
  sql: z.string().min(5),
  params: z.array(z.unknown()).optional(),
  method: z.enum(["run", "get", "all"]).optional().default("all")
});
z.object({
  prompt: z.string().min(1),
  intent: z.string().optional().default("general"),
  priority: z.number().optional().default(1),
  isLocal: z.boolean().optional().default(false)
});
z.tuple([
  z.string().min(1),
  // filePath
  DocMetaSchema
  // meta
]);
z.string().nullable().optional();
z.string().min(1);
z.record(z.string(), z.unknown());
z.string().url();
z.string().min(1);
z.object({
  url: z.string().url(),
  options: z.record(z.string(), z.unknown()).optional()
});
performance.mark("preload-start");
const api = {
  // Legacy/Generic method calls
  invoke: (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  // Event system
  on: (channel, callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  // Hybrid Architecture API
  documents: {
    add: (...args) => {
      return ipcRenderer.invoke(IpcChannels.DOC_ADD, ...args);
    },
    search: (query) => {
      return ipcRenderer.invoke(IpcChannels.DOC_SEARCH, query);
    },
    delete: (id) => {
      return ipcRenderer.invoke(IpcChannels.DOC_DELETE, id);
    }
  },
  system: {
    ping: () => {
      return ipcRenderer.invoke(IpcChannels.SYS_PING);
    },
    openPath: (path) => {
      return ipcRenderer.invoke(IpcChannels.SYS_OPEN_PATH, path);
    },
    status: () => {
      return ipcRenderer.invoke(IpcChannels.SYSTEM_STATUS);
    },
    getResourcesPath: () => {
      return ipcRenderer.invoke("sys:get-resources-path");
    },
    fetchUrl: (url, options) => {
      return ipcRenderer.invoke(IpcChannels.SYS_FETCH_URL, { url, options });
    }
  },
  ai: {
    generate: (args) => {
      return ipcRenderer.invoke(IpcChannels.AI_GENERATE, args);
    },
    checkEndpoint: (url) => {
      return ipcRenderer.invoke(IpcChannels.AI_CHECK_ENDPOINT, url);
    }
  },
  db: {
    query: (params) => {
      return ipcRenderer.invoke(IpcChannels.DB_QUERY, params);
    },
    saveTutorState: (state) => {
      return ipcRenderer.invoke(IpcChannels.DB_SAVE_TUTOR_STATE, state);
    },
    loadTutorState: () => {
      return ipcRenderer.invoke(IpcChannels.DB_LOAD_TUTOR_STATE);
    }
  },
  tasks: {
    add: (task) => {
      return ipcRenderer.invoke(IpcChannels.TASK_ADD, task);
    },
    clear: () => {
      return ipcRenderer.invoke(IpcChannels.TASK_CLEAR);
    }
  },
  utils: {
    getPathForFile: (file) => {
      console.log("[Preload] getPathForFile called for:", file.name);
      return webUtils.getPathForFile(file);
    },
    saveKnowledge: (data) => {
      return ipcRenderer.invoke(IpcChannels.KNOWLEDGE_SAVE, data);
    },
    loadKnowledge: () => {
      return ipcRenderer.invoke(IpcChannels.KNOWLEDGE_LOAD);
    }
  },
  vault: {
    export: () => {
      return ipcRenderer.invoke(IpcChannels.VAULT_EXPORT);
    },
    import: () => {
      return ipcRenderer.invoke(IpcChannels.VAULT_IMPORT);
    }
  }
};
console.log("[Preload] vwoApi structure:", {
  hasInvoke: !!api.invoke,
  hasOn: !!api.on,
  hasDocuments: !!api.documents,
  hasDb: !!api.db,
  hasUtils: !!api.utils,
  hasIpcQuery: IpcChannels.DB_QUERY,
  webUtilsAvailable: !!webUtils
});
try {
  contextBridge.exposeInMainWorld("vwoApi", api);
} catch (error) {
  console.error("Failed to expose vwoApi:", error);
}
performance.mark("preload-done");
performance.measure("preload-bridge-setup", "preload-start", "preload-done");
