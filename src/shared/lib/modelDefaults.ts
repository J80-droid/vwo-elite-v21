/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic model configuration and local storage parsing */
/**
 * Model Defaults for VWO Elite
 * Future-proof architecture: defaults used when user hasn't selected a model
 */

export interface ModelDefaults {
  gemini: {
    chat: string;
    reasoning: string;
    vision: string;
    live: string;
  };
  groq: {
    fast: string;
    complex: string;
    vision: string;
  };
  huggingface: {
    image: string;
    text: string;
  };
  deepseek?: {
    chat: string;
    reasoning: string;
  };
}

// Default models are used ONLY as fallbacks when a user-selected model is unavailable
// or not configured. They do NOT override explicit user settings from Settings > API Keys.
export const DEFAULT_MODELS: ModelDefaults = {
  gemini: {
    chat: "gemini-1.5-flash", // Stable & Fast
    reasoning: "gemini-1.5-pro", // Strong reasoning
    vision: "gemini-1.5-flash", // Good vision balance
    live: "gemini-2.0-flash-exp", // Keep experimental for Live (no stable equivalent yet)
  },
  groq: {
    fast: "llama-3.1-8b-instant",
    complex: "llama-3.3-70b-versatile",
    vision: "llama-3.2-11b-vision-preview",
  },
  huggingface: {
    image: "black-forest-labs/FLUX.1-schnell",
    text: "Qwen/Qwen2.5-7B-Instruct",
  },
  deepseek: {
    chat: "deepseek-chat",
    reasoning: "deepseek-reasoner",
  },
};

/**
 * Resolve the active model based on user settings or dynamic modelsStore.
 * Priority: 1) User-selected model, 2) First available from modelsStore, 3) Static defaults
 */
