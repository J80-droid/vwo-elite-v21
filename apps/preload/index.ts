import {
  AiCheckEndpointSchema,
  AiGenerateArgs,
  DbQueryArgs,
  DbSaveStateArgs,
  DocAddArgs,
  DocSearchResult,
  IpcChannels,
  TaskAddArgs,
  VwoApi,
} from "@vwo/shared-types";
import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  webUtils,
} from "electron";
import { z } from "zod";

// Performance Start Marker
performance.mark("preload-start");

/**
 * Typed IPC Gateway Bridge
 * Exposes allowed methods and an event subscription system
 */
const api: VwoApi = {
  // Legacy/Generic method calls
  invoke: (channel: string | IpcChannels, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel as string, ...args);
  },

  // Event system
  on: (channel: string | IpcChannels, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel as string, subscription);
    return () => ipcRenderer.removeListener(channel as string, subscription);
  },

  // Hybrid Architecture API
  documents: {
    add: (...args: DocAddArgs) => {
      // args is [filePath, meta]
      return ipcRenderer.invoke(IpcChannels.DOC_ADD, ...args);
    },
    search: (query: z.infer<typeof import("@vwo/shared-types/src/ipc-schemas").DocSearchSchema>) => {
      return ipcRenderer.invoke(IpcChannels.DOC_SEARCH, query) as Promise<
        DocSearchResult[]
      >;
    },
    delete: (id: z.infer<typeof import("@vwo/shared-types/src/ipc-schemas").DocDeleteSchema>) => {
      return ipcRenderer.invoke(IpcChannels.DOC_DELETE, id);
    },
  },
  system: {
    ping: () => {
      return ipcRenderer.invoke(IpcChannels.SYS_PING);
    },
    openPath: (path: z.infer<typeof import("@vwo/shared-types/src/ipc-schemas").SysOpenPathSchema>) => {
      return ipcRenderer.invoke(IpcChannels.SYS_OPEN_PATH, path);
    },
    status: () => {
      return ipcRenderer.invoke(IpcChannels.SYSTEM_STATUS);
    },
    getResourcesPath: () => {
      return ipcRenderer.invoke("sys:get-resources-path");
    },
  },
  ai: {
    generate: (args: AiGenerateArgs) => {
      return ipcRenderer.invoke(IpcChannels.AI_GENERATE, args);
    },
    checkEndpoint: (url: z.infer<typeof AiCheckEndpointSchema>) => {
      return ipcRenderer.invoke(IpcChannels.AI_CHECK_ENDPOINT, url);
    },
  },
  db: {
    query: (params: DbQueryArgs) => {
      return ipcRenderer.invoke(IpcChannels.DB_QUERY, params);
    },
    saveTutorState: (state: DbSaveStateArgs) => {
      return ipcRenderer.invoke(IpcChannels.DB_SAVE_TUTOR_STATE, state) as Promise<boolean>;
    },
    loadTutorState: () => {
      return ipcRenderer.invoke(IpcChannels.DB_LOAD_TUTOR_STATE);
    },
  },
  tasks: {
    add: (task: TaskAddArgs) => {
      return ipcRenderer.invoke(IpcChannels.TASK_ADD, task) as Promise<string>;
    },
    clear: () => {
      return ipcRenderer.invoke(IpcChannels.TASK_CLEAR) as Promise<boolean>;
    },
  },
  utils: {
    getPathForFile: (file: File) => {
      console.log("[Preload] getPathForFile called for:", file.name);
      return webUtils.getPathForFile(file);
    },
    saveKnowledge: (data: string) => {
      return ipcRenderer.invoke(IpcChannels.KNOWLEDGE_SAVE, data) as Promise<boolean>;
    },
    loadKnowledge: () => {
      return ipcRenderer.invoke(IpcChannels.KNOWLEDGE_LOAD) as Promise<string | null>;
    },
  },
  vault: {
    export: () => {
      return ipcRenderer.invoke(IpcChannels.VAULT_EXPORT) as Promise<boolean>;
    },
    import: () => {
      return ipcRenderer.invoke(IpcChannels.VAULT_IMPORT) as Promise<boolean>;
    },
  },
};

console.log("[Preload] vwoApi structure:", {
  hasInvoke: !!api.invoke,
  hasOn: !!api.on,
  hasDocuments: !!api.documents,
  hasDb: !!api.db,
  hasUtils: !!api.utils,
  hasIpcQuery: IpcChannels.DB_QUERY,
  webUtilsAvailable: !!webUtils,
});

try {
  contextBridge.exposeInMainWorld("vwoApi", api);
} catch (error) {
  console.error("Failed to expose vwoApi:", error);
}

performance.mark("preload-done");
performance.measure("preload-bridge-setup", "preload-start", "preload-done");

// Add to global window type
declare global {
  interface Window {
    vwoApi: VwoApi;
  }
}
