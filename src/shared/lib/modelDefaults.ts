/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic model configuration and local storage parsing */
/**
 * Model Defaults for VWO Elite
 * Future-proof architecture: defaults used when user hasn't selected a model
 */

import { ModelInfo } from "@shared/types/config";

import { classifyModel } from "./modelClassifier";

const CAPABILITIES_CACHE_KEY = "vwo-elite-capabilities-v1";

export interface ModelCapabilities {
  general: number;  // LMSYS / Algemene intelligentie
  speech: number;   // TTS kwaliteit & Latentie
  vision: number;   // OCR & Image understanding
  coding: number;   // Syntaxis & Logica
}

export type ModelDomain = keyof ModelCapabilities;

/**
 * Benchmark Registry - Source of Truth for Model Capabilities
 * Used to sort models by "Power" rather than Alphabetical.
 * Score = LMSYS Chatbot Arena ELO (Jan 2026)
 */
export const CAPABILITY_MATRIX: Record<string, ModelCapabilities> = {
  // Gemini 3.0 Serie (Multi-modal Kings)
  "gemini-3.0-ultra": { general: 1550, speech: 95, vision: 98, coding: 98 },
  "gemini-3.0-pro": { general: 1492, speech: 92, vision: 98, coding: 95 },
  "gemini-3.0-flash": { general: 1470, speech: 96, vision: 94, coding: 90 },

  // Gespecialiseerde Audio Modellen 
  "gemini-2.5-flash-preview-tts": { general: 1200, speech: 100, vision: 10, coding: 30 },
  "gemini-2.5-pro-preview-tts": { general: 1280, speech: 100, vision: 40, coding: 50 },
  "gemini-2.5-flash-native-audio-latest": { general: 1250, speech: 98, vision: 85, coding: 70 },

  // Beeld-georiënteerde modellen 
  "imagen-4.0-generate-001": { general: 100, speech: 0, vision: 100, coding: 0 },
  "veo-3.0-generate-001": { general: 100, speech: 0, vision: 100, coding: 0 },

  // Older Versions
  "gemini-2.0-flash-exp": { general: 1280, speech: 95, vision: 85, coding: 80 },
  "gemini-1.5-pro": { general: 1297, speech: 85, vision: 80, coding: 85 },
  "gemini-1.5-flash": { general: 1227, speech: 80, vision: 75, coding: 70 },

  // Kimi / Moonshot (Elite context models)
  "moonshot-v1-8k": { general: 1250, speech: 0, vision: 40, coding: 80 },
  "moonshot-v1-32k": { general: 1280, speech: 0, vision: 40, coding: 82 },
  "moonshot-v1-128k": { general: 1320, speech: 0, vision: 40, coding: 85 },
  "kimi-k2.5": { general: 1530, speech: 90, vision: 95, coding: 96 },

  // Anthropic Claude 3.5 (The Logic Kings)
  "claude-3-5-sonnet-latest": { general: 1510, speech: 0, vision: 94, coding: 96 },
  "claude-3-5-haiku-latest": { general: 1420, speech: 0, vision: 80, coding: 85 },
  "claude-3-opus-latest": { general: 1480, speech: 0, vision: 90, coding: 92 },

  // DeepSeek (Reasoning & Value)
  "deepseek-reasoner": { general: 1545, speech: 0, vision: 0, coding: 98 },
  "deepseek-chat": { general: 1460, speech: 0, vision: 40, coding: 92 },
};

/**
 * Werkt de CapabilityMatrix bij op basis van live API-metadata.
 * Verifieert of een model daadwerkelijk spraak of vision ondersteunt.
 */
export const syncLiveCapabilities = (fetchedModels: ModelInfo[]) => {
  try {
    const existingRaw = localStorage.getItem(CAPABILITIES_CACHE_KEY);
    const cache = existingRaw ? JSON.parse(existingRaw) : {};

    fetchedModels.forEach((model) => {
      const id = model.id.toLowerCase();
      const methods = model.methods.map((m) => m.toLowerCase());

      // Bepaal scores op basis van feitelijke ondersteuning
      const hasBidi = methods.includes("bidigeneratecontent");
      const hasRestAudio = id.includes("tts") || id.includes("audio");

      // Update of initialiseer de matrix entry (in-memory update for this session)
      if (!CAPABILITY_MATRIX[id]) {
        CAPABILITY_MATRIX[id] = {
          general: calculateModelScore(id), // Gebruik ELO fallback
          speech: hasBidi ? 98 : (hasRestAudio ? 90 : 0),
          vision: id.includes("vision") || id.includes("flash") ? 85 : 0,
          coding: id.includes("pro") ? 90 : 70
        };
      }

      // Cache de resultaten voor de UI (de "Verified" badges)
      cache[id] = {
        methods: model.methods,
        lastSeen: Date.now(),
      };
    });

    localStorage.setItem(CAPABILITIES_CACHE_KEY, JSON.stringify(cache));
    console.log(`[Capabilities] Synced ${fetchedModels.length} models to Elite Matrix.`);
  } catch (error) {
    console.warn("[CapabilitiesCache] Failed to sync:", error);
  }
};

