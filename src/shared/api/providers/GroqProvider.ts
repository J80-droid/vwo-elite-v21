/* eslint-disable @typescript-eslint/no-explicit-any */
import { concurrency } from "../../lib/concurrency";
import { logger } from "../../lib/logger";
import { resolveModel } from "../../lib/modelDefaults";
import { AIConfig } from "../../types/config";
import { groqGenerate, isGroqConfigured } from "../groqService";
import { BaseProvider } from "./BaseProvider";
import {
    GenerationOptions,
    LLMMessage,
    PROVIDER_ID,
    ProviderCapabilities,
    ProviderResponse
} from "./types";

export class GroqProvider extends BaseProvider {
    readonly id: PROVIDER_ID = "groq";
    readonly capabilities: ProviderCapabilities = {
        multimodal: false,
        tools: true,
        jsonMode: true,
        maxContext: 32768,
    };

    private mapMessages(msgs?: LLMMessage[]): any[] {
        if (!msgs) return [];
        return msgs.map(m => {
            let role = String(m.role);
            // Groq uses OpenAI-style roles, so model -> assistant
            if (role === "model") role = "assistant";
            // Ensure only known roles pass through
            if (!["system", "user", "assistant"].includes(role)) role = "user";
            return { role, content: m.content };
        });
    }

    async generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse> {
        const startTime = performance.now();
        // ELITE FIX: Always use dynamic 'fast' resolution to pick the highest scoring available model
        // ELITE FIX: Prioritize explicit model selection from Expert Matrix
        const model = options.modelId || resolveModel("groq", "fast", options.aiConfig);

        try {
            const messages = options.messages
                ? this.mapMessages(options.messages)
                : undefined;

            const result = await concurrency.schedule(async () => {
                return await groqGenerate(prompt, systemPrompt, {
                    ...options,
                    model,
                    messages,
                    apiKey: options.aiConfig?.groqApiKey,
                });
            }, false); // Groq is categorized as Fast (Flash-tier)

            const durationMs = performance.now() - startTime;

            if (result.usage) {
                this.logTelemetry(model, result.usage, durationMs, "success");
            }

            return {
                content: result.content,
                functionCalls: result.functionCalls,
                usage: result.usage,
            };
        } catch (error) {
            const durationMs = performance.now() - startTime;
            logger.error(`Groq failed:`, error);
            this.logTelemetry(model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, durationMs, "error");
            throw error;
        }
    }

    isAvailable(config?: AIConfig): boolean {
        return isGroqConfigured(config?.groqApiKey);
    }
}
