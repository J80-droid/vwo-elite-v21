/**
 * Secure API Key Resolution Service
 *
 * Provides secure resolution of API keys from various sources:
 * 1. Settings store (user-configured keys)
 * 2. Environment variables (dev/build-time keys)
 * 3. Model-specific overrides (apiKeyId references)
 *
 * This service NEVER exposes keys in logs or error messages.
 */

import type { ModelProvider } from "../types/ai-brain";

// Provider-specific environment variable mappings
const ENV_KEY_MAPPING: Record<string, string> = {
  google: "VITE_GEMINI_API_KEY",
  gemini: "VITE_GEMINI_API_KEY",
  openai: "VITE_OPENAI_API_KEY",
  anthropic: "VITE_ANTHROPIC_API_KEY",
  groq: "VITE_GROQ_API_KEY",
  cerebras: "VITE_CEREBRAS_API_KEY",
  sambanova: "VITE_SAMBANOVA_API_KEY",
  mistral: "VITE_MISTRAL_API_KEY",
};

// In-memory secure key cache (cleared on page refresh)
const keyCache = new Map<string, string>();

/**
 * Resolve API key for a given provider
 *
 * Resolution order:
 * 1. Explicit key from model's apiKeyId (if provided)
 * 2. User-configured key from settings store
 * 3. Environment variable fallback
 *
 * @param provider - The model provider (google, openai, etc.)
 * @param apiKeyId - Optional reference to a specific stored key
 * @returns The resolved API key or empty string if not found
 */
export async function resolveApiKey(
  provider: ModelProvider | string,
  apiKeyId?: string,
): Promise<string> {
  // 1. Check cache first
  const cacheKey = `${provider}:${apiKeyId || "default"}`;
  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }

  // 2. Try apiKeyId reference (for custom stored keys)
  if (apiKeyId) {
    const storedKey = localStorage.getItem(`vwo_apikey_${apiKeyId}`);
    if (storedKey) {
      keyCache.set(cacheKey, storedKey);
      return storedKey;
    }
  }

  // 3. Try environment variable
  const envVar = ENV_KEY_MAPPING[provider.toLowerCase()];
  if (envVar) {
    const envKey = import.meta.env[envVar];
    if (envKey) {
      keyCache.set(cacheKey, envKey);
      return envKey;
    }
  }

  // 5. No key found - return empty (caller should handle this gracefully)
  console.warn(`[KeyResolver] No API key found for provider: ${provider}`);
  return "";
}

/**
 * Store an API key securely in local storage
 *
 * @param keyId - Unique identifier for the key
 * @param apiKey - The actual API key value
 */
export function storeApiKey(keyId: string, apiKey: string): void {
  if (!keyId || !apiKey) return;
  localStorage.setItem(`vwo_apikey_${keyId}`, apiKey);
  // Clear cache to pick up new key
  keyCache.clear();
}

/**
 * Remove a stored API key
 *
 * @param keyId - Unique identifier for the key to remove
 */
export function removeApiKey(keyId: string): void {
  localStorage.removeItem(`vwo_apikey_${keyId}`);
  keyCache.clear();
}

/**
 * Clear all cached keys (useful for security-sensitive operations)
 */
export function clearKeyCache(): void {
  keyCache.clear();
}

/**
 * Check if a provider has an API key configured
 */
export async function hasApiKey(
  provider: ModelProvider | string,
): Promise<boolean> {
  const key = await resolveApiKey(provider);
  return key.length > 0;
}