export const persistCapabilities = syncLiveCapabilities;

export interface ModelDefaults {
  gemini: {
    chat: string;
    reasoning: string;
    vision: string;
    live: string;
  };
  kimi: {
    chat: string;
    reasoning: string;
  };
  groq: {
    chat: string;
    reasoning: string;
    vision: string;
    live: string;
  };
  huggingface: {
    image: string;
    text: string;
  };
  deepseek?: {
    chat: string;
    reasoning: string;
  };
  anthropic?: {
    chat: string;
    vision: string;
  };
  openrouter?: {
    chat: string;
  };
}

// Default models are used ONLY as fallbacks when a user-selected model is unavailable
// or not configured. They do NOT override explicit user settings from Settings > API Keys.
export const DEFAULT_MODELS: ModelDefaults = {
  gemini: {
    chat: "gemini-flash-latest", // Most reliable alias for this project
    reasoning: "gemini-pro-latest", // Standard pro fallback
    vision: "gemini-flash-latest",
    live: "gemini-2.0-flash-exp",
  },
  kimi: {
    chat: "moonshot-v1-8k",
    reasoning: "moonshot-v1-128k",
  },
  groq: {
    chat: "llama-3.1-8b-instant",
    reasoning: "llama-3.3-70b-versatile",
    vision: "llama-3.2-11b-vision-preview",
    live: "llama-3.1-8b-instant",
  },
  huggingface: {
    image: "black-forest-labs/FLUX.1-schnell",
    text: "Qwen/Qwen2.5-7B-Instruct",
  },
  deepseek: {
    chat: "deepseek-chat",
    reasoning: "deepseek-reasoner",
  },
  anthropic: {
    chat: "claude-3-5-sonnet-latest",
    vision: "claude-3-5-sonnet-latest",
  },
  openrouter: {
    chat: "google/gemini-2.0-flash-001",
  },
};

/**
 * Resolve the active model based on user settings or dynamic modelsStore.
 * Priority: 1) User-selected model, 2) First available from modelsStore matching type, 3) Static defaults
 */
