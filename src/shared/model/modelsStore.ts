import {
  CAPABILITY_MATRIX,
  COMMON_HUME_EMOTION_MODELS,
  COMMON_REPLICATE_3D_MODELS,
  fetchAnthropicModels,
  fetchCohereModels,
  fetchDeepSeekModels,
  fetchGeminiModels,
  fetchGroqModels,
  fetchKimiModels,
  fetchMistralModels,
  fetchOpenAIModels,
  fetchOpenRouterModels
} from "@shared/lib/modelDefaults";
import { createStore } from "@shared/lib/storeFactory";
import { CustomAIProvider, ModelInfo, UserSettings } from "@shared/types/index";
import { z } from "zod";

type ProviderId = "gemini" | "groq" | "kimi" | "mistral" | string;

/**
 * ELITE PROVIDER REGISTRY
 * Maps provider IDs to their respective fetch functions.
 * Solves the Open/Closed Principle violation by centralizing provider metadata.
 */
const PROVIDER_FETCH_REGISTRY: Record<string, (apiKey: string) => Promise<(ModelInfo | string)[]>> = {
  gemini: fetchGeminiModels,
  groq: fetchGroqModels,
  kimi: fetchKimiModels,
  openai: fetchOpenAIModels,
  cohere: fetchCohereModels,
  anthropic: fetchAnthropicModels,
  openrouter: fetchOpenRouterModels,
  deepseek: fetchDeepSeekModels,
  mistral: fetchMistralModels,
};

// Zod Schema for OpenAI-compatible /models endpoints
const OpenAIModelsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
    })
  ),
});

interface ModelsState {
  availableModels: {
    gemini: ModelInfo[];
    groq: ModelInfo[];
    kimi: ModelInfo[];
    openai: ModelInfo[];
    cohere: ModelInfo[];
    anthropic: ModelInfo[];
    openrouter: ModelInfo[];
    deepseek: ModelInfo[];
    mistral: ModelInfo[];
    replicate: string[];
    hume: string[];
    custom: Record<string, string[]>;
  };
  isLoading: Record<string, boolean>;
  errors: Record<string, string | null>;

  syncProvider: (params: {
    id: ProviderId;
    apiKey: string;
    baseUrl?: string;
    isCustom?: boolean;
    name?: string;
  }) => Promise<void>;

  refreshGeminiModels: (apiKey: string) => Promise<void>;
  refreshGroqModels: (apiKey: string) => Promise<void>;
  refreshKimiModels: (apiKey: string) => Promise<void>;
  refreshOpenAIModels: (apiKey: string) => Promise<void>;
  refreshCohereModels: (apiKey: string) => Promise<void>;
  refreshAnthropicModels: (apiKey: string) => Promise<void>;
  refreshOpenRouterModels: (apiKey: string) => Promise<void>;
  refreshDeepSeekModels: (apiKey: string) => Promise<void>;
  refreshMistralModels: (apiKey: string) => Promise<void>;
  refreshCustomModels: (provider: CustomAIProvider) => Promise<void>;

  initialize: (settings: {
    aiConfig?: UserSettings["aiConfig"];
  }) => Promise<void>;
  fetchRemoteCapabilities: () => Promise<void>;
}

export const useModelsStore = createStore<
  ModelsState,
  { availableModels: ModelsState["availableModels"] }
