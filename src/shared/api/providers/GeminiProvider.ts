/* eslint-disable @typescript-eslint/no-explicit-any */
import { concurrency } from "../../lib/concurrency";
import { logger } from "../../lib/logger";
import { resolveModel } from "../../lib/modelDefaults";
import { AIConfig } from "../../types/config";
import { geminiGenerate } from "../geminiBase";
import { BaseProvider } from "./BaseProvider";
import {
    GenerationOptions,
    PROVIDER_ID,
    ProviderCapabilities,
    ProviderResponse
} from "./types";

export class GeminiProvider extends BaseProvider {
    readonly id: PROVIDER_ID = "gemini";
    readonly capabilities: ProviderCapabilities = {
        multimodal: true,
        tools: true,
        jsonMode: true,
        maxContext: 1000000,
    };

    async generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse> {
        const startTime = performance.now();
        const model = resolveModel("gemini", "chat", options.aiConfig);
        const isHighReasoning = model.includes("pro");

        try {
            const result = await concurrency.schedule(async () => {
                return await geminiGenerate(prompt, systemPrompt, {
                    ...options,
                    model,
                    apiKey: options.aiConfig?.geminiApiKey,
                    // Role mapping is handled inside geminiGenerate currently,
                    // but we ensure clean pass-through here.
                    tools: options.tools as any,
                });
            }, isHighReasoning);

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
            logger.error(`Gemini failed:`, error);
            // Partial usage for errors if available (usually not for Gemini SDK)
            this.logTelemetry(model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, durationMs, "error");
            throw error;
        }
    }

    isAvailable(config?: AIConfig): boolean {
        return !!config?.geminiApiKey;
    }
}
