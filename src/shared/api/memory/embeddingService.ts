/**
 * Embedding Service
 * Handles text embeddings via local models (Ollama) or cloud (Gemini)
 */

import { useModelRegistryStore } from "../../model/modelRegistryStore";
import type { AIModel, ModelProvider } from "../../types/ai-brain";
import {
  getOllamaRunner,
  isOllamaAvailable,
} from "../model-runners/ollamaRunner";

// =============================================================================
// TYPES
// =============================================================================

export interface EmbeddingResult {
  vector: number[];
  model: string;
  provider: ModelProvider;
  dimensions: number;
  cached: boolean;
}

export interface EmbeddingOptions {
  preferLocal?: boolean;
  forceProvider?: ModelProvider;
  model?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Default embedding models
const EMBEDDING_MODELS = {
  ollama: "nomic-embed-text", // 768 dimensions
  gemini: "text-embedding-004", // 768 dimensions
  openai: "text-embedding-3-small", // 1536 dimensions
} as const;

// Cache for embeddings to avoid redundant API calls
const embeddingCache = new Map<string, EmbeddingResult>();
const MAX_CACHE_SIZE = 1000;

// =============================================================================
// EMBEDDING SERVICE CLASS
// =============================================================================

export class EmbeddingService {
  private preferLocal: boolean;
  constructor(options?: { preferLocal?: boolean }) {
    this.preferLocal = options?.preferLocal ?? true;
  }