>(
  (set, get) => ({
    availableModels: {
      gemini: [],
      groq: [],
      kimi: [],
      openai: [],
      cohere: [],
      anthropic: [],
      openrouter: [],
      deepseek: [],
      mistral: [],
      replicate: COMMON_REPLICATE_3D_MODELS,
      hume: COMMON_HUME_EMOTION_MODELS,
      custom: {},
    },
    isLoading: {},
    errors: {},

    syncProvider: async ({ id, apiKey, baseUrl, isCustom, name }) => {
      // 🚀 ELITE VALIDATION: Strict checks for configuration integrity
      if (!apiKey || apiKey.trim().length < 3) {
        set((state) => ({ errors: { ...state.errors, [id]: "Ongeldige of ontbrekende API key" } }));
        return;
      }

      if (isCustom && baseUrl) {
        const urlSchema = z.string().url();
        const urlResult = urlSchema.safeParse(baseUrl);
        if (!urlResult.success) {
          set((state) => ({ errors: { ...state.errors, [id]: "Ongeldige Base URL formaat" } }));
          return;
        }
      }

      set((state) => ({
        isLoading: { ...state.isLoading, [id]: true },
        errors: { ...state.errors, [id]: null },
      }));

      try {
        let models: (string | ModelInfo)[] = [];

        if (isCustom && baseUrl) {
          models = await fetchCustomModelsInternal(baseUrl, apiKey, name || id);
        } else {
          const fetcher = PROVIDER_FETCH_REGISTRY[id];
          if (fetcher) {
            models = await fetcher(apiKey);
          } else {
            console.warn(`[ModelsStore] Unknown native provider: ${id}`);
          }
        }

        if (models.length > 0) {
          set((state) => {
            if (isCustom) {
              return {
                availableModels: {
                  ...state.availableModels,
                  custom: { ...state.availableModels.custom, [id]: models as string[] },
                },
              };
            }
            return {
              availableModels: { ...state.availableModels, [id]: models as ModelInfo[] },
            };
          });
        }
      } catch (err: unknown) {
        const error = err as Error;
        const isUnauthorized = error.message?.includes("401") || error.message?.includes("Unauthorized");
        const isOffline =
          error.message === "NODE_OFFLINE" ||
          error.message?.includes("ECONNREFUSED") ||
          error.message?.includes("Failed to fetch") ||
          error.name === 'AbortError';

        if (isUnauthorized) {
          console.warn(`[ModelsStore] ${id} API: Unauthorized. Check keys.`);
        } else if (isOffline) {
          console.info(`[ModelsStore] ${id} node currently offline.`);
        } else {
          console.error(`[ModelsStore] Sync failed for ${id}:`, err);
        }

        set((state) => ({
          errors: { ...state.errors, [id]: error.message || "Sync failed" },
        }));
      } finally {
        set((state) => ({
          isLoading: { ...state.isLoading, [id]: false },
        }));
      }
    },

    refreshGeminiModels: async (apiKey: string) => get().syncProvider({ id: "gemini", apiKey }),
    refreshGroqModels: async (apiKey: string) => get().syncProvider({ id: "groq", apiKey }),
    refreshKimiModels: async (apiKey: string) => get().syncProvider({ id: "kimi", apiKey }),
    refreshOpenAIModels: async (apiKey: string) => get().syncProvider({ id: "openai", apiKey }),
    refreshCohereModels: async (apiKey: string) => get().syncProvider({ id: "cohere", apiKey }),
    refreshAnthropicModels: async (apiKey: string) => get().syncProvider({ id: "anthropic", apiKey }),
    refreshOpenRouterModels: async (apiKey: string) => get().syncProvider({ id: "openrouter", apiKey }),
    refreshDeepSeekModels: async (apiKey: string) => get().syncProvider({ id: "deepseek", apiKey }),
    refreshMistralModels: async (apiKey: string) => get().syncProvider({ id: "mistral", apiKey }),
    refreshCustomModels: async (p: CustomAIProvider) =>
      get().syncProvider({ id: p.id, apiKey: p.apiKey, baseUrl: p.baseUrl, isCustom: true, name: p.name }),

    // 🚀 Elite Initialization Strategy: Staggered Loading & Remote Sync
    initialize: async (settings) => {
      // 1. Sync remote benchmarks first to ensure optimal routing
      await get().fetchRemoteCapabilities();

      const config = settings.aiConfig;
      if (!config) return;

      const sync = (id: string, key?: string) => {
        if (key) get().syncProvider({ id, apiKey: key });
      };

      // Batch 1: High Priority (Critical for app function) - Immediate
      sync("gemini", config.geminiApiKey);
      sync("openai", config.openaiApiKey);
      sync("anthropic", config.anthropicApiKey);

      // Batch 2: Secondary Providers - 1.5s delay to prevent rate limit spikes
      setTimeout(() => {
        sync("groq", config.groqApiKey);
        sync("deepseek", config.deepSeekApiKey);
        sync("kimi", config.kimiApiKey);
      }, 1500);

      // Batch 3: Long-tail / Experimental - 3s delay
      setTimeout(() => {
        sync("cohere", config.cohereApiKey);
        sync("openrouter", config.openRouterApiKey);
        sync("mistral", config.mistralApiKey);

        // Custom Providers (can be local/slow, so load last)
        config.customProviders?.forEach((p) => {
          if (p.enabled) {
            get().syncProvider({ id: p.id, apiKey: p.apiKey, baseUrl: p.baseUrl, isCustom: true, name: p.name });
          }
        });
      }, 3000);
    },

    fetchRemoteCapabilities: async () => {
      try {
        // Elite Remote Source (Placeholder for VWO Private CDN)
        const REMOTE_URL = "https://vwo-elite.app/api/v1/ai-benchmarks.json";
        const response = await fetch(REMOTE_URL, { signal: AbortSignal.timeout(3000) });
        if (response.ok) {
          const data = await response.json();
          // Merge remote data into the local matrix
          Object.assign(CAPABILITY_MATRIX, data);
          console.log("[ModelsStore] Elite Remote Benchmarks synchronized.");
        }
      } catch (error) {
        console.warn("[ModelsStore] Remote benchmark sync failed (using local fallbacks).", error);
      }
    }
  }),
  {
    name: "models",
    persistOptions: {
      partialize: (state) => ({ availableModels: state.availableModels }),
      merge: (persistedState: unknown, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<ModelsState>) };
        if (merged.availableModels) {
          merged.availableModels = {
            gemini: (merged.availableModels.gemini?.length > 0) ? merged.availableModels.gemini : currentState.availableModels.gemini,
            groq: (merged.availableModels.groq?.length > 0) ? merged.availableModels.groq : currentState.availableModels.groq,
            kimi: (merged.availableModels.kimi?.length > 0) ? merged.availableModels.kimi : currentState.availableModels.kimi,
            openai: (merged.availableModels.openai?.length > 0) ? merged.availableModels.openai : currentState.availableModels.openai,
            cohere: (merged.availableModels.cohere?.length > 0) ? merged.availableModels.cohere : currentState.availableModels.cohere,
            anthropic: (merged.availableModels.anthropic?.length > 0) ? merged.availableModels.anthropic : currentState.availableModels.anthropic,
            openrouter: (merged.availableModels.openrouter?.length > 0) ? merged.availableModels.openrouter : currentState.availableModels.openrouter,
            deepseek: (merged.availableModels.deepseek?.length > 0) ? merged.availableModels.deepseek : currentState.availableModels.deepseek,
            mistral: (merged.availableModels.mistral?.length > 0) ? merged.availableModels.mistral : currentState.availableModels.mistral,
            replicate: (merged.availableModels.replicate?.length > 0) ? merged.availableModels.replicate : currentState.availableModels.replicate,
            hume: (merged.availableModels.hume?.length > 0) ? merged.availableModels.hume : currentState.availableModels.hume,
            custom: merged.availableModels.custom || {},
          };
        }
        return merged;
      },
    },
  }
);

