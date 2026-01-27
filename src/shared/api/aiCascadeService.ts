/**
 * AI Cascade Service (The Brain - Refactored)
 * Refactored architecture using Strategy/Adapter pattern for maximumElite scalability.
 */

import { jsonrepair as jsonRepair } from "jsonrepair";

import { concurrency } from "../lib/concurrency";
import { logger } from "../lib/logger";
import { AIConfig } from "../types/config";
import { ProviderRegistry } from "./providers/ProviderRegistry";
import {
  GenerationOptions,
  LLMFunctionCall,
  LLMMessage,
  LLMToolDefinition,
  ProviderResponse,
} from "./providers/types";

/**
 * ELITE CIRCUIT BREAKER
 * Globally tracks providers that have hit rate limits to prevent thundering herd.
 */
const limitedProviders = new Map<string, number>();

const isProviderBlackballed = (id: string): boolean => {
  const expiry = limitedProviders.get(id);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    limitedProviders.delete(id);
    return false;
  }
  return true;
};

const blackballProvider = (id: string, durationMs: number = 60000) => {
  logger.warn(`[CircuitBreaker] Blackballing ${id.toUpperCase()} for ${durationMs}ms`);
  limitedProviders.set(id, Date.now() + durationMs);
};

// Re-export common types for convenience
export type { LLMFunctionCall, LLMMessage, LLMToolDefinition };

/**
 * Delay between retries helper with active countdown
 */
