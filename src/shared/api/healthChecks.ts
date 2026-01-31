import { checkGeminiHealth } from "./geminiBase";
import { checkGroqHealth } from "./groqService";
import { checkHFHealth } from "./huggingFaceService";
import { checkKimiHealth } from "./kimiService";

/**
 * Validates OpenAI API Key by listing models
 */
export const checkOpenAIHealth = async (key: string): Promise<boolean> => {
    if (!key || !key.startsWith("sk-")) return false;
    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
                Authorization: `Bearer ${key}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Validates ElevenLabs API Key via user info endpoint
 */
export const checkElevenLabsHealth = async (key: string): Promise<boolean> => {
    if (!key) return false;
    try {
        const response = await fetch("https://api.elevenlabs.io/v1/user", {
            headers: {
                "xi-api-key": key
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Validates Replicate API Key via accounts endpoint
 */
export const checkReplicateHealth = async (key: string): Promise<boolean> => {
    if (!key) return false;
    try {
        const response = await fetch("https://api.replicate.com/v1/account", {
            headers: {
                Authorization: `Token ${key}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Validates Cohere API Key via check-api-key endpoint
 */
export const checkCohereHealth = async (key: string): Promise<boolean> => {
    if (!key) return false;
    try {
        const response = await fetch("https://api.cohere.ai/v1/check-api-key", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json"
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Validates Hume AI API Key via listing jobs (empty list is fine)
 */
export const checkHumeHealth = async (key: string): Promise<boolean> => {
    if (!key) return false;
    try {
        const response = await fetch("https://api.hume.ai/v0/batch/jobs", {
            headers: {
                "X-Hume-Api-Key": key
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Unified health check registry
 */
export const checkProviderHealth = async (providerId: string, key: string): Promise<boolean> => {
    switch (providerId) {
        case "gemini": return checkGeminiHealth(key);
        case "groq": return checkGroqHealth(key);
        case "kimi": return checkKimiHealth(key);
        case "huggingface": return checkHFHealth(key);
        case "openai": return checkOpenAIHealth(key);
        case "elevenlabs": return checkElevenLabsHealth(key);
        case "replicate": return checkReplicateHealth(key);
        case "cohere": return checkCohereHealth(key);
        case "hume": return checkHumeHealth(key);
        default: return key.length > 10; // Fallback for unknown providers
    }
};
