import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 1. Mock Electron Mock FIRST
import * as electronMock from "../setup/electron-mock";
vi.mock("electron", () => electronMock);

// Imports
import * as lmStudioModule from "../../../../src/shared/api/model-runners/lmStudioRunner";
import * as ollamaModule from "../../../../src/shared/api/model-runners/ollamaRunner";
import {
  getOrchestrator,
  resetOrchestratorForTests,
} from "../../src/ai-brain/orchestrator";

// --- CONSTANTEN VOOR TESTSCENARIO'S ---
const TEST_CONSTANTS = {
  PROMPTS: {
    MATH: "Bereken de integraal van x^2",
    GENERAL: "Hoi",
    HANG: "Hang test",
    QUEUE: "Queue test",
  },
  ERRORS: {
    TIMEOUT: "Orchestrator task timed out after 60s",
  },
};

// 1. Define shared DB state with vi.hoisted
const dbState = vi.hoisted(() => ({
  models: new Map<string, unknown>(),
  tasks: [] as unknown[],
}));

// Helper to reset the DB
const resetMockDb = () => {
  dbState.models.clear();
  dbState.tasks.length = 0;

  // Seed default data
  dbState.models.set("llama3-8b", {
    id: "llama3-8b",
    provider: "ollama",
    capabilities: ["reasoning"],
    priority: 100,
    metrics: { successRate: 1 },
    enabled: true,
    name: "Llama 3 8B",
    modelId: "llama3:8b",
    endpoint: "http://localhost:11434",
  });
  dbState.models.set("llama3-3b", {
    id: "llama3-3b",
    provider: "ollama",
    capabilities: ["fast"],
    priority: 100,
    metrics: { successRate: 1 },
    enabled: true,
    name: "Llama 3.2 3B",
    modelId: "llama3.2:3b",
    endpoint: "http://localhost:11434",
  });
};

// 2. Stateful DB Mock
vi.mock("../../src/db/sqlite", () => ({
  getMainDb: () => ({
    prepare: (sql: string) => ({
      get: () => null,
      all: () => {
        if (sql.toLowerCase().includes("from tasks")) return [...dbState.tasks];
        return [];
      },
      run: (...args: unknown[]) => {
        if (sql.toLowerCase().includes("insert into tasks")) {
          const task = args[0] || { id: "mock-id", prompt: "Unknown" };
          dbState.tasks.push(task);
          return { lastInsertRowid: dbState.tasks.length, changes: 1 };
        }
        return { changes: 1 };
      },
    }),
    exec: () => {},
  }),
  aiModelDao: {
    getAll: () => Array.from(dbState.models.values()),
    get: (id: string) => dbState.models.get(id) || null,
    upsert: (model: { id: string } & Record<string, unknown>) => {
      const existing = (dbState.models.get(model.id) || {}) as Record<
        string,
        unknown
      >;
      dbState.models.set(model.id, { ...existing, ...model });
    },
  },
}));

// Mock Business Logic
vi.mock("@vwo/business-logic", () => ({
  classifyIntent: async (query: string) => {
    if (query.includes("integraal")) return { intent: "complex_reasoning" };
    if (query.includes("Hoi")) return { intent: "general_chat" };
    return { intent: "general_chat" };
  },
  generateRoutingReason: () => "Test Reason",
  intentToCapability: (intent: string) => {
    if (intent === "complex_reasoning") return "reasoning";
    return "fast";
  },
  scoreModel: () => 100,
}));

// Scenario Helper
type ScenarioOptions = {
  models?: Array<{
    id: string;
    capabilities: string[];
    enabled: boolean;
    priority: number;
    [key: string]: unknown;
  }>;
  runnerBehavior?: {
    ollama?: {
      response?: string;
      delayMs?: number;
      shouldFail?: boolean;
      promptMatches?: string;
    };
    lmStudio?: { response?: string };
  };
  config?: { debugMode?: boolean; [key: string]: unknown };
};

async function setupScenario(options: ScenarioOptions) {
  if (options.models) {
    dbState.models.clear();
    options.models.forEach((m) =>
      dbState.models.set(m.id, {
        provider: "ollama",
        name: m.id,
        metrics: { successRate: 1 },
        endpoint: "http://localhost",
        ...m,
      }),
    );
  }

  if (options.runnerBehavior?.ollama) {
    const { response, delayMs, shouldFail, promptMatches } =
      options.runnerBehavior.ollama;
    vi.spyOn(ollamaModule, "getOllamaRunner").mockReturnValue({
      generate: async ({ prompt }: { prompt: string }) => {
        if (promptMatches && prompt !== promptMatches)
          return { response: "Default Response" };
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
        if (shouldFail) throw new Error("Simulated Runner Failure");
        return { response: response || `Response for: ${prompt}` };
      },
    } as unknown as ReturnType<typeof ollamaModule.getOllamaRunner>);
  } else {
    // Default spy
    vi.spyOn(ollamaModule, "getOllamaRunner").mockReturnValue({
      generate: async ({ prompt }: { prompt: string }) => {
        if (prompt === TEST_CONSTANTS.PROMPTS.HANG) {
          await new Promise((r) => setTimeout(r, 65000));
          return { response: "Too late" };
        }
        return { response: `Response for: ${prompt} ` };
      },
    } as unknown as ReturnType<typeof ollamaModule.getOllamaRunner>);
  }

  if (options.runnerBehavior?.lmStudio) {
    vi.spyOn(lmStudioModule, "getLMStudioRunner").mockReturnValue({
      generate: async () =>
        options.runnerBehavior?.lmStudio?.response || "LM Studio Response",
    } as unknown as ReturnType<typeof lmStudioModule.getLMStudioRunner>);
  } else {
    vi.spyOn(lmStudioModule, "getLMStudioRunner").mockReturnValue({
      generate: async () => "LM Studio Response",
    } as unknown as ReturnType<typeof lmStudioModule.getLMStudioRunner>);
  }

  if (options.config) {
    const { ipcRenderer } = await import("electron");
    await ipcRenderer.invoke("config:update", options.config);
  }
}

