/**
 * Model Discovery Service
 * Auto-discovers local AI models from various runners
 */

import type { AIModel } from "../../types/ai-brain";
import { discoverLMStudioModels, isLMStudioAvailable } from "./lmStudioRunner";
import { discoverOllamaModels, isOllamaAvailable } from "./ollamaRunner";

// =============================================================================
// TYPES
// =============================================================================

export interface DiscoveryResult {
  provider: string;
  available: boolean;
  models: Partial<AIModel>[];
  error?: string;
}

export interface DiscoveryOptions {
  ollama?: boolean;
  lmStudio?: boolean;
  gpt4all?: boolean;
  customPaths?: string[];
  timeout?: number;
}

// =============================================================================
// DISCOVERY SERVICE
// =============================================================================

/**
 * Discover all available local models from supported runners
 */
export async function discoverAllLocalModels(
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult[]> {
  const results: DiscoveryResult[] = [];

  const { ollama = true, lmStudio = true, gpt4all = true } = options;

  // Run all discoveries in parallel
  const discoveries = await Promise.allSettled([
    ollama ? discoverOllamaWithStatus() : Promise.resolve(null),
    lmStudio ? discoverLMStudioWithStatus() : Promise.resolve(null),
    gpt4all ? discoverGPT4AllWithStatus() : Promise.resolve(null),
  ]);

  // Process results
  for (const result of discoveries) {
    if (result.status === "fulfilled" && result.value) {
      results.push(result.value);
    } else if (result.status === "rejected") {
      console.error("[ModelDiscovery] Discovery failed:", result.reason);
    }
  }

  return results;
}

/**
 * Discover Ollama models with status
 */
async function discoverOllamaWithStatus(): Promise<DiscoveryResult> {
  try {
    const available = await isOllamaAvailable();
    if (!available) {
      return {
        provider: "ollama",
        available: false,
        models: [],
        error: "Ollama not running. Start with: ollama serve",
      };
    }

    const models = await discoverOllamaModels();
    return {
      provider: "ollama",
      available: true,
      models,
    };
  } catch (error) {
    return {
      provider: "ollama",
      available: false,
      models: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Discover LM Studio models with status
 */
async function discoverLMStudioWithStatus(): Promise<DiscoveryResult> {
  try {
    const available = await isLMStudioAvailable();
    if (!available) {
      return {
        provider: "lm_studio",
        available: false,
        models: [],
        error: "LM Studio not running. Start local server in LM Studio app.",
      };
    }

    const models = await discoverLMStudioModels();
    return {
      provider: "lm_studio",
      available: true,
      models,
    };
  } catch (error) {
    return {
      provider: "lm_studio",
      available: false,
      models: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Discover GPT4All models with status
 * Note: GPT4All uses a different discovery mechanism (local files)
 */
async function discoverGPT4AllWithStatus(): Promise<DiscoveryResult> {
  // GPT4All stores models in a known location
  // On Windows: %LOCALAPPDATA%/nomic.ai/GPT4All/
  // On macOS: ~/Library/Application Support/nomic.ai/GPT4All/
  // On Linux: ~/.local/share/nomic.ai/GPT4All/

  try {
    // For now, return empty - GPT4All discovery requires filesystem access
    // which is limited in browser context. User can manually add paths.
    return {
      provider: "gpt4all",
      available: false,
      models: [],
      error: "Auto-discovery not available. Add models manually.",
    };
  } catch (error) {
    return {
      provider: "gpt4all",
      available: false,
      models: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// PROVIDER STATUS
// =============================================================================

export interface ProviderStatus {
  provider: string;
  available: boolean;
  version?: string;
  modelCount: number;
  error?: string;
}

/**
 * Check status of all model providers
 */
export async function checkAllProviderStatus(): Promise<ProviderStatus[]> {
  const statuses: ProviderStatus[] = [];

  // Check Ollama
  try {
    const available = await isOllamaAvailable();
    if (available) {
      const models = await discoverOllamaModels();
      statuses.push({
        provider: "Ollama",
        available: true,
        modelCount: models.length,
      });
    } else {
      statuses.push({
        provider: "Ollama",
        available: false,
        modelCount: 0,
        error: "Not running",
      });
    }
  } catch (error) {
    statuses.push({
      provider: "Ollama",
      available: false,
      modelCount: 0,
      error: error instanceof Error ? error.message : "Error",
    });
  }

  // Check LM Studio
  try {
    const available = await isLMStudioAvailable();
    if (available) {
      const models = await discoverLMStudioModels();
      statuses.push({
        provider: "LM Studio",
        available: true,
        modelCount: models.length,
      });
    } else {
      statuses.push({
        provider: "LM Studio",
        available: false,
        modelCount: 0,
        error: "Not running",
      });
    }
  } catch (error) {
    statuses.push({
      provider: "LM Studio",
      available: false,
      modelCount: 0,
      error: error instanceof Error ? error.message : "Error",
    });
  }

  // GPT4All (manual only for now)
  statuses.push({
    provider: "GPT4All",
    available: false,
    modelCount: 0,
    error: "Manual setup required",
  });

  return statuses;
}

// =============================================================================
// KNOWN MODELS DATABASE
// =============================================================================

/**
 * Database of known models with their capabilities
 * Used to fill in details when auto-detection is incomplete
 */
export const KNOWN_MODELS: Record<
  string,
  {
    displayName: string;
    capabilities: string[];
    sizeGB: number;
    description: string;
  }
> = {
  // Ollama popular models
  "llama3.2:3b": {
    displayName: "Llama 3.2 (3B)",
    capabilities: ["fast", "reasoning"],
    sizeGB: 2.0,
    description: "Meta's efficient 3B model. Great for quick tasks.",
  },
  "llama3.1:8b": {
    displayName: "Llama 3.1 (8B)",
    capabilities: ["reasoning", "code"],
    sizeGB: 4.7,
    description: "Balanced performance and quality.",
  },
  "llama3.1:70b": {
    displayName: "Llama 3.1 (70B)",
    capabilities: ["reasoning", "code", "long_context"],
    sizeGB: 40,
    description: "Top-tier open model. Requires powerful GPU.",
  },
  "qwen2.5:3b": {
    displayName: "Qwen 2.5 (3B)",
    capabilities: ["fast", "reasoning"],
    sizeGB: 1.9,
    description: "Alibaba's efficient multilingual model.",
  },
  "qwen2.5:7b": {
    displayName: "Qwen 2.5 (7B)",
    capabilities: ["reasoning", "code", "long_context"],
    sizeGB: 4.4,
    description: "Strong reasoning with 128K context.",
  },
  "phi3:mini": {
    displayName: "Phi-3 Mini (3.8B)",
    capabilities: ["fast", "reasoning"],
    sizeGB: 2.2,
    description: "Microsoft's small but capable model.",
  },
  "mistral:7b": {
    displayName: "Mistral 7B",
    capabilities: ["reasoning", "code"],
    sizeGB: 4.1,
    description: "Popular general-purpose model.",
  },
  "llava:7b": {
    displayName: "LLaVA (7B)",
    capabilities: ["vision", "reasoning"],
    sizeGB: 4.5,
    description: "Vision-language model for image analysis.",
  },
  "llava:13b": {
    displayName: "LLaVA (13B)",
    capabilities: ["vision", "reasoning"],
    sizeGB: 8.0,
    description: "Larger vision-language model.",
  },
  "deepseek-coder:6.7b": {
    displayName: "DeepSeek Coder (6.7B)",
    capabilities: ["code", "reasoning"],
    sizeGB: 3.8,
    description: "Specialized for code generation.",
  },
  "nomic-embed-text": {
    displayName: "Nomic Embed Text",
    capabilities: ["embedding"],
    sizeGB: 0.27,
    description: "Local text embeddings. 768 dimensions.",
  },
  "mxbai-embed-large": {
    displayName: "MixedBread Embed Large",
    capabilities: ["embedding"],
    sizeGB: 0.67,
    description: "High-quality embeddings. 1024 dimensions.",
  },
  moondream: {
    displayName: "Moondream (1.6B)",
    capabilities: ["vision", "fast"],
    sizeGB: 0.9,
    description: "Tiny but capable vision model.",
  },
};

/**
 * Enhance discovered model with known metadata
 */
export function enhanceWithKnownData(
  model: Partial<AIModel>,
): Partial<AIModel> {
  const known = KNOWN_MODELS[model.modelId || ""];
  if (!known) return model;

  return {
    ...model,
    name: known.displayName,
    requirements: {
      ...model.requirements,
      modelSizeGB: known.sizeGB,
    },
  };
}