export const resolveModel = (
  provider: "gemini" | "groq" | "huggingface" | "kimi" | "openai" | "cohere" | "anthropic" | "openrouter" | "deepseek" | "mistral" | "replicate" | "hume",
  type: string,
  aiConfig?: any,
  availableModelsFromStore?: ModelInfo[] | string[],
): string => {
  // Normalize store models to ModelInfo format
  const currentAvailable: ModelInfo[] = (availableModelsFromStore || []).map(m =>
    typeof m === "string" ? { id: m, methods: ["generateContent"] } : m
  );

  // 1. Check user-configured model first
  if (aiConfig) {
    const modelKey = `${provider}${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const userModel = aiConfig.models?.[modelKey];

    if (userModel && userModel !== "custom") {
      // ELITE VERIFICATION: Is the user's selected model actually available right now?
      if (currentAvailable.length > 0) {
        // Find match (case insensitive and prefix aware)
        const cleanUser = userModel.replace("models/", "").toLowerCase();
        const found = currentAvailable.find(m => m.id.replace("models/", "").toLowerCase() === cleanUser);

        if (found) {
          // If this is for 'live', verify it supports Bidi. Otherwise, verify it supports generateContent.
          const requiredMethod = type === "live" ? "BidiGenerateContent" : "generateContent";
          const supportsMethod = found.methods.some(meth => meth.toLowerCase().includes(requiredMethod.toLowerCase()));

          if (supportsMethod) return found.id;

          console.warn(`[resolveModel] User model '${userModel}' does not support ${requiredMethod}. Redirecting...`);
        } else {
          console.warn(`[resolveModel] User model '${userModel}' not found in available models. Initiating self-healing resolution.`);
        }
      } else {
        // No list provided yet (e.g. during initial boot), trust the setting for now
        return userModel;
      }
    }

    // Check if there's a custom text value if 'custom' is selected
    const customKey = `${modelKey}Custom`;
    if (userModel === "custom" && aiConfig.models?.[customKey]) {
      return aiConfig.models[customKey];
    }
  }

  // 2. Try to get best matching model from modelsStore (dynamically fetched)
  if (currentAvailable.length > 0) {
    // Determine required capability
    const requiredMethod = type === "live" ? "BidiGenerateContent" : "generateContent";

    // Filter models by type AND capability
    const matches = currentAvailable.filter(m => {
      const typeMatch = classifyModel(m.id).includes(type as any);
      const capabilityMatch = m.methods.some(meth => meth.toLowerCase().includes(requiredMethod.toLowerCase()));
      return typeMatch && capabilityMatch;
    });

    if (matches.length > 0) {
      // Sort by score and pick best
      const scored = matches
        .map(m => ({ id: m.id, score: calculateModelScore(m.id, type === "live" ? "speech" : "general") }))
        .sort((a, b) => b.score - a.score);
      return scored[0]!.id;
    }

    // Fallback search: ignore Type but keep Capability
    const capabilityOnly = currentAvailable.filter(m =>
      m.methods.some(meth => meth.toLowerCase().includes(requiredMethod.toLowerCase()))
    );

    if (capabilityOnly.length > 0) {
      const scored = capabilityOnly
        .map(m => ({ id: m.id, score: calculateModelScore(m.id) }))
        .sort((a, b) => b.score - a.score);
      return scored[0]!.id;
    }

    // Absolute fallback: pick highest scoring model for this provider regardless
    const allScored = currentAvailable
      .map(m => ({ id: m.id, score: calculateModelScore(m.id) }))
      .sort((a, b) => b.score - a.score);
    return allScored[0]!.id;
  }

  // 3. Final fallback to static defaults
  return (DEFAULT_MODELS as any)[provider]?.[type] || (DEFAULT_MODELS as any)[provider]?.chat || "";
};

/**
 * Clean and normalize API keys (removes Bearer prefix and whitespace)
 */
export const cleanKey = (key: string): string => {
  if (!key) return "";
  return key.trim().replace(/^bearer\s+/i, "").replace(/\s+/g, "");
};

export type GeminiModelType = "chat" | "reasoning" | "vision" | "live";
export type KimiModelType = "chat" | "reasoning";
export type GroqModelType = "fast" | "complex";
export type HuggingFaceModelType = "image";

/**
 * Fetch available Gemini models from Google API with capability metadata.
 */
export const fetchGeminiModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchGeminiModels] Starting fetch...");
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanApiKey}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchGeminiModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[fetchGeminiModels] Successfully fetched ${data.models?.length || 0} models`);

    // List of methods that indicate the model is useful for our purposes (standard or live)
    const allowedMethods = ["generateContent", "BidiGenerateContent", "bidiGenerateContent"];

    const models: ModelInfo[] = data.models
      .filter((m: any) =>
        m.supportedGenerationMethods?.some((method: string) => allowedMethods.includes(method)),
      )
      .map((m: any) => ({
        id: m.name.replace("models/", ""),
        methods: m.supportedGenerationMethods || [],
      }))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));

    // Sla feitelijke capaciteiten op in de cache
    persistCapabilities(models);

    return models;
  } catch (error) {
    console.error("[fetchGeminiModels] Unexpected error:", error);
    throw error;
  }
};

/**
 * Fetch available Groq models
 */
