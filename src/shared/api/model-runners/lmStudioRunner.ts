/**
 * LM Studio Runner
 * Integration with LM Studio for local model execution
 * LM Studio exposes an OpenAI-compatible API
 */

import type { AIModel, ModelCapability } from "../../types/ai-brain";

// =============================================================================
// TYPES
// =============================================================================

export interface LMStudioModel {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

export interface LMStudioChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LMStudioChatRequest {
  model: string;
  messages: LMStudioChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string[];
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  seed?: number;
}

export interface LMStudioChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop" | "length";
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// =============================================================================
// LM STUDIO RUNNER CLASS
// =============================================================================

export class LMStudioRunner {
  private baseUrl: string;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(baseUrl: string = "http://localhost:1234/v1") {
    this.baseUrl = baseUrl;
  }

  // =========================
  // HEALTH CHECK
  // =========================

  async isHealthy(): Promise<boolean> {
    // Prefer IPC bridge to avoid browser console errors (ERR_CONNECTION_REFUSED)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (globalThis as any).vwoApi;
    if (api?.invoke) {
      return await api.invoke("ai:check-endpoint", `${this.baseUrl}/models`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // =========================
  // MODEL MANAGEMENT
  // =========================

  async listModels(): Promise<LMStudioModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) throw new Error("Failed to list models");
      const data = (await response.json()) as { data: LMStudioModel[] };
      return data.data || [];
    } catch (error) {
      console.error("[LMStudioRunner] Failed to list models:", error);
      return [];
    }
  }

  async getLoadedModel(): Promise<string | null> {
    const models = await this.listModels();
    return models.length > 0 ? (models[0]?.id ?? null) : null;
  }

  // =========================
  // CHAT COMPLETION
  // =========================

  async chat(request: LMStudioChatRequest): Promise<LMStudioChatResponse> {
    const taskId = `lmstudio-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LM Studio chat failed: ${response.statusText}`);
      }

      return (await response.json()) as LMStudioChatResponse;
    } finally {
      this.abortControllers.delete(taskId);
    }
  }

  async *chatStream(
    request: LMStudioChatRequest,
  ): AsyncGenerator<string, void, unknown> {
    const taskId = `lmstudio-stream-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LM Studio stream failed: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6); // Remove "data: " prefix
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } finally {
      this.abortControllers.delete(taskId);
    }
  }

  // =========================
  // SIMPLE GENERATE
  // =========================

  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    const model = await this.getLoadedModel();
    if (!model) {
      throw new Error("No model loaded in LM Studio");
    }

    const messages: LMStudioChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await this.chat({
      model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    });

    return response.choices[0]?.message?.content || "";
  }

  // =========================
  // EMBEDDINGS
  // =========================

  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-ada-002", // LM Studio ignores this
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio embed failed: ${response.statusText}`);
      }

      const data = (await response.json()) as { data: { embedding: number[] }[] };
      return data.data?.[0]?.embedding || [];
    } catch (error) {
      console.error("[LMStudioRunner] Embedding failed:", error);
      throw error;
    }
  }

  // =========================
  // ABORT
  // =========================

  abortAll(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }
}

// =============================================================================
// CAPABILITY DETECTION
// =============================================================================

/**
 * Infer capabilities from LM Studio model name
 */
export function inferCapabilities(modelId: string): ModelCapability[] {
  const capabilities: ModelCapability[] = ["fast"];
  const name = modelId.toLowerCase();

  // Vision models
  if (
    name.includes("llava") ||
    name.includes("vision") ||
    name.includes("moondream")
  ) {
    capabilities.push("vision");
  }

  // Code models
  if (
    name.includes("code") ||
    name.includes("starcoder") ||
    name.includes("deepseek")
  ) {
    capabilities.push("code");
  }

  // Reasoning (look for size indicators)
  if (
    name.includes("70b") ||
    name.includes("34b") ||
    name.includes("33b") ||
    name.includes("13b") ||
    name.includes("8b") ||
    name.includes("7b")
  ) {
    capabilities.push("reasoning");
  }

  // Embedding
  if (name.includes("embed") || name.includes("nomic")) {
    capabilities.push("embedding");
  }

  return capabilities;
}

/**
 * Convert LM Studio model to AIModel format
 */
export function lmStudioToAIModel(
  model: LMStudioModel,
  baseUrl: string,
): Partial<AIModel> {
  return {
    name: model.id,
    provider: "lm_studio",
    modelId: model.id,
    endpoint: baseUrl,
    capabilities: inferCapabilities(model.id),
    requirements: {},
    enabled: false,
    priority: 50,
  };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let lmStudioInstance: LMStudioRunner | null = null;

export function getLMStudioRunner(baseUrl?: string): LMStudioRunner {
  if (
    !lmStudioInstance ||
    (baseUrl && baseUrl !== lmStudioInstance["baseUrl"])
  ) {
    lmStudioInstance = new LMStudioRunner(baseUrl);
  }
  return lmStudioInstance;
}

/**
 * Quick check if LM Studio is running
 */
export async function isLMStudioAvailable(): Promise<boolean> {
  return getLMStudioRunner().isHealthy();
}

/**
 * Discover LM Studio models and convert to AIModel format
 */
export async function discoverLMStudioModels(): Promise<Partial<AIModel>[]> {
  const runner = getLMStudioRunner();
  const isAvailable = await runner.isHealthy();

  if (!isAvailable) {
    console.log("[LMStudioRunner] LM Studio not available");
    return [];
  }

  const models = await runner.listModels();
  console.log(`[LMStudioRunner] Found ${models.length} models`);

  return models.map((m) => lmStudioToAIModel(m, "http://localhost:1234/v1"));
}