  /**
   * Generate embedding for text
   * Tries local model first, falls back to cloud
   */
  async embed(
    text: string,
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(text, options);
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Determine provider order
    const providers = this.getProviderOrder(options);

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const result = await (await import("../../lib/concurrency")).concurrency.schedule(async () => {
          return await this.embedWithProvider(text, provider, options);
        }, false); // Embedding is usually fast, Flash-tier

        // Cache the result
        this.cacheResult(cacheKey, result);

        return result;
      } catch (error) {
        console.warn(`[EmbeddingService] ${provider} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error("All embedding providers failed");
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(
    texts: string[],
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    // Check cache for all texts first
    const results: EmbeddingResult[] = new Array(texts.length);
    const toProcessIndices: number[] = [];

    texts.forEach((text, i) => {
      const cacheKey = this.getCacheKey(text, options);
      const cached = embeddingCache.get(cacheKey);
      if (cached) {
        results[i] = { ...cached, cached: true };
      } else {
        toProcessIndices.push(i);
      }
    });

    if (toProcessIndices.length === 0) return results;

    // Process remaining texts in provider-optimized batches
    const providers = this.getProviderOrder(options);
    const provider = providers[0]!; // Primary provider

    // Gemini supports 100, Ollama usually performs better with smaller concurrent batches
    const BATCH_SIZE = provider === "gemini" ? 100 : 10;

    for (let i = 0; i < toProcessIndices.length; i += BATCH_SIZE) {
      const currentIndices = toProcessIndices.slice(i, i + BATCH_SIZE);
      const currentTexts = currentIndices.map(idx => texts[idx]!);

      let batchSuccess = false;
      for (const provider of providers) {
        try {
          const batchResults = await (await import("../../lib/concurrency")).concurrency.schedule(async () => {
            return await this.embedBatchWithProvider(currentTexts, provider, options);
          }, false);

          batchResults.forEach((res, batchIdx) => {
            const originalIdx = currentIndices[batchIdx]!;
            results[originalIdx] = res;
            // Cache each result
            const cacheKey = this.getCacheKey(texts[originalIdx]!, options);
            this.cacheResult(cacheKey, res);
          });
          batchSuccess = true;
          break; // Batch succeeded for this provider
        } catch (error) {
          console.warn(`[EmbeddingService] Batch ${provider} failed, trying next provider...`, error);
        }
      }

      if (!batchSuccess) {
        console.error(`[EmbeddingService] All providers failed for batch at index ${i}`);
        // Last resort: Individual attempts (might still fail but gives clearest logs per item)
        for (const idx of currentIndices) {
          try {
            results[idx] = await this.embed(texts[idx]!, options);
          } catch (e) {
            console.error(`[EmbeddingService] Hard failure for item ${idx}:`, e);
            throw e; // Bubble up if even individual fails all
          }
        }
      }
    }

    return results;
  }

  /**
   * Get embedding dimensions for a model
   */
  getDimensions(provider: ModelProvider): number {
    switch (provider) {
      case "ollama":
        return 768; // nomic-embed-text
      case "gemini":
        return 768; // text-embedding-004
      case "openai":
        return 1536; // text-embedding-3-small
      default:
        return 768;
    }
  }

  /**
   * Check if local embedding is available
   */
  async isLocalAvailable(): Promise<boolean> {
    if (!(await isOllamaAvailable())) {
      return false;
    }

    // Check if embedding model is installed
    const runner = getOllamaRunner();
    try {
      const models = await runner.listModels();
      return models.some(
        (m) =>
          m.name.includes("embed") ||
          m.name.includes("nomic") ||
          m.name.includes("minilm"),
      );
    } catch {
      return false;
    }
  }

  // =========================
  // PRIVATE METHODS
  // =========================

  private async embedBatchWithProvider(
    texts: string[],
    provider: ModelProvider,
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult[]> {
    if (provider === "gemini") {
      const { generateEmbeddingsBatch } = await import("../gemini/helpers");
      const vectors = await generateEmbeddingsBatch(texts);

      return vectors.map(vector => ({
        vector,
        model: EMBEDDING_MODELS.gemini,
        provider: "gemini",
        dimensions: vector.length,
        cached: false,
      }));
    }

    // Default: Process in parallel for providers without native batch API
    return Promise.all(texts.map(text => this.embedWithProvider(text, provider, options)));
  }

  private getProviderOrder(options?: EmbeddingOptions): ModelProvider[] {
    if (options?.forceProvider) {
      return [options.forceProvider];
    }

    // Check registry for configured embedding model
    const registry = useModelRegistryStore.getState();
    const embeddingModel = registry.getBestModelForCapability("embedding");

    if (embeddingModel) {
      // User has configured embedding model
      return [(embeddingModel as AIModel).provider, "gemini"];
    }

    // Default order: local first if preferred
    if (this.preferLocal || options?.preferLocal) {
      return ["ollama", "gemini", "openai"];
    }

    return ["gemini", "ollama", "openai"];
  }

  private async embedWithProvider(
    text: string,
    provider: ModelProvider,
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult> {
    switch (provider) {
      case "ollama":
        return await this.embedWithOllama(text, options?.model);

      case "gemini":
        return await this.embedWithGemini(text);

      case "openai":
        return await this.embedWithOpenAI(text);

      default:
        throw new Error(`Unsupported embedding provider: ${provider}`);
    }
  }

  private async embedWithOllama(
    text: string,
    model?: string,
  ): Promise<EmbeddingResult> {
    const runner = getOllamaRunner();
    const modelName = model || EMBEDDING_MODELS.ollama;

    const vector = await runner.embed(modelName, text);

    return {
      vector,
      model: modelName,
      provider: "ollama",
      dimensions: vector.length,
      cached: false,
    };
  }

  private async embedWithGemini(text: string): Promise<EmbeddingResult> {
    // Import Gemini embedding function
    const { generateEmbedding } = await import("../gemini/helpers");

    const vector = await generateEmbedding(text);

    return {
      vector,
      model: EMBEDDING_MODELS.gemini,
      provider: "gemini",
      dimensions: vector.length,
      cached: false,
    };
  }

  private async embedWithOpenAI(_text: string): Promise<EmbeddingResult> {
    // OpenAI embedding (requires API key)
    // This would use the OpenAI API directly
    throw new Error("OpenAI embedding not implemented - use Gemini or Ollama");
  }

  private getCacheKey(text: string, options?: EmbeddingOptions): string {
    const provider = options?.forceProvider || "auto";
    const model = options?.model || "default";
    // Use first 100 chars + hash for cache key
    const textKey =
      text.length > 100
        ? `${text.slice(0, 100)}_${this.simpleHash(text)}`
        : text;
    return `${provider}:${model}:${textKey}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private cacheResult(key: string, result: EmbeddingResult): void {
    // Evict oldest if cache is full
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
      const firstKey = embeddingCache.keys().next().value;
      if (firstKey) embeddingCache.delete(firstKey);
    }
    embeddingCache.set(key, result);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let embeddingServiceInstance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService({ preferLocal: true });
  }
  return embeddingServiceInstance;
}

/**
 * Quick embedding function
 */
export async function embedText(
  text: string,
  options?: EmbeddingOptions,
): Promise<number[]> {
  const result = await getEmbeddingService().embed(text, options);
  return result.vector;
}

/**
 * Clear embedding cache
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

/**
 * Get cache stats
 */
export function getEmbeddingCacheStats(): { size: number; maxSize: number } {
  return {
    size: embeddingCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}
