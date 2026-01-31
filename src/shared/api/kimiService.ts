/**
 * Moonshot AI (Kimi) Service
 * Primary provider for long-context text generation
 */

import { fetchKimiModels } from "@shared/lib/modelDefaults";

/**
 * Health check for Moonshot AI (Kimi)
 * Verifies key by attempting to fetch available models
 */
export const checkKimiHealth = async (apiKey: string): Promise<boolean> => {
    if (!apiKey || apiKey.length < 10) return false;
    try {
        const models = await fetchKimiModels(apiKey);
        return models.length > 0;
    } catch (error) {
        // Detailed error logging for debugging 401s
        console.warn("[KimiHealth] Validation failed:", error);
        return false;
    }
};

/**
 * Common Kimi models for fallback/defaults
 */
export const KIMI_MODELS = [
    "moonshot-v1-8k",
    "moonshot-v1-32k",
    "moonshot-v1-128k"
];