export const fetchGroqModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchGroqModels] Starting fetch...");
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchGroqModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[fetchGroqModels] Successfully fetched ${data.data?.length || 0} models`);

    const models: ModelInfo[] = (data.data || []).map((m: any) => ({
      id: m.id,
      methods: ["generateContent"] // Groq models are primarily chat/generateContent
    }));

    persistCapabilities(models);
    return models;
  } catch (error: any) {
    const isAuthError = error.message?.includes("401") || error.message?.includes("403");
    if (isAuthError) {
      console.warn("[fetchGroqModels] Authentication failed. Check key.");
    } else {
      console.error("[fetchGroqModels] Unexpected error:", error);
    }
    throw error;
  }
};

/**
 * Fetch available Kimi (Moonshot AI) models
 */
export const fetchKimiModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchKimiModels] Starting fetch...");
  try {
    const response = await fetch("https://api.moonshot.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
      },
    });

    // Kimi (Moonshot) can be noisy if key is invalid
    if (!response.ok) {
      const isAuthError = response.status === 401 || response.status === 403;
      if (isAuthError) {
        console.warn(`[fetchKimiModels] Authentication failed (${response.status}). Key might be invalid.`);
      } else {
        const errorText = await response.text();
        console.error(`[fetchKimiModels] HTTP Error ${response.status}: ${errorText}`);
      }
      throw new Error(`Kimi API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[fetchKimiModels] Successfully fetched ${data.data?.length || 0} models`);

    const models: ModelInfo[] = (data.data || []).map((m: any) => ({
      id: m.id,
      methods: ["generateContent"]
    }));

    persistCapabilities(models);
    return models;
  } catch (error: any) {
    // Only log strictly unexpected errors. 401s are caught above.
    if (!error.message?.includes("401") && !error.message?.includes("403")) {
      console.error("[fetchKimiModels] Unexpected error:", error);
    }
    throw error;
  }
};

/**
 * Fetch available OpenAI models
 */
export const fetchOpenAIModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchOpenAIModels] Starting fetch...");
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchOpenAIModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models: ModelInfo[] = (data.data || [])
      .filter((m: any) =>
        m.id.includes("gpt") ||
        m.id.includes("o1") ||
        m.id.includes("o3") ||
        m.id.includes("whisper") ||
        m.id.includes("text-embedding")
      )
      .map((m: any) => ({
        id: m.id,
        methods: m.id.includes("whisper") ? ["audioTranscription"] : ["generateContent"]
      }));

    persistCapabilities(models);
    return models;
  } catch (error) {
    console.error("[fetchOpenAIModels] Unexpected error:", error);
    throw error;
  }
};

/**
 * Fetch available Mistral AI models
 */
export const fetchMistralModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchMistralModels] Starting fetch...");
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchMistralModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`Mistral API Error: ${response.status}`);
    }

    const data = await response.json();
    const models: ModelInfo[] = (data.data || []).map((m: any) => ({
      id: m.id,
      methods: ["generateContent"]
    }));

    persistCapabilities(models);
    return models;
  } catch (error: any) {
    console.error("[fetchMistralModels] Unexpected error:", error);
    throw error;
  }
};

/**
 * Fetch available Cohere models
 */
export const fetchCohereModels = async (apiKey: string): Promise<ModelInfo[]> => {
  console.log("[fetchCohereModels] Starting fetch...");
  try {
    const response = await fetch("https://api.cohere.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchCohereModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`Cohere API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models: ModelInfo[] = (data.models || [])
      .filter((m: any) => m.endpoints?.includes("chat") || m.endpoints?.includes("rerank"))
      .map((m: any) => ({
        id: m.name,
        methods: ["generateContent"]
      }));

    persistCapabilities(models);
    return models;
  } catch (error) {
    console.error("[fetchCohereModels] Unexpected error:", error);
    throw error;
  }
};

/**
 * Fetch available Anthropic models
 */
export const fetchAnthropicModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchAnthropicModels] Starting fetch...");
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": cleanApiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchAnthropicModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`Anthropic API Error: ${response.status}`);
    }

    const data = await response.json();
    const models: ModelInfo[] = (data.data || []).map((m: any) => ({
      id: m.id,
      methods: ["generateContent"]
    }));

    persistCapabilities(models);
    return models;
  } catch (error: any) {
    if (!error.message?.includes("401")) {
      console.error("[fetchAnthropicModels] Unexpected error:", error);
    }
    throw error;
  }
};

/**
 * Fetch available OpenRouter models
 */
export const fetchOpenRouterModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchOpenRouterModels] Starting fetch...");
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
        "HTTP-Referer": "https://vwo-elite.app",
        "X-Title": "VWO Elite",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchOpenRouterModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    const models: ModelInfo[] = (data.data || []).map((m: any) => ({
      id: m.id,
      methods: ["generateContent"]
    }));

    persistCapabilities(models);
    return models;
  } catch (error: any) {
    console.error("[fetchOpenRouterModels] Unexpected error:", error);
    throw error;
  }
};

/**
 * Fetch available DeepSeek models
 */
