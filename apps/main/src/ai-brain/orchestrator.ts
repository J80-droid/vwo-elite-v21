import {
  classifyIntent,
  generateRoutingReason,
  intentToCapability,
  scoreModel,
} from "@vwo/business-logic";
import type {
  AIModel,
  OrchestratorConfig,
  RoutingDecision,
  Subject,
  TaskIntent,
} from "@vwo/shared-types";
import crypto from "crypto";
import { EventEmitter } from "events";

import { getLMStudioRunner } from "../../../../src/shared/api/model-runners/lmStudioRunner";
import { getOllamaRunner } from "../../../../src/shared/api/model-runners/ollamaRunner";
import { aiModelDao } from "../db/sqlite";
import { safeLog } from "../utils/safe-logger";

const DEFAULT_CONFIG: OrchestratorConfig = {
  routingStrategy: "rule_based",
  fallbackEnabled: true,
  maxRetries: 2,
  contextInjectionEnabled: true,
  maxContextTokens: 4096,
  proactiveSuggestionsEnabled: true,
  suggestionTypes: ["exam_prep", "practice_reminder", "weak_point_focus"],
  showRoutingDecisions: true,
  debugMode: false,
};

export class Orchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private models: AIModel[] = [];
  private routingHistory: RoutingDecision[] = [];

  // Event-driven Task Management (No Polling)
  private taskResolvers = new Map<string, (result: string) => void>();
  private taskRejectors = new Map<string, (error: Error) => void>();

  constructor(config: Partial<OrchestratorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadModelsFromDb();

    // Setup Event Listeners
    this.on("task_completed", this.handleTaskCompletion.bind(this));
    this.on("task_failed", this.handleTaskFailure.bind(this));
  }

  updateConfig(newConfig: Partial<OrchestratorConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.config.debugMode)
      safeLog.log("[Orchestrator] Config updated:", this.config);
  }

  getConfig() {
    return { ...this.config };
  }

  private loadModelsFromDb() {
    try {
      this.models = aiModelDao.getAll() as AIModel[];
      if (this.config.debugMode)
        safeLog.log(`[Orchestrator] Loaded ${this.models.length} models`);
    } catch (error) {
      safeLog.error("[Orchestrator] Failed to load models:", error);
    }
  }

  async execute(
    prompt: string,
    options?: {
      systemPrompt?: string;
      intent?: TaskIntent;
      subject?: Subject;
      preferFast?: boolean;
      preferQuality?: boolean;
      requireLocal?: boolean;
    },
  ): Promise<string> {
    // 1. Classify & Route
    const intent = options?.intent || (await this.classifyQuery(prompt));
    const routing = this.selectModel(intent, options);

    if (!routing) throw new Error(`No model available for intent: ${intent}`);

    this.routingHistory.push(routing);
    this.emit("routing_decision", routing);

    const taskId = crypto.randomUUID();

    // 2. Return Promise that resolves on Event
    return new Promise<string>((resolve, reject) => {
      // Safety Timeout (60s)
      const timeout = setTimeout(() => {
        this.cleanupTask(taskId);
        reject(new Error("Orchestrator task timed out after 60s"));
      }, 60000);

      this.taskResolvers.set(taskId, (res) => {
        clearTimeout(timeout);
        resolve(res);
      });
      this.taskRejectors.set(taskId, (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      // 3. Trigger Async Execution (Non-blocking)
      this.processTask(taskId, prompt, routing);
    });
  }

  private async processTask(
    taskId: string,
    prompt: string,
    routing: RoutingDecision,
  ) {
    try {
      // Simulate AI Execution Latency (or call real service)
      // In a real implementation, this calls OllamaService or VertexService
      // which in turn emits 'task_completed' when done.

      this.emit("task_started", { taskId, model: routing.selectedModel.name });

      this.emit("task_started", { taskId, model: routing.selectedModel.name });

      // Execute Real Model
      let response: string;
      const model = routing.selectedModel;

      if (model.provider === "ollama") {
        const runner = getOllamaRunner(model.endpoint);
        const result = await runner.generate({
          model: model.modelId,
          prompt: prompt,
          system: "You are a helpful AI tutor.", // Default system prompt, can be passed via options
        });
        response = result.response;
      } else if (model.provider === "lm_studio") {
        const runner = getLMStudioRunner(model.endpoint);
        response = await runner.generate(prompt);
      } else {
        // Fallback Mock for unknown providers
        await new Promise((r) => setTimeout(r, 800));
        response = `[Mock Response] Provider ${model.provider} not supported yet.`;
      }

      // Emit completion event (this triggers the resolve)
      this.emit("task_completed", { taskId, result: response });
    } catch (error) {
      this.emit("task_failed", { taskId, error });
    }
  }

  private handleTaskCompletion({
    taskId,
    result,
  }: {
    taskId: string;
    result: string;
  }) {
    const resolve = this.taskResolvers.get(taskId);
    if (resolve) {
      resolve(result);
      this.cleanupTask(taskId);
    }
  }

  private handleTaskFailure({
    taskId,
    error,
  }: {
    taskId: string;
    error: Error;
  }) {
    const reject = this.taskRejectors.get(taskId);
    if (reject) {
      reject(error);
      this.cleanupTask(taskId);
    }
  }

  private cleanupTask(taskId: string) {
    this.taskResolvers.delete(taskId);
    this.taskRejectors.delete(taskId);
  }

  private async classifyQuery(query: string): Promise<TaskIntent> {
    const result = await classifyIntent(query);
    this.emit("intent_classified", { query, intent: result.intent });
    return result.intent;
  }

  private selectModel(
    intent: TaskIntent,
    options?: {
      requireLocal?: boolean;
      preferFast?: boolean;
      preferQuality?: boolean;
    },
  ): RoutingDecision | null {
    const capability = intentToCapability(intent);
    let availableModels = this.models.filter(
      (m) => m.enabled && m.capabilities.includes(capability),
    );

    if (options?.requireLocal) {
      availableModels = availableModels.filter((m) =>
        ["ollama", "lm_studio"].includes(m.provider),
      );
    }

    // Global Fallback Logic
    if (availableModels.length === 0 && this.config.fallbackEnabled) {
      if (this.config.debugMode) {
        safeLog.warn(
          `[Orchestrator] No models for capability "${capability}". Attempting fallback...`,
        );
      }

      // Fallback to any enabled model, but avoid vision models for non-vision tasks
      availableModels = this.models.filter((m) => {
        if (!m.enabled) return false;
        if (
          intent !== "vision_task" &&
          m.capabilities.includes("vision") &&
          m.capabilities.length === 1
        )
          return false;
        if (
          options?.requireLocal &&
          !["ollama", "lm_studio"].includes(m.provider)
        )
          return false;
        return true;
      });
    }

    if (availableModels.length === 0) return null;

    const scored = availableModels
      .map((m) => ({
        model: m,
        score: scoreModel(m, intent, options),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best) return null;

    return {
      taskId: crypto.randomUUID(),
      selectedModel: best.model,
      reason:
        generateRoutingReason(best.model, intent, options) +
        (scored.length > 0 && !best.model.capabilities.includes(capability)
          ? " (Fallback)"
          : ""),
      alternatives: scored.slice(1, 4).map((s) => s.model),
      confidence: best.score / 100,
    };
  }
}

let instance: Orchestrator | null = null;
export function getOrchestrator() {
  if (!instance) instance = new Orchestrator();
  return instance;
}

export function resetOrchestratorForTests() {
  instance = null;
}
