import { fetchGeminiModels, fetchGroqModels } from "@shared/lib/modelDefaults";
import { createStore } from "@shared/lib/storeFactory";
import { CustomAIProvider } from "@shared/types/index";

interface ModelsState {
  availableModels: {
    gemini: string[];
    groq: string[];
    custom: Record<string, string[]>;
  };
  isLoading: Record<string, boolean>;
  error: string | null;

  refreshGeminiModels: (apiKey: string) => Promise<void>;
  refreshGroqModels: (apiKey: string) => Promise<void>;
  refreshCustomModels: (provider: CustomAIProvider) => Promise<void>;
  initialize: (settings: {
    aiConfig?: {
      geminiApiKey?: string;
      groqApiKey?: string;
      customProviders?: CustomAIProvider[];
    };
  }) => Promise<void>;
}

export const useModelsStore = createStore<
  ModelsState,
  { availableModels: ModelsState["availableModels"] }
>(
  (set, get) => ({
    availableModels: {
      gemini: [
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-flash-latest",
      ], // Default fallback
      groq: [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "mixtral-8x7b-32768",
      ], // Default fallback
      custom: {},
    },
    isLoading: {
      gemini: false,
      groq: false,
    },
    error: null,

    refreshGeminiModels: async (apiKey: string) => {
      set((state) => ({
        isLoading: { ...state.isLoading, gemini: true },
        error: null,
      }));
      try {
        const models = await fetchGeminiModels(apiKey);
        if (models.length > 0) {
          set((state) => ({
            availableModels: {
              ...state.availableModels,
              gemini: models,
            },
          }));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch Gemini models";
        set({ error: message });
      } finally {
        set((state) => ({
          isLoading: { ...state.isLoading, gemini: false },
        }));
      }
    },

    refreshGroqModels: async (apiKey: string) => {
      set((state) => ({
        isLoading: { ...state.isLoading, groq: true },
        error: null,
      }));
      try {
        const models = await fetchGroqModels(apiKey);
        if (models.length > 0) {
          set((state) => ({
            availableModels: {
              ...state.availableModels,
              groq: models,
            },
          }));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch Groq models";
        set({ error: message });
      } finally {
        set((state) => ({ isLoading: { ...state.isLoading, groq: false } }));
      }
    },

    refreshCustomModels: async (provider: CustomAIProvider) => {
      set((state) => ({
        isLoading: { ...state.isLoading, [provider.id]: true },
        error: null,
      }));
      try {
        // Logic to fetch custom models (OpenAI compatible)
        const response = await fetch(`${provider.baseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch custom models");

        const data = await response.json();
        const models = data.data?.map((m: { id: string }) => m.id) || [];

        set((state) => ({
          availableModels: {
            ...state.availableModels,
            custom: {
              ...state.availableModels.custom,
              [provider.id]: models,
            },
          },
        }));
      } catch (err: unknown) {
        console.error(
          `Failed to fetch custom models for ${provider.name}:`,
          err,
        );
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch custom models";
        set({ error: message });
      } finally {
        set((state) => ({
          isLoading: { ...state.isLoading, [provider.id]: false },
        }));
      }
    },

    initialize: async (settings: {
      aiConfig?: {
        geminiApiKey?: string;
        groqApiKey?: string;
        customProviders?: CustomAIProvider[];
      };
    }) => {
      const { geminiApiKey, groqApiKey, customProviders } =
        settings.aiConfig || {};

      // Trigger background refreshes if keys exist
      if (geminiApiKey) {
        get().refreshGeminiModels(geminiApiKey).catch(console.error);
      }

      if (groqApiKey) {
        get().refreshGroqModels(groqApiKey).catch(console.error);
      }

      if (customProviders && Array.isArray(customProviders)) {
        customProviders.forEach((p: CustomAIProvider) => {
          if (p.enabled) {
            get().refreshCustomModels(p).catch(console.error);
          }
        });
      }
    },
  }),
  {
    name: "models",
    persistOptions: {
      partialize: (state) => ({ availableModels: state.availableModels }),
    },
  }
);