describe("VWO Elite Agent Integration System", () => {
  let teardownIpc: (() => void) | undefined;

  beforeEach(async () => {
    resetOrchestratorForTests();
    resetMockDb();

    const { registerIpcHandlers } = await import("../../src/ipc-handlers");
    teardownIpc = registerIpcHandlers();
  });

  afterEach(() => {
    if (teardownIpc) {
      teardownIpc();
      teardownIpc = undefined;
    }
    vi.clearAllMocks();
    vi.useRealTimers();
    resetOrchestratorForTests();
  });

  // --- FASE 1: CONFIG SYNC ---
  it("should synchronize configuration between UI and Backend", async () => {
    const { ipcRenderer } = await import("electron");

    // Verify initial state
    expect(getOrchestrator().getConfig().debugMode).toBe(false);

    // Actie: UI stuurt update
    await ipcRenderer.invoke("config:update", { debugMode: true });

    // Check: Backend state is veranderd (Direct state verification)
    expect(getOrchestrator().getConfig().debugMode).toBe(true);
  });

  // --- FASE 2: ROUTING LOGICA ---
  it("should route math questions to a reasoning model", async () => {
    await setupScenario({
      runnerBehavior: {
        ollama: { promptMatches: TEST_CONSTANTS.PROMPTS.MATH },
      },
    });

    const { ipcRenderer } = await import("electron");
    const response = await ipcRenderer.invoke("ai:generate", {
      prompt: TEST_CONSTANTS.PROMPTS.MATH,
    });

    expect(response.response).toContain("Response for: Bereken de integraal");
  });

  // --- FASE 3: STATE UPDATE EVENTS ---
  it("should emit live updates to the UI via IPC", async () => {
    const { ipcRenderer } = await import("electron");
    const updateListener = vi.fn();

    ipcRenderer.on("orchestrator:routing_decision", updateListener);

    await ipcRenderer.invoke("ai:generate", {
      prompt: TEST_CONSTANTS.PROMPTS.GENERAL,
    });

    expect(updateListener).toHaveBeenCalled();
    const eventData = updateListener.mock.calls[0][1];
    expect(eventData).toHaveProperty("taskId");
    expect(eventData).toHaveProperty("selectedModel");
  });

  // --- FASE 4: TIMEOUT & ERROR HANDLING ---
  describe("Timeout Handling", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should handle backend timeouts gracefully", async () => {
      await setupScenario({}); // Uses default "Hang test" behavior

      const { ipcRenderer } = await import("electron");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // 1. Start de aanroep (deze zal hangen)
      const invokePromise = ipcRenderer.invoke("ai:generate", {
        prompt: TEST_CONSTANTS.PROMPTS.HANG,
      });

      // 2. Definieer de verwachting dat deze promise faalt (catch handler actief maken)
      // Dit moet gebeuren VOORDAT we de tijd doorspoelen om unhandledRejection te voorkomen.
      const validationPromise = expect(invokePromise).rejects.toThrow(
        TEST_CONSTANTS.ERRORS.TIMEOUT,
      );

      // 3. Spoel de tijd vooruit om de timeout te triggeren
      await vi.advanceTimersByTimeAsync(70000);

      // 4. Wacht tot de validatie compleet is
      await validationPromise;

      errorSpy.mockRestore();
    });
  });

  // --- FASE 5: TASK QUEUE MANAGER ---
  it("TaskQueueManager should emit queue updates", async () => {
    const { ipcRenderer } = await import("electron");
    const listener = vi.fn();
    ipcRenderer.on("queue:update", listener);

    const completionPromise = new Promise<void>((resolve) => {
      ipcRenderer.on(
        "queue:update",
        (
          _event,
          data: { localQueue: Array<{ prompt: string; status: string }> },
        ) => {
          const task = data.localQueue.find(
            (t: { prompt: string; status: string }) =>
              t.prompt === TEST_CONSTANTS.PROMPTS.QUEUE,
          );
          if (
            task &&
            (task.status === "completed" || task.status === "failed")
          ) {
            resolve();
          }
        },
      );
    });

    const taskId = await ipcRenderer.invoke("task:add", {
      prompt: TEST_CONSTANTS.PROMPTS.QUEUE,
      systemPrompt: "Sys",
      isLocal: true,
      priority: 1,
      modelId: "llama3-8b",
    });

    expect(taskId).toBeDefined();
    await completionPromise;
    expect(listener).toHaveBeenCalled();
  });
});