export const fetchDeepSeekModels = async (apiKey: string): Promise<ModelInfo[]> => {
  const cleanApiKey = cleanKey(apiKey);
  console.log("[fetchDeepSeekModels] Starting fetch...");
  try {
    const response = await fetch("https://api.deepseek.com/models", {
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchDeepSeekModels] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`DeepSeek API Error: ${response.status}`);
    }

    const data = await response.json();
    const models: ModelInfo[] = (data.data || []).map((m: any) => ({
      id: m.id,
      methods: ["generateContent"]
    }));

    persistCapabilities(models);
    return models;
  } catch (error: any) {
    console.error("[fetchDeepSeekModels] Unexpected error:", error);
    throw error;
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
 * Replicate 3D generation models
 */
export const COMMON_REPLICATE_3D_MODELS = [
  "openai/shap-e",
  "lucataco/shap-e",
  "cjwbw/shap-e",
];

/**
 * Hume AI Emotional Analysis models
 */
export const COMMON_HUME_EMOTION_MODELS = [
  "prosody", // Speech/Tone
  "face",    // Facial Expression
  "burst",   // Vocal Bursts
  "language", // Contextual Language
];

/**
 * Recommended models for "Hybrid" sorting strategy
 */
export const RECOMMENDED_MODELS = {
  gemini: {
    chat: ["gemini-2.0-flash-exp", "gemini-flash-latest"],
    reasoning: ["gemini-pro-latest", "gemini-2.0-flash-thinking-exp"],
    vision: ["gemini-flash-latest", "gemini-2.0-flash-exp", "gemini-pro-latest"],
    live: [
      "gemini-2.5-flash-native-audio-latest",
      "gemini-flash-latest"
    ],
  },
  kimi: {
    chat: ["kimi-k2.5", "moonshot-v1-8k", "moonshot-v1-32k"],
    reasoning: ["kimi-k2.5", "moonshot-v1-128k"],
  },
  groq: {
    chat: ["llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    reasoning: ["llama-3.3-70b-versatile"],
    vision: ["llama-3.2-11b-vision-preview"],
    live: ["llama-3.1-8b-instant"],
  },
  openai: {
    chat: ["gpt-4o", "gpt-4o-mini"],
    reasoning: ["gpt-4o"],
    vision: ["gpt-4o"],
  },
  cohere: {
    chat: ["command-r", "command-r-plus"],
    reasoning: ["command-r-plus"],
  },
  replicate: {
    threed: ["openai/shap-e"],
  },
  hume: {
    emotion: ["prosody"],
  },
  huggingface: {
    image: ["black-forest-labs/flur-1-schnell"],
  }
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

import { useBenchmarksStore } from "../model/benchmarksStore";

export const calculateModelScore = (modelId: string, domain: ModelDomain = "general"): number => {
  const m = modelId.toLowerCase();

  // 1. Zoek exacte match in de CapabilityMatrix
  if (CAPABILITY_MATRIX[m]) {
    const caps = CAPABILITY_MATRIX[m];
    if (domain === "general") return caps.general;
    // Normalize 0-100 scores to the 1000-1500 ELO range for consistent sorting
    return 1000 + (caps[domain] * 5);
  }

  // 2. Live Benchmark Data (The "Elite" Source)
  if (domain === "general") {
    try {
      const liveScore = useBenchmarksStore.getState().getScore(modelId);
      if (liveScore) return Math.round(liveScore);
    } catch {
      // Store might not be initialized
    }
  }

  // 3. Heuristic for unknown models
  let score = 1000;

  // Use boundary-aware regex to prevent "flash-killer" from matching "flash"
  const hasWord = (word: string) => new RegExp(`\\b${word}\\b`, 'i').test(m);

  if (domain === "speech") {
    if (hasWord("tts") || hasWord("audio")) return 1500;
    if (m.match(/image|imagen|robotics|video|veo|nano-banana/i)) return 0;
  }

  if (domain === "vision" && (hasWord("vision") || hasWord("pixtral"))) return 1400;

  // Version Detection
  if (m.includes("3.5")) score += 550;
  else if (m.includes("3.0") || m.includes("-3-") || m.includes("gemini-3")) score += 450;
  else if (m.includes("2.5")) score += 350;
  else if (m.includes("2.0") || m.includes("-2-")) score += 250;
  else if (m.includes("1.5")) score += 200;
  else score += 100;

  // Tier/Capability Detection
  if (hasWord("thinking") || hasWord("reasoning")) score += 50;
  if (hasWord("ultra")) score += 60;
  if (hasWord("pro") || m.includes("complex") || hasWord("versatile")) score += 40;
  if (hasWord("flash") || hasWord("instant") || hasWord("schnell")) score += 20;
  if (hasWord("exp") || hasWord("preview")) score -= 10;

  return score;
};