export const resolveModel = (
  provider: "gemini" | "groq" | "huggingface",
  type: string,
  aiConfig?: any,
): string => {
  // 1. Check user-configured model first
  if (aiConfig) {
    const modelKey = `${provider}${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const userModel = aiConfig.models?.[modelKey];

    if (userModel && userModel !== "custom") return userModel;

    // Check if there's a custom text value if 'custom' is selected
    const customKey = `${modelKey}Custom`;
    if (userModel === "custom" && aiConfig.models?.[customKey]) {
      return aiConfig.models[customKey];
    }
  }

  // 2. Try to get best matching model from modelsStore (dynamically fetched)
  try {
    const modelsStorage = localStorage.getItem("models-storage-v2");
    if (modelsStorage) {
      const parsed = JSON.parse(modelsStorage);
      const availableModels: string[] = parsed?.state?.availableModels?.[provider];

      if (availableModels && availableModels.length > 0) {
        // ELITE SELECTION: Find the highest scoring model that fits the type's profile
        // instead of searching for hardcoded strings like "flash" or "pro".

        // Filter out restricted models like "deep-research" unless specifically needed
        const filtered = availableModels.filter(m => !m.includes("deep-research"));

        // Sort by performance score (highest first)
        const scoredModels = filtered
          .map(id => ({ id, score: calculateModelScore(id) }))
          .sort((a, b) => b.score - a.score);

        const sorted = scoredModels;
        const best = sorted[0];

        if (best) {
          // Heuristic profile mapping
          if (type === "reasoning") {
            // Pick the absolute best model for reasoning
            return best.id;
          }

          if (type === "chat" || type === "vision") {
            // For standard tasks, we want the highest scoring "Efficient" model.
            // Heuristic: Efficient models usually have "flash", "instant", "schnell" 
            // or scores below the ultra-heavy tier (~1350+ usually means 2 RPM Pro tier)
            const efficient = sorted.find(m =>
              (m.id.includes("flash") || m.id.includes("instant") || m.id.includes("schnell")) &&
              m.score < 1400 // Sanity check to avoid picking a 2 RPM monster by mistake
            );
            return efficient ? efficient.id : best.id;
          }

          return best.id;
        }
      }
    }
  } catch {
    // Fallback to static defaults if store read fails
  }

  // 3. Final fallback to static defaults
  return (DEFAULT_MODELS as any)[provider]?.[type] || "";
};

// Model types for each provider
export type GeminiModelType = "chat" | "reasoning" | "vision" | "live";
export type GroqModelType = "fast" | "complex";
export type HuggingFaceModelType = "image";

/**
 * Fetch available Gemini models from Google API
 */
export const fetchGeminiModels = async (apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error("Invalid API key or API error");
    }

    const data = await response.json();

    // Filter models that support generateContent
    return data.models
      .filter((m: any) =>
        m.supportedGenerationMethods?.includes("generateContent"),
      )
      .map((m: any) => m.name.replace("models/", ""))
      .sort();
  } catch (error) {
    console.error("Failed to fetch Gemini models:", error);
    return [];
  }
};

/**
 * Fetch available Groq models
 */
export const fetchGroqModels = async (apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error("Invalid API key or API error");
    }

    const data = await response.json();

    return data.data.map((m: any) => m.id).sort();
  } catch (error) {
    console.error("Failed to fetch Groq models:", error);
    return [];
  }
};

/**
 * Common Hugging Face image models (API doesn't have easy listing)
 */
export const COMMON_HF_IMAGE_MODELS = [
  "black-forest-labs/FLUX.1-dev",
  "black-forest-labs/FLUX.1-schnell",
  "stabilityai/stable-diffusion-xl-base-1.0",
  "stabilityai/stable-diffusion-2-1",
  "runwayml/stable-diffusion-v1-5",
];

/**
 * Recommended models for "Hybrid" sorting strategy
 */
export const RECOMMENDED_MODELS = {
  gemini: {
    chat: ["gemini-1.5-flash", "gemini-1.5-flash-latest"],
    reasoning: ["gemini-1.5-pro", "gemini-1.5-pro-latest", "gemini-2.0-flash-thinking-exp"],
    vision: ["gemini-1.5-pro", "gemini-1.5-flash"],
    live: ["gemini-2.0-flash-exp"],
  },
  groq: {
    fast: ["llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    complex: ["llama-3.3-70b-versatile"],
    vision: ["llama-3.2-11b-vision-preview"],
  },
};

/**
 * Get visual badge metadata for a model
 */
export const getModelBadge = (model: string): { label?: string; icon?: string; color?: string } => {
  const m = model.toLowerCase();

  if (m.includes("flash") || m.includes("instant") || m.includes("schnell")) {
    return { label: "Fast", icon: "⚡", color: "text-yellow-400" };
  }
  if (m.includes("pro") || m.includes("complex") || m.includes("versatile") || m.includes("thinking")) {
    return { label: "Smart", icon: "🧠", color: "text-purple-400" };
  }
  if (m.includes("exp") || m.includes("preview") || m.includes("beta")) {
    return { label: "Labs", icon: "🧪", color: "text-pink-400" };
  }
  return {}; // No badge
};

/**
 * Benchmark Registry - Source of Truth for Model Capabilities
 * Used to sort models by "Power" rather than Alphabetical.
 * Score = LMSYS Chatbot Arena ELO (Jan 2026)
 */
const MODEL_BENCHMARKS: Record<string, number> = {
  // Gemini 3.0 (The New Kings)
  "gemini-3.0-ultra": 1550, // Projected
  "gemini-3.0-pro": 1492,   // Real LMSYS
  "gemini-3.0-flash": 1470, // Real LMSYS - Beats 1.5 Pro and 2.0 Pro!

  // Gemini 2.0
  "gemini-2.0-flash-thinking-exp": 1350, // Estimated High
  "gemini-2.0-pro-exp": 1320,
  "gemini-2.0-flash-exp": 1280,

  // Gemini 1.5 (Stable Workhorses)
  "gemini-1.5-pro": 1297,       // Real LMSYS
  "gemini-1.5-pro-latest": 1297,
  "gemini-1.5-flash": 1227,     // Real LMSYS
  "gemini-1.5-flash-latest": 1227,
  "gemini-1.5-flash-8b": 1100,

  // Llama / Groq
  "llama-3.3-70b-versatile": 1280, // Estimated (GPT-4 class)
  "mixtral-8x7b-32768": 1150,     // Mistral Medium class
  "llama-3.1-8b-instant": 1100,   // Efficient class
  "gemma-7b-it": 1050,
  "gemma2-9b-it": 1150,
};

/**
 * Calculate a "Power Score" for a model to enable smart sorting.
 * Rules:
 * 1. LIVE Data from benchmarksStore (Real LMSYS ELO).
 * 2. Hardcoded specific overrides (Projected/Beta models).
 * 3. Heuristic fallback (Base 1000 + bonuses).
 */
import { useBenchmarksStore } from "../model/benchmarksStore";

export const calculateModelScore = (modelId: string): number => {
  const m = modelId.toLowerCase();

  // 1. Live Benchmark Data (The "Elite" Source)
  // We access the store state directly outside of React components
  try {
    const liveScore = useBenchmarksStore.getState().getScore(modelId);
    if (liveScore) return Math.round(liveScore);
  } catch {
    // Store might not be initialized or available
  }

  // 2. Exact Static Benchmark Match (Fallback if offline/loading)
  if (MODEL_BENCHMARKS[m]) return MODEL_BENCHMARKS[m];

  // 3. Heuristic for unknown models (scale adapted to ELO ~1000-1500 range)
  let score = 1000; // Base baseline

  // Version Detection
  if (m.includes("3.0") || m.includes("-3-")) score += 300; // Reduced from 400 to be realistic (~1300)
  else if (m.includes("2.5")) score += 350;
  else if (m.includes("2.0") || m.includes("-2-")) score += 250;
  else if (m.includes("1.5")) score += 200;
  else if (m.includes("1.0")) score += 100;

  // Tier/Capability Detection
  if (m.includes("thinking") || m.includes("reasoning")) score += 50;
  if (m.includes("ultra")) score += 60;
  if (m.includes("pro") || m.includes("complex") || m.includes("versatile")) score += 40;
  if (m.includes("flash") || m.includes("instant") || m.includes("schnell")) score += 20;
  if (m.includes("exp") || m.includes("preview")) score -= 10;

  return score;
};
