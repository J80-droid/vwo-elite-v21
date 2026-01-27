import { logger } from "../../lib/logger";
import { useAIAnalyticsStore } from "../../model/aiStatusStore";
import { AIConfig } from "../../types/config";
import { getModelPricing } from "../config/aiPricing";
import {
    AIProvider,
    GenerationOptions,
    PROVIDER_ID,
    ProviderCapabilities,
    ProviderResponse,
    TokenUsage
} from "./types";

export abstract class BaseProvider implements AIProvider {
    abstract readonly id: PROVIDER_ID;
    abstract readonly capabilities: ProviderCapabilities;

    /**
     * Universal cost calculation based on configuration
     */
    calculateCost(model: string, usage: TokenUsage): number {
        const pricing = getModelPricing(model);
        return (
            (usage.prompt_tokens / 1_000_000) * pricing.input +
            (usage.completion_tokens / 1_000_000) * pricing.output
        );
    }

    /**
     * Abstract generation method to be implemented by children
     */
    abstract generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse>;

    /**
     * Check availability
     */
    abstract isAvailable(config?: AIConfig): boolean;

    /**
     * Log telemetry to the analytics store
     */
    protected logTelemetry(
        model: string,
        usage: TokenUsage,
        durationMs: number,
        status: "success" | "error"
    ): void {
        const cost = this.calculateCost(model, usage);
        const durationSec = durationMs / 1000;
        const tps = durationSec > 0 ? usage.completion_tokens / durationSec : 0;

        // Redacted logging for Elite security
        if (status === "success") {
            logger.debug(`${this.id} (${model}) succeeded: ${usage.total_tokens} tokens in ${durationMs}ms`);
        } else {
            logger.error(`${this.id} (${model}) execution failed`);
        }

        // Fire and forget, no await, no rAF abuse
        const store = useAIAnalyticsStore.getState();
        setTimeout(() => {
            store.addEvent({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                provider: this.id,
                model: model,
                durationMs,
                tps,
                status,
                tokens: {
                    prompt: Math.round(usage.prompt_tokens),
                    completion: Math.round(usage.completion_tokens),
                    total: Math.round(usage.total_tokens),
                },
                cost,
            });
        }, 0);
    }
}
