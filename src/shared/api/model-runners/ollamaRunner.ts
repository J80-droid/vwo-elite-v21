/**
 * Ollama Runner
 * Integration with Ollama for local model execution
 */

import type { AIModel, ModelCapability } from "../../types/ai-brain";

// =============================================================================
// TYPES
// =============================================================================

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    // Core sampling
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number; // max tokens
    stop?: string[];
    seed?: number;

    // Mirostat
    mirostat?: number; // 0=off, 1, 2
    mirostat_tau?: number;
    mirostat_eta?: number;

    // Advanced sampling
    typical_p?: number;
    tfs_z?: number; // Tail Free Sampling
    min_p?: number;

    // Penalties
    repeat_penalty?: number;
    repeat_last_n?: number; // repetition penalty range
    presence_penalty?: number;
    frequency_penalty?: number;

    // Context & Memory
    num_ctx?: number; // Context window size
    num_batch?: number;
    num_thread?: number;

    // Model loading
    num_gpu?: number;
    main_gpu?: number;
    low_vram?: boolean;
    f16_kv?: boolean; // FP16 KV cache
  };
  images?: string[]; // Base64 encoded images for vision models
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

// =============================================================================
// OLLAMA RUNNER CLASS
// =============================================================================

export class OllamaRunner {
  private baseUrl: string;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(baseUrl: string = "http://localhost:11434") {
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
      return await api.invoke(
        "ai:check-endpoint",
        `${this.baseUrl}/api/version`,
      );
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      if (!response.ok) return null;
      const data = (await response.json()) as { version: string };
      return data.version;
    } catch {
      return null;
    }
  }

  // =========================
  // MODEL MANAGEMENT
  // =========================

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error("Failed to list models");
      const data = (await response.json()) as { models: OllamaModel[] };
      return data.models || [];
    } catch (error) {
      console.error("[OllamaRunner] Failed to list models:", error);
      return [];
    }
  }

  async pullModel(
    name: string,
    onProgress?: (status: string, completed: number, total: number) => void,
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stream: true }),
      });

      if (!response.ok) return false;
      if (!response.body) return false;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = JSON.parse(line) as any;
            onProgress?.(
              data.status || "Downloading...",
              data.completed || 0,
              data.total || 100,
            );
          } catch {
            // Ignore parse errors
          }
        }
      }

      return true;
    } catch (error) {
      console.error("[OllamaRunner] Failed to pull model:", error);
      return false;
    }
  }

  async deleteModel(name: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // =========================
  // GENERATION
  // =========================

  async generate(
    request: OllamaGenerateRequest,
  ): Promise<OllamaGenerateResponse> {
    const taskId = `ollama-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama generate failed: ${response.statusText}`);
      }

      return (await response.json()) as OllamaGenerateResponse;
    } finally {
      this.abortControllers.delete(taskId);
    }
  }

  async *generateStream(
    request: OllamaGenerateRequest,
  ): AsyncGenerator<string, void, unknown> {
    const taskId = `ollama-stream-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama stream failed: ${response.statusText}`);
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
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
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
  // EMBEDDINGS
  // =========================

  async embed(model: string, text: string): Promise<number[]> {
    try {
      // ELITE FIX: Modern Ollama (v0.1.34+) uses /api/embed with 'input'
      // Legacy use /api/embeddings with 'prompt'
      let response = await fetch(`${this.baseUrl}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: text }),
      });

      // Endpoint detection logic
      if (response.status === 404) {
        const contentType = response.headers.get("content-type") || "";
        // If modern /api/embed returns JSON, then the ENDPOINT exists but the MODEL is missing.
        if (contentType.includes("application/json")) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          if (errorData.error) {
            throw new Error(`Ollama model "${model}" not found: ${errorData.error}`);
          }
        }

        // Otherwise, try legacy fallback
        response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: text }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorMessage = response.statusText;
        try {
          const json = JSON.parse(errorText);
          errorMessage = json.error || errorMessage;
        } catch { /* use statusText */ }
        throw new Error(`Ollama embed failed (${response.status}): ${errorMessage}`);
      }

      const data = (await response.json()) as { embeddings?: number[][], embedding?: number[] };

      // Handle different response formats
      if (data.embeddings && Array.isArray(data.embeddings)) {
        return data.embeddings[0] || [];
      }
      return data.embedding || [];
    } catch (error) {
      console.error("[OllamaRunner] Embedding failed:", error);
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
 * Infer capabilities from Ollama model name/details
 */
export function inferCapabilities(model: OllamaModel): ModelCapability[] {
  const capabilities: ModelCapability[] = ["fast"];
  const name = model.name.toLowerCase();
  const family = model.details.family?.toLowerCase() || "";
  const paramSize = model.details.parameter_size || "";

  // Vision models
  if (
    name.includes("llava") ||
    name.includes("bakllava") ||
    name.includes("moondream") ||
    name.includes("vision")
  ) {
    capabilities.push("vision");
  }

  // Code models
  if (
    name.includes("code") ||
    name.includes("starcoder") ||
    name.includes("deepseek-coder") ||
    name.includes("codellama")
  ) {
    capabilities.push("code");
  }

  // Reasoning (larger models)
  const sizeMatch = paramSize.match(/(\d+)/);
  const size = sizeMatch?.[1] ? parseInt(sizeMatch[1], 10) : 0;
  if (size >= 7) {
    capabilities.push("reasoning");
  }

  // Embedding models
  if (
    name.includes("embed") ||
    name.includes("nomic") ||
    name.includes("minilm") ||
    name.includes("bge")
  ) {
    capabilities.push("embedding");
  }

  // Long context
  if (
    name.includes("128k") ||
    name.includes("long") ||
    family.includes("qwen")
  ) {
    capabilities.push("long_context");
  }

  return capabilities;
}

/**
 * Convert Ollama model to AIModel format
 */
export function ollamaToAIModel(
  model: OllamaModel,
  baseUrl: string,
): Partial<AIModel> {
  return {
    name: model.name,
    provider: "ollama",
    modelId: model.model,
    endpoint: baseUrl,
    capabilities: inferCapabilities(model),
    requirements: {
      modelSizeGB: model.size / 1024 ** 3,
    },
    enabled: false,
    priority: 50,
  };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let ollamaInstance: OllamaRunner | null = null;

export function getOllamaRunner(baseUrl?: string): OllamaRunner {
  if (!ollamaInstance || (baseUrl && baseUrl !== ollamaInstance["baseUrl"])) {
    ollamaInstance = new OllamaRunner(baseUrl);
  }
  return ollamaInstance;
}

/**
 * Quick check if Ollama is running
 */
export async function isOllamaAvailable(): Promise<boolean> {
  return getOllamaRunner().isHealthy();
}

/**
 * Discover all Ollama models and convert to AIModel format
 */
export async function discoverOllamaModels(): Promise<Partial<AIModel>[]> {
  const runner = getOllamaRunner();
  const isAvailable = await runner.isHealthy();

  if (!isAvailable) {
    console.log("[OllamaRunner] Ollama not available");
    return [];
  }

  const models = await runner.listModels();
  console.log(`[OllamaRunner] Found ${models.length} models`);

  return models.map((m) => ollamaToAIModel(m, "http://localhost:11434"));
}
