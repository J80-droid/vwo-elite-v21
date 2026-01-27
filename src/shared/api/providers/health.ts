import { AIConfig } from "../../types/config";
import { checkGeminiHealth } from "../geminiBase";
import { checkGroqHealth, isGroqConfigured } from "../groqService";
import { checkHFHealth, isHFTextConfigured } from "../huggingFaceService";

export interface ProvidersHealth {
    groq: boolean;
    huggingface: boolean;
    gemini: boolean;
    timestamp: number;
}

/**
 * Check which providers are available based on config
 */
export const getAvailableProviders = (aiConfig?: AIConfig): string[] => {
    const providers: string[] = [];
    if (isGroqConfigured(aiConfig?.groqApiKey)) providers.push("groq");
    if (isHFTextConfigured(aiConfig?.hfToken)) providers.push("huggingface");
    if (aiConfig?.geminiApiKey) providers.push("gemini");
    return providers;
};

/**
 * Check health of all providers in parallel
 */
export const checkProvidersHealth = async (): Promise<ProvidersHealth> => {
    const [groq, hf, gemini] = await Promise.all([
        checkGroqHealth(),
        checkHFHealth(),
        checkGeminiHealth(),
    ]);

    return {
        groq,
        huggingface: hf,
        gemini,
        timestamp: Date.now(),
    };
};
