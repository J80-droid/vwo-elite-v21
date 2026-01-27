/* eslint-disable unused-imports/no-unused-vars */
/**
 * Configuration Service
 * Fetches remote configuration for AI routing and features.
 * Falls back to local defaults if remote fails or is unreachable.
 */

import { resolveModel } from "@shared/lib/modelDefaults";

interface ModelConfig {
  provider: "groq" | "huggingface" | "gemini";
  model: string;
  priority: number;
  enabled: boolean;
}

interface RemoteAIConfig {
  routing: ModelConfig[];
  features: {
    use_thinking_models: boolean;
    max_retries: number;
    retry_delay_ms: number;
  };
  version: string;
}

// Local fallback configuration
// Uses resolveModel for dynamic model selection based on user settings
const DEFAULT_CONFIG: RemoteAIConfig = {
  routing: [
    {
      provider: "gemini",
      model: resolveModel("gemini", "chat"),
      priority: 1,
      enabled: true,
    },
    {
      provider: "groq",
      model: resolveModel("groq", "fast"),
      priority: 2,
      enabled: true,
    },
    {
      provider: "huggingface",
      model: "Qwen/Qwen2.5-7B-Instruct",
      priority: 3,
      enabled: true,
    },
  ],
  features: {
    use_thinking_models: false,
    max_retries: 2,
    retry_delay_ms: 1000,
  },
  version: "0.0.0-fallback",
};

const CONFIG_URL = "/ai-config.json"; // In production, point this to CDN/S3/Github Raw
const CACHE_KEY = "vwo-elite-ai-config";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

let currentConfig: RemoteAIConfig | null = null;
let lastFetchTime = 0;

/**
 * Fetch configuration with caching and fallback
 */
export const getAIConfig = async (): Promise<RemoteAIConfig> => {
  const now = Date.now();

  // Use memory cache if valid
  if (currentConfig && now - lastFetchTime < CACHE_DURATION) {
    return currentConfig;
  }

  try {
    console.log("[ConfigService] Fetching remote config...");
    const response = await fetch(CONFIG_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }

    const config = await response.json();

    // Validate basic structure
    if (!Array.isArray(config.routing)) {
      throw new Error("Invalid config: missing routing array");
    }

    currentConfig = config as RemoteAIConfig;
    lastFetchTime = now;

    // Persist to localStorage for offline start
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          config: currentConfig,
          timestamp: now,
        }),
      );
    } catch (e) {
      /* ignore storage errors */
    }

    console.log(`[ConfigService] Config updated (v${currentConfig.version})`);
    return currentConfig;
  } catch (error) {
    console.warn(
      "[ConfigService] Failed to load remote config, trying local cache/fallback:",
      error,
    );

    // Try localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { config } = JSON.parse(cached);
        // Accept stale cache if remote fails
        currentConfig = config;
        return config;
      }
    } catch (e) {
      /* ignore */
    }

    // Final fallback
    console.warn("[ConfigService] Using hardcoded default config");
    return DEFAULT_CONFIG;
  }
};
