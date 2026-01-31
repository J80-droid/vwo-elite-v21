import { fetchGeminiModels } from "@shared/lib/modelDefaults";
import { useCallback, useEffect, useState } from "react";

interface ModelAvailabilityState {
  models: string[];
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = "vwo-elite-gemini-models-cache";
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export const useModelAvailability = (apiKey?: string) => {
  const [state, setState] = useState<ModelAvailabilityState>({
    models: [],
    loading: false,
    error: null,
  });

  const fetchModels = useCallback(async () => {
    let geminiModels: string[] = [];
    let ollamaModels: string[] = [];

    // 1. Fetch Gemini (Cached)
    if (apiKey) {
      const cached = localStorage.getItem(CACHE_KEY);
      let useCache = false;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const rawModels = parsed.models || [];
          // 🚀 ELITE MIGRATION: Handle legacy object format in cache
          geminiModels = rawModels.map((m: any) => typeof m === 'string' ? m : m.id);

          if (Date.now() - parsed.timestamp < CACHE_DURATION && geminiModels.length > 0) {
            useCache = true;
          }
        } catch (e) {
          console.warn("Legacy cache corruption detected", e);
        }
      }

      if (!useCache) {
        try {
          const fetched = await fetchGeminiModels(apiKey);
          geminiModels = fetched.map(m => m.id);
          if (geminiModels.length > 0) {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), models: geminiModels }),
            );
          }
        } catch (err) {
          console.warn("Gemini fetch failed", err);
        }
      }
    }

    // 2. Fetch Ollama (Always fresh-ish)
    try {
      const { getOllamaRunner } =
        await import("../api/model-runners/ollamaRunner");
      const models = await getOllamaRunner().listModels();
      ollamaModels = models.map((m) => m.model); // Use 'model' field (e.g. "llama3:latest")
    } catch (err) {
      console.warn("Ollama fetch failed", err);
    }

    // 3. Merge & Set State
    const allModels = Array.from(new Set([...geminiModels, ...ollamaModels]));

    if (allModels.length > 0) {
      setState({ models: allModels, loading: false, error: null });
    } else {
      setState({
        models: [],
        loading: false,
        error: "Geen modellen gevonden (Controleer API Key of Ollama)",
      });
    }
  }, [apiKey]);

  // Initial fetch
  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true }));
    fetchModels();
  }, [fetchModels]);

  return { ...state, refresh: fetchModels };
};
