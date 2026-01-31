import { IntelligenceType } from "@shared/lib/modelClassifier";
import { calculateModelScore } from "@shared/lib/modelDefaults";
import { useModelsStore } from "@shared/model/modelsStore";

/**
 * Hierarchy of intelligence: If Provider A fails, try Provider B.
 */
const FALLBACK_CHAIN: Record<IntelligenceType, string[]> = {
    chat: ["gemini", "groq", "kimi"],
    reasoning: ["gemini", "kimi", "groq"], // Gemini (Thinking) > Kimi > Groq (Llama 3.3)
    vision: ["gemini", "groq"],
    live: ["gemini"]
};

export interface FailoverResult {
    provider: string;
    modelId: string;
}

/**
 * Determines the "Next Best Action" when a primary provider fails or is unconfigured.
 * Returns the highest scoring model from the first healthy provider in the fallback chain.
 */
export const getBestAvailableModel = (type: IntelligenceType): FailoverResult | null => {
    const { availableModels, errors } = useModelsStore.getState();
    const chain = FALLBACK_CHAIN[type];

    // Elite Logic: Find the first provider in the chain that is both configured (no errors) and has models
    for (const providerId of chain) {
        // A provider is "Failed" if it has an error in the store
        const hasError = !!errors[providerId];

        // Get models for this provider
        let models: (string | { id: string; methods?: string[] })[] = [];
        if (providerId === "gemini") models = availableModels.gemini;
        else if (providerId === "groq") models = availableModels.groq;
        else if (providerId === "kimi") models = availableModels.kimi;

        // Check if provider is online and has models
        if (!hasError && models && models.length > 0) {
            // Pick the best model based on score for this specific domain
            const scored = models
                .map(m => {
                    const id = typeof m === "string" ? m : m.id;
                    return { id, score: calculateModelScore(id, type === "live" ? "speech" : "general") };
                })
                .sort((a, b) => b.score - a.score);

            const bestModel = scored[0]!.id;

            console.warn(`[Failover] Routing ${type}-capacity request to ${providerId} (${bestModel}).`);
            return { provider: providerId, modelId: bestModel };
        }
    }

    // Final check: include custom providers if no native ones are healthy
    const customProviders = availableModels.custom || {};
    for (const [id, models] of Object.entries(customProviders)) {
        if (!errors[id] && models.length > 0) {
            console.warn(`[Failover] Routing to Custom Node: ${id}`);
            return { provider: id, modelId: models[0]! };
        }
    }

    return null; // All nodes are currently offline or unauthorized
};

/**
 * Helper to check if a specific provider is currently "Elite Ready"
 */
export const isProviderHealthy = (providerId: string): boolean => {
    const { errors, availableModels } = useModelsStore.getState();

    // Custom nodes check
    if (availableModels.custom && availableModels.custom[providerId]) {
        return !errors[providerId] && availableModels.custom[providerId].length > 0;
    }

    // Native nodes check
    const models = (availableModels as Record<string, unknown>)[providerId];
    const hasModels = Array.isArray(models) && models.length > 0;
    return !errors[providerId] && hasModels;
};
