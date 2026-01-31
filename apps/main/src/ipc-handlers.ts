import {
  AiCheckEndpointSchema,
  AiGenerateSchema,
  ConfigUpdateSchema,
  DbQuerySchema,
  DbSaveStateSchema,
  DocAddSchema,
  DocDeleteSchema,
  DocMeta,
  DocSearchSchema,
  IpcChannels,
  SysFetchUrlSchema,
  SysOpenPathSchema,
  TaskAddSchema,
} from "@vwo/shared-types";
import { app, BrowserWindow, contentTracing, dialog, ipcMain, type IpcMainInvokeEvent } from "electron";

import { getOrchestrator } from "./ai-brain";
import { taskQueueManager } from "./ai-brain/TaskQueueManager";
import { getMainDb } from "./db/sqlite";
import { DatabaseFactory } from "./infrastructure/database/database.factory";
import { DocumentRepository } from "./repositories/document.repository";
import { AIService } from "./services/ai.service";
import { IngestionService } from "./services/ingestion.service";
import { safeLog } from "./utils/safe-logger";
import { createVault, extractVault } from "./utils/vault-utils";

let handlersRegistered = false;

export function registerIpcHandlers() {
  if (handlersRegistered) {
    safeLog.log("[IPC] Handlers already registered, skipping.");
    return;
  }
  handlersRegistered = true;

  safeLog.log("[IPC] Registering all handlers...");
  safeLog.log(`[IPC] DB_QUERY channel value: ${IpcChannels.DB_QUERY}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeHandle = (channel: string, handler: (event: IpcMainInvokeEvent, ...args: any[]) => any) => {
    try {
      ipcMain.removeHandler(channel);
      ipcMain.handle(channel, handler);
      safeLog.log(`[IPC] Successfully registered handler for: ${channel}`);
    } catch (e) {
      safeLog.error(`[IPC] Failed to register handler for ${channel}:`, e);
    }
  };

  // Setup Orchestrator Event Bridging
  const orchestrator = getOrchestrator();

  const handleRoutingDecision = (data: unknown) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed())
        win.webContents.send("orchestrator:routing_decision", data);
    });
  };

  orchestrator.on("routing_decision", handleRoutingDecision);

  // AI Generation Handler
  safeHandle(
    IpcChannels.AI_GENERATE,
    async (_event: IpcMainInvokeEvent, args: unknown) => {
      try {
        getOrchestrator().emit("activity", {
          type: "ipc_call",
          channel: IpcChannels.AI_GENERATE,
        });

        // Validate Logic
        const validation = AiGenerateSchema.safeParse(args);
        if (!validation.success) {
          safeLog.error("[IPC] Invalid arguments:", validation.error);
          throw new Error("Invalid arguments: " + validation.error.message);
        }

        const { prompt, options } = validation.data;
        const orchestratorInstance = getOrchestrator();

        // Cast to match internal orchestrator types if needed, or update orchestrator types
        // The shared schema is looser (Record<string, unknown>) for options catchall
        const response = await orchestratorInstance.execute(
          prompt,
          options as Record<string, unknown>,
        );

        return { response };
      } catch (error) {
        safeLog.error("[IPC] AI Generation error:", error);
        throw error; // Re-throw to be caught by frontend
      }
    },
  );

  // Persistence Handlers
  safeHandle(
    IpcChannels.DB_SAVE_TUTOR_STATE,
    async (_event: IpcMainInvokeEvent, state: unknown) => {
      try {
        const validation = DbSaveStateSchema.safeParse(state);
        if (!validation.success) {
          safeLog.error("[IPC] Invalid state:", validation.error);
          return false;
        }

        const db = getMainDb();
        const stmt = db.prepare(
          `INSERT OR REPLACE INTO tutor_snapshots (id, session_id, topic, context, created_at) VALUES (?, ?, ?, ?, ?)`,
        );

        // Use a fixed session ID for now, or derive from state if available
        const sessionId = "current_session";
        stmt.run(
          "latest", // Single slot for now
          sessionId,
          validation.data.topic || "unknown",
          JSON.stringify(validation.data),
          Date.now(),
        );

        return true;
      } catch (error) {
        safeLog.error("[IPC] Save state failed:", error);
        return false;
      }
    },
  );

  safeHandle(IpcChannels.DB_LOAD_TUTOR_STATE, async () => {
    try {
      const db = getMainDb();
      const row = db
        .prepare("SELECT context FROM tutor_snapshots WHERE id = ?")
        .get("latest") as { context: string };
      return row ? JSON.parse(row.context) : {};
    } catch (error) {
      safeLog.error("[IPC] Load state failed:", error);
      return {};
    }
  });

  // Task Queue Handlers
  safeHandle(
    IpcChannels.TASK_ADD,
    async (event: IpcMainInvokeEvent, taskData: unknown) => {
      try {
        // Validate TaskData
        const validation = TaskAddSchema.safeParse(taskData);
        if (!validation.success) {
          safeLog.error("[IPC] Invalid task data:", validation.error);
          throw new Error("Invalid task data: " + validation.error.message);
        }

        const { prompt, intent, priority, isLocal } = validation.data;

        // Capture the window to send updates back
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) taskQueueManager.setMainWindow(win);

        // We accept that we are constructing an internal type from the validated IPC data
        // Explicitly casting intent to any to bypass strict enum mismatch if internal type is different
        // In shared schemas, intent includes "general", but shared `TaskIntent` might differ.
        // For now, ensuring runtime safety with schema is sufficient.
        const task = {
          prompt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          intent: intent as any,
          priority,
          isLocal,
          ...((taskData as Record<string, unknown>) || {}), // Keep original metadata if any
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = taskQueueManager.addTask(task as any);
        return id;
      } catch (error) {
        safeLog.error("[IPC] Add task failed:", error);
        throw error;
      }
    },
  );

  safeHandle(IpcChannels.TASK_CLEAR, async (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) taskQueueManager.setMainWindow(win);
    taskQueueManager.clearCompleted();
    return true;
  });

  // FIX: Explicit trigger for local queue processing (Elite Architecture)
  safeHandle("queue:process_local", async (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) taskQueueManager.setMainWindow(win);
    await taskQueueManager.processLocalQueue();
    return true;
  });

  // DB Query (Realistic Implementation)
  safeHandle(
    IpcChannels.DB_QUERY,
    async (_event: IpcMainInvokeEvent, args: unknown) => {
      safeLog.log(`[IPC] Handler reached: ${IpcChannels.DB_QUERY}`, args);
      try {
        const validation = DbQuerySchema.safeParse(args);
        if (!validation.success) {
          safeLog.error("[IPC] Invalid database query arguments:", validation.error);
          throw new Error("Invalid query arguments: " + validation.error.message);
        }

        const { sql, params: sqlParams = [], method = "all" } = validation.data;
        const db = getMainDb();

        if (method === "run") {
          const result = db.prepare(sql).run(sqlParams);
          return result;
        } else if (method === "get") {
          const result = db.prepare(sql).get(sqlParams);
          return result;
        } else {
          // Default: all
          const result = db.prepare(sql).all(sqlParams);
          return result;
        }
      } catch (error) {
        safeLog.error("[IPC] Database query failed:", error);
        throw error;
      }
    },
  );

  // Elite Vault Handlers
  safeHandle(IpcChannels.VAULT_EXPORT, async (event: IpcMainInvokeEvent) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return false;

      const { filePath } = await dialog.showSaveDialog(win, {
        title: "Export Elite Vault",
        defaultPath: `vwo-elite-vault-${new Date().toISOString().split("T")[0]}.vwo-vault`,
        filters: [{ name: "Elite Vault", extensions: ["vwo-vault"] }],
      });

      if (!filePath) return false;

      const dbPath = DatabaseFactory.getDatabasesPath();
      const vaultBuffer = await createVault(dbPath);

      const fs = await import("fs");
      fs.writeFileSync(filePath, vaultBuffer);

      safeLog.log(`[Vault] Export successful: ${filePath}`);
      return true;
    } catch (error) {
      safeLog.error("[Vault] Export failed:", error);
      return false;
    }
  });

  safeHandle(IpcChannels.VAULT_IMPORT, async (event: IpcMainInvokeEvent) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return false;

      const { filePaths } = await dialog.showOpenDialog(win, {
        title: "Import Elite Vault",
        filters: [{ name: "Elite Vault", extensions: ["vwo-vault"] }],
        properties: ["openFile"],
      });

      if (!filePaths || filePaths.length === 0) return false;
      const filePath = filePaths[0]!;

      // 1. Alert User
      const { response } = await dialog.showMessageBox(win, {
        type: "warning",
        title: "Confirm Import",
        message: "Importing a vault will OVERWRITE all local data. The app will restart.",
        buttons: ["Cancel", "Import & Restart"],
        defaultId: 0,
        cancelId: 0,
      });

      if (response === 0) return false;

      // 2. Process Import
      const fs = await import("fs");
      const vaultBuffer = fs.readFileSync(filePath);
      const dbPath = DatabaseFactory.getDatabasesPath();

      // Close all DB connections
      await DatabaseFactory.closeAll();

      // Clear existing directory
      if (fs.existsSync(dbPath)) {
        fs.rmSync(dbPath, { recursive: true, force: true });
      }

      // Extract new files
      await extractVault(vaultBuffer, dbPath);

      safeLog.log(`[Vault] Import successful from ${filePath}. Relaunching...`);

      // 3. Relaunch
      app.relaunch();
      app.exit(0);

      return true;
    } catch (error) {
      safeLog.error("[Vault] Import failed:", error);
      return false;
    }
  });

  // System Status
  safeHandle(IpcChannels.SYSTEM_STATUS, async () => {
    return {
      status: "ready",
      version: "2.0.0-elite",
      mainProcess: true,
    };
  });

  safeHandle(IpcChannels.SYS_PING, () => "pong");

  safeHandle(IpcChannels.ORCHESTRATOR_EXECUTE, async (_event: IpcMainInvokeEvent, args: unknown) => {
    safeLog.log("[IPC] Orchestrator Execute:", args);
    return "Orchestrator feedback: Processing...";
  });

  // Task Queue
  safeHandle(IpcChannels.TASK_UPDATE, async (_event: IpcMainInvokeEvent, { id, updates }: { id: string, updates: unknown }) => {
    safeLog.log(`[IPC] Task Update ${id}:`, updates);
    return true;
  });

  safeHandle(IpcChannels.TASK_REMOVE, async (_event: IpcMainInvokeEvent, { id }: { id: string }) => {
    safeLog.log(`[IPC] Task Remove ${id}`);
    return true;
  });

  // Consolidated queue:process_local handler (removed duplicate)

  safeHandle("db:load", async () => {
    return (ipcMain as unknown as { emit: (channel: string, ...args: unknown[]) => boolean }).emit(IpcChannels.DB_LOAD_TUTOR_STATE);
  });

  safeHandle("ai:check", async (_event: IpcMainInvokeEvent, url: string) => {
    return (ipcMain as unknown as { emit: (channel: string, ...args: unknown[]) => boolean }).emit(IpcChannels.AI_CHECK_ENDPOINT, _event, url);
  });

  // Config Sync

  safeHandle(
    IpcChannels.CONFIG_UPDATE,
    async (_event: IpcMainInvokeEvent, newConfig: unknown) => {
      try {
        const validation = ConfigUpdateSchema.safeParse(newConfig);
        if (!validation.success) {
          safeLog.error("[IPC] Invalid config:", validation.error);
          return false;
        }

        getOrchestrator().updateConfig(validation.data);
        return true;
      } catch (error) {
        safeLog.error("[IPC] Config update failed:", error);
        return false;
      }
    },
  );

  // Endpoint Health Check (Silent)
  safeHandle(
    IpcChannels.AI_CHECK_ENDPOINT,
    async (_event: IpcMainInvokeEvent, url: unknown) => {
      try {
        const validation = AiCheckEndpointSchema.safeParse(url);
        if (!validation.success) return false;

        const response = await fetch(validation.data, {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  );

  // System Fetch Proxy (Bypasses CORS)
  safeHandle(
    IpcChannels.SYS_FETCH_URL,
    async (_event: IpcMainInvokeEvent, args: unknown) => {
      try {
        const validation = SysFetchUrlSchema.safeParse(args);
        if (!validation.success) {
          throw new Error("Invalid fetch arguments");
        }

        const { url, options = {} } = validation.data;
        const res = await fetch(url, options as RequestInit);

        if (!res.ok) {
          return { ok: false, status: res.status, statusText: res.statusText };
        }

        const contentType = res.headers.get("content-type");
        let data;
        if (contentType?.includes("application/json")) {
          data = await res.json();
        } else {
          data = await res.text();
        }

        return { ok: true, status: res.status, data };
      } catch (error) {
        safeLog.error(`[IPC] Fetch proxy failed:`, error);
        return { ok: false, error: (error as Error).message };
      }
    }
  );

  // PERFORMANCE TRACING
  safeHandle(IpcChannels.PERF_TRACE_START, async () => {
    try {
      await contentTracing.startRecording({
        included_categories: ["*"], // Record everything
      });
      return true;
    } catch (e) {
      safeLog.error("Failed to start tracing:", e);
      return false;
    }
  });

  safeHandle(IpcChannels.PERF_TRACE_STOP, async () => {
    try {
      const path = await contentTracing.stopRecording();
      safeLog.log("Trace saved to:", path);
      return path;
    } catch (e) {
      safeLog.error("Failed to stop tracing:", e);
      return null;
    }
  });

  // DOCUMENT HANDLERS
  safeHandle(
    IpcChannels.DOC_ADD,
    async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      // DocAddSchema is a tuple: [filePath, meta]
      const validation = DocAddSchema.safeParse(args);
      if (!validation.success) {
        safeLog.error("[IPC] Invalid doc add args:", validation.error);
        return { error: "Invalid arguments: " + validation.error.message };
      }

      const [filePath, metaData] = validation.data;
      // Re-cast to internal types (or ensure schema matches perfectly)
      const meta = metaData as DocMeta;

      safeLog.log(`[IPC] doc:add called for ${filePath}`);

      // Find the window that sent the request to send progress back
      const win = BrowserWindow.fromWebContents(event.sender);

      try {
        const result = await IngestionService.getInstance().ingest(
          filePath,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meta as any, // IngestionService expects its own DocumentMeta, assume compatible
          (stage, current, total, etr) => {
            if (win && !win.isDestroyed()) {
              win.webContents.send(IpcChannels.DOC_PROGRESS, {
                fileId: meta.id, // Ensure frontend matches progress to file
                stage,
                current,
                total,
                etr,
              });
            }
          },
        );
        return result;
      } catch (error) {
        safeLog.error("[IPC] Ingestion failed:", error);
        // We return a structured error instead of throwing to avoid "reply was never sent"
        return { error: (error as Error).message };
      }
    },
  );

  safeHandle(
    IpcChannels.DOC_SEARCH,
    async (_event: IpcMainInvokeEvent, queryArg: unknown) => {
      try {
        const validation = DocSearchSchema.safeParse(queryArg);
        if (!validation.success) {
          safeLog.error("[IPC] Invalid search query:", validation.error);
          return [];
        }
        const query = validation.data;

        const repo = new DocumentRepository();

        // If query is empty/whitespace, skip embedding and trigger "Browse Mode"
        if (!query || query.trim() === "") {
          safeLog.log("[IPC] Empty query detected, triggering Browse Mode");
          return await repo.search(null);
        }

        const ai = AIService.getInstance();
        const queryVector = await ai.embed(query);

        return await repo.search(queryVector);
      } catch (error) {
        safeLog.error("[IPC] Search failed:", error);
        return [];
      }
    },
  );

  safeHandle(
    IpcChannels.DOC_DELETE,
    async (_event: IpcMainInvokeEvent, idArg: unknown) => {
      try {
        const validation = DocDeleteSchema.safeParse(idArg);
        if (!validation.success) return false;

        const repo = new DocumentRepository();
        await repo.deleteDocument(validation.data);
        return true;
      } catch (error) {
        safeLog.error("[IPC] Delete failed:", error);
        return false;
      }
    },
  );

  safeHandle(IpcChannels.SYS_OPEN_PATH, async (_event: IpcMainInvokeEvent, path: string) => {
    const validation = SysOpenPathSchema.safeParse(path);
    if (!validation.success) return false;

    const { shell } = await import("electron");
    await shell.openPath(validation.data);
    return true;
  });

  // KNOWLEDGE CACHE PERSISTENCE (Elite Relational Migration)
  safeHandle("knowledge:save", async (_event: IpcMainInvokeEvent, dataString: string) => {
    try {
      // Data is expected to be a JSON string of a Map dump from renderer
      const db = getMainDb();
      const rawEntries: [string, { timestamp?: number, data: string }][] = JSON.parse(dataString);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO knowledge_digests (key, data, created_at, last_used_at)
        VALUES (?, ?, ?, ?)
      `);

      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transaction = (db as any).transaction((entries: [string, unknown][]) => {
        for (const [key, entry] of entries) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stmt.run(key, JSON.stringify(entry), (entry as any).timestamp || now, now);
        }
      });

      transaction(rawEntries);
      return true;
    } catch (e) {
      safeLog.error("[Knowledge] Save to SQLite failed:", e);
      return false;
    }
  });

  safeHandle("knowledge:load", async () => {
    try {
      const db = getMainDb();
      const rows = db.prepare("SELECT key, data FROM knowledge_digests").all() as { key: string, data: string }[];

      if (rows.length === 0) return null;

      // Reconstruct the Map-style array for the renderer
      const entries = rows.map(row => [row.key, JSON.parse(row.data)]);

      // Update last_used_at for all loaded items (Elite Maintenance)
      db.prepare("UPDATE knowledge_digests SET last_used_at = ?").run(Date.now());

      return JSON.stringify(entries);
    } catch (e) {
      safeLog.error("[Knowledge] Load from SQLite failed:", e);
      return null;
    }
  });

  // WINDOW CONTROLS
  safeHandle(IpcChannels.WINDOW_MINIMIZE, (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  safeHandle(IpcChannels.WINDOW_MAXIMIZE, (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  safeHandle(IpcChannels.WINDOW_CLOSE, (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  safeHandle(IpcChannels.WINDOW_IS_MAXIMIZED, (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isMaximized();
  });

  // Return Cleanup Function
  return () => {
    orchestrator.off("routing_decision", handleRoutingDecision);
    ipcMain.removeHandler(IpcChannels.AI_GENERATE);
    ipcMain.removeHandler(IpcChannels.DB_SAVE_TUTOR_STATE);
    ipcMain.removeHandler(IpcChannels.DB_LOAD_TUTOR_STATE);
    ipcMain.removeHandler(IpcChannels.TASK_ADD);
    ipcMain.removeHandler(IpcChannels.TASK_CLEAR);
    ipcMain.removeHandler(IpcChannels.DB_QUERY);
    ipcMain.removeHandler(IpcChannels.SYSTEM_STATUS);
    ipcMain.removeHandler(IpcChannels.CONFIG_UPDATE);
    ipcMain.removeHandler(IpcChannels.AI_CHECK_ENDPOINT);
  };
}