async function fetchCustomModelsInternal(baseUrl: string, apiKey: string, _name: string): Promise<string[]> {
  const normalizedUrl = baseUrl.trim().replace(/\/+$/, "");
  const url = `${normalizedUrl}/models`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey && apiKey !== "none") headers["Authorization"] = `Bearer ${apiKey}`;

  const controller = new AbortController();
  // 🚀 ELITE FIX: Increased timeout to 60s for local LLMs (Ollama/LM Studio cold starts)
  const isLocal = normalizedUrl.includes("localhost") || normalizedUrl.includes("127.0.0.1");
  const TIMEOUT_MS = isLocal ? 60000 : 15000;
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { headers, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawData = await response.json();
    const result = OpenAIModelsResponseSchema.safeParse(rawData);

    if (!result.success) {
      if (Array.isArray(rawData)) {
        return rawData.map(m => typeof m === 'string' ? m : (m?.id || null)).filter(Boolean);
      }
      throw new Error("Invalid API format");
    }

    return result.data.data.map(m => m.id);
  } catch (err: unknown) {
    const error = err as Error;
    // SILENCE NETWORK ERRORS: ERR_CONNECTION_REFUSED or AbortError (timeout) are expected for offline nodes
    const isOffline =
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("Failed to fetch") ||
      error.name === 'AbortError' ||
      error.message?.includes("NetworkError");

    if (isOffline) {
      // Re-throw a clean offline error that syncProvider can catch and log as INFO
      throw new Error("NODE_OFFLINE");
    }
    throw error;
  }
}