const sleepWithCountdown = async (
  ms: number,
  onStatus: ((status: string, message: string) => void) | undefined,
  prefix: string
) => {
  const seconds = Math.ceil(ms / 1000);
  for (let i = seconds; i > 0; i--) {
    onStatus?.("waiting", `${prefix} (${i}s)`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Filter cascade based on ACTUAL provider capabilities
 * (Solves Open-Closed Principle violation)
 */
const filterMultimodal = (providers: string[], registry: ProviderRegistry): string[] => {
  return providers.filter((id) => {
    try {
      const provider = registry.get(id);
      return provider.capabilities.multimodal;
    } catch {
      return false; // Provider not found or not initialized
    }
  });
};

/**
 * Resolve the dynamic cascade list based on config
 */
export const getCascade = (aiConfig?: AIConfig): string[] => {
  const providers: string[] = [];

  // Logic from modelDefaults / original flow
  // Usually Gemini is primary for Elite
  providers.push("gemini");

  // Followed by backups
  providers.push("groq");
  providers.push("huggingface");

  // Add custom providers
  if (aiConfig?.customProviders) {
    aiConfig.customProviders
      .filter(p => p.enabled)
      .forEach(p => providers.push(`custom:${p.id}`));
  }

  return providers;
};

/**
 * Compatibility wrapper for legacy services
 */
export const getAvailableProviders = (aiConfig?: AIConfig): string[] => {
  return getCascade(aiConfig);
};

/**
 * Main Orchestrator: Generate text using cascade fallback
 * Tries each provider in order until one succeeds
 */
export const cascadeGenerate = async (
  prompt: string,
  systemPrompt: string = "You are a helpful assistant.",
  options: GenerationOptions = {}
): Promise<ProviderResponse> => {
  const registry = ProviderRegistry.getInstance();
  let providers = getCascade(options.aiConfig);

  if (options.requiresMultimodal || (options.inlineImages && options.inlineImages.length > 0)) {
    providers = filterMultimodal(providers, registry);
  }


  // Determine valid providers upfront to make smarter retry decisions
  const activeProviders = providers.filter(pid => {
    const p = registry.get(pid);
    return p && p.isAvailable(options.aiConfig) && !isProviderBlackballed(pid);
  });

  const errors: string[] = [];

  // If no providers are configured at all
  if (activeProviders.length === 0) {
    throw new Error("Architectural Failure: No AI providers are configured. Please add an API key (Gemini, Groq, or Hugging Face) in settings.");
  }

  // ELITE UX: Notify about the primary provider attempt
  if (activeProviders[0]) {
    options.onStatus?.("generating", `Elite Engine: ${activeProviders[0].toUpperCase()}`);
  }

  for (let provIdx = 0; provIdx < activeProviders.length; provIdx++) {
    const providerId = activeProviders[provIdx]!;
    const provider = registry.get(providerId);

    // We already checked availability, but good to be safe
    if (!provider.isAvailable(options.aiConfig)) continue;

    const isLastProvider = provIdx === activeProviders.length - 1;
    let retries = 0;
    // ELITE LOGIC: If this is the LAST provider, we must wait it out if it hits a rate limit.
    // If not last, we can switch to the next one immediately.
    const maxRetries = isLastProvider ? 5 : 2;

    while (retries <= maxRetries) {
      try {
        // ELITE FIX: Sanitize options for backup providers
        let currentPrompt = prompt;
        const currentOptions = { ...options };

        if (providerId !== 'gemini') {
          currentOptions.inlineImages = [];
          currentOptions.inlineMedia = [];
          currentOptions.requiresMultimodal = false;

          const MAX_SAFE_CHARS = 100000;
          if (currentPrompt.length > MAX_SAFE_CHARS) {
            logger.warn(`[Cascade] Truncating prompt for ${providerId} (${currentPrompt.length} -> ${MAX_SAFE_CHARS})`);
            currentPrompt = `[CONTEXT TRUNCATED FOR BACKUP]\n...${currentPrompt.substring(currentPrompt.length - MAX_SAFE_CHARS)}`;
          }

          if (currentOptions.messages && currentOptions.messages.length > 0) {
            const totalMsgLen = currentOptions.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
            if (totalMsgLen > MAX_SAFE_CHARS) {
              logger.warn(`[Cascade] Pruning messages for ${providerId}`);
              currentOptions.messages = currentOptions.messages.slice(-3);
            }
          }
        }

        return await provider.generate(currentPrompt, systemPrompt, currentOptions);
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const isRateLimit = errorMsg.includes("429") || errorMsg.includes("rate") || errorMsg.includes("quota");
        const isServiceUnavailable = errorMsg.includes("503") || errorMsg.includes("unavailable");

        if (isRateLimit) {
          // ELITE RESILIENCE: Globally throttle concurrency to protect providers
          concurrency.signalRateLimit();

          // STICKY PRIMARY LOGIC: Gemini is 15 RPM, Groq is 3 RPM. 
          // Retrying Gemini is often smarter than switching to a 3 RPM bottleneck.
          const isStickyProvider = providerId === 'gemini';
          const stickyRetries = 2; // Try gemini 3 times total (0, 1, 2)

          if (isStickyProvider && retries < stickyRetries) {
            const waitTime = (retries + 1) * 15000;
            logger.warn(`[Cascade] Sticky retry for ${providerId.toUpperCase()} (${retries + 1}/${stickyRetries}). Waiting ${waitTime}ms...`);
            options.onStatus?.("waiting", `Elite Engine adempauze: Herstellen...`);

            await sleepWithCountdown(waitTime, options.onStatus, "AI Herstel");
            retries++;
            continue;
          }

          // CIRCUIT BREAKER: Only blackball if we've exhausted sticky retries or it's not sticky
          blackballProvider(providerId);

          if (!isLastProvider) {
            // Switch to backup
            const nextIdx = provIdx + 1;
            const nextProviders = activeProviders.slice(nextIdx).filter(pid => !isProviderBlackballed(pid));
            const nextProvider = nextProviders[0];

            const switchMsg = `${providerId.toUpperCase()} Quota Bereikt. Schakelen naar ${nextProvider ? nextProvider.toUpperCase() : 'Volgende'}...`;

            logger.warn(`${providerId} rate limited. Switching...`);
            options.onStatus?.("switching", switchMsg);

            errors.push(`${providerId}: Rate Limit (Switched to backup)`);
            break; // Exit retry loop for this provider, outer loop moves to next
          } else {
            // LAST provider: check if we should wait or if there are ANY healthy backups we skipped
            const hasHealthyBackups = activeProviders.some((pid, idx) => idx > provIdx && !isProviderBlackballed(pid));

            if (hasHealthyBackups) {
              logger.info(`[Cascade] Last provider ${providerId} limited, but healthy backups found. Skipping wait.`);
              break;
            }

            // Truly the last hope: wait it out with adaptive backoff
            const waitTime = (retries + 1) * 20000;
            const waitMsg = `AI Limiet Bereikt: ${providerId.toUpperCase()} is even druk.`;
            logger.warn(`${providerId} rate limited (Last Provider). Waiting ${waitTime}ms`);

            await sleepWithCountdown(waitTime, options.onStatus, waitMsg);

            retries++;
            if (retries > maxRetries) {
              errors.push(`${providerId}: Rate Limit Exhausted (waited total ${waitTime}ms)`);
            }
            continue;
          }
        }

        // Retry on 5xx or connection issues
        if (isServiceUnavailable || retries < maxRetries) {
          retries++;
          // Exponential backoff: 2s, 4s, 8s...
          const backoff = Math.pow(2, retries) * 1000 + Math.random() * 500;
          logger.info(`${providerId} failed (${errorMsg}), retrying in ${Math.round(backoff)}ms...`);

          if (isServiceUnavailable) {
            options.onStatus?.("waiting", `AI Service Even Onbereikbaar: ${providerId.toUpperCase()} herstelt...`);
          }

          await sleep(backoff);
          continue;
        }

        errors.push(`${providerId}: ${errorMsg}`);
        logger.warn(`${providerId} final failure:`, errorMsg);
        break; // Move to next provider
      }
    }

    // GLOBAL RESCUE LOGIC: If all available primary/backups failed due to rate limits
    // and we've reached the end, but it's been a while, we try the first one again.
    if (isLastProvider && errors.some(e => e.includes("Rate Limit"))) {
      const rescueWait = 15000;
      logger.info("[Cascade] GLOBAL RESCUE: All providers exhausted by rate limits. Attempting primary recovery climb...");

      await sleepWithCountdown(rescueWait, options.onStatus, "AI Herstel: Laatste poging");

      const primaryId = activeProviders[0]!;
      const primary = registry.get(primaryId);
      try {
        logger.info(`[Cascade] Global Rescue: Retrying primary provider ${primaryId}`);
        return await primary.generate(prompt, systemPrompt, options);
      } catch (e: unknown) {
        const rescueError = e instanceof Error ? e.message : String(e);
        errors.push(`Global Rescue (${primaryId}): ${rescueError}`);
      }
    }
  }

  throw new Error(`Architectural Failure: All Elite providers exhausted.\n${errors.join("\n")}\n\nTIP: Configure a backup provider (Groq or Hugging Face) in settings to prevent this.`);
};

/**
 * Convenience function for simple text generation
 */
export const aiGenerate = async (
  prompt: string,
  options: GenerationOptions = {}
): Promise<string> => {
  return await concurrency.schedule(async () => {
    const result = await cascadeGenerate(
      prompt,
      options.systemPrompt || "You are a helpful assistant.",
      options
    );
    return result.content;
  }, false, (ms) => {
    // ELITE UX: Map physical RPM guard to status messages
    const seconds = Math.ceil(ms / 1000);
    options.onStatus?.("waiting", `Stroombegrenzing actief: Even geduld (${seconds}s)`);
  }); // Default to FLASH logic for text tasks
};

/**
 * Clean & Parse JSON response using robust library logic
 */
export const aiGenerateJSON = async <T>(
  prompt: string,
  _systemPrompt: string = "You are a helpful assistant that responds in JSON.",
  options: GenerationOptions = {},
): Promise<T> => {
  const result = await concurrency.schedule(async () => {
    return await cascadeGenerate(prompt, options.systemPrompt ?? _systemPrompt, {
      ...options,
      // ELITE FIX: Increase default tokens for complex structures/lessons
      maxTokens: options.maxTokens || 16384,
      jsonMode: true,
    } as GenerationOptions);
  }, true, (ms) => {
    // ELITE UX: Map physical RPM guard to status messages
    const seconds = Math.ceil(ms / 1000);
    options.onStatus?.("waiting", `Elite Engine adempauze: Even geduld (${seconds}s)`);
  }); // Use PRO (High Reasoning) for JSON generation

  const content = result.content;

  try {
    // 1. Precise Match for markdown JSON blocks - ELITE FIX: Pick the LAST one if multiples exist
    const blocks = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/g);
    let jsonString = content;

    if (blocks && blocks.length > 0) {
      const lastBlock = blocks[blocks.length - 1]!;
      // Strip the markers
      jsonString = lastBlock
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    // 2. Battle-tested repair if needed
    try {
      return JSON.parse(jsonString);
    } catch {
      logger.warn("JSON parse failed, triggering Elite Repair...");
      const repaired = jsonRepair(jsonString || "");
      return JSON.parse(repaired);
    }
  } catch {
    // SECURITY FIX: Truncate logs to prevent data leak (GDPR/AVG compliance)
    const snippet = content.length > 100 ? content.substring(0, 100) + "...[REDACTED]" : content;
    logger.error("Final JSON Failure. Content snippet:", snippet);
    throw new Error("Failed to parse AI response. The generated content was malformed or truncated.");
  }
};

// Health checks re-export
export type { ProvidersHealth } from "./providers/health";
export { checkProvidersHealth } from "./providers/health";
