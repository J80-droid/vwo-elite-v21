/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "../../lib/logger";
import { resolveModel } from "../../lib/modelDefaults";
import { AIConfig } from "../../types/config";
import { generateCustomCompletion } from "../dynamicAIService";
import { BaseProvider } from "./BaseProvider";
import {
    GenerationOptions,
    LLMMessage,
    PROVIDER_ID,
    ProviderCapabilities,
    ProviderResponse
} from "./types";

export class OpenRouterProvider extends BaseProvider {
    readonly id: PROVIDER_ID = "openrouter";
    readonly capabilities: ProviderCapabilities = {
        multimodal: true, // Many models on OpenRouter support vision
        tools: true,
        jsonMode: true,
        maxContext: 128000,
    };

    private mapMessages(msgs?: LLMMessage[]): { role: string; content: string }[] {
        if (!msgs) return [];
        return msgs.map(m => {
            const role: string = m.role === "model" ? "assistant" : m.role;
            return { role, content: m.content };
        });
    }

    async generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse> {
        const startTime = performance.now();
        const model = options.modelId || resolveModel("openrouter", options.intelligenceId || "chat", options.aiConfig);

        try {
            const messages = options.messages
                ? this.mapMessages(options.messages)
                : [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ];

            const config = {
                id: "openrouter",
                name: "OpenRouter",
                baseUrl: "https://openrouter.ai/api/v1",
                apiKey: options.aiConfig?.openRouterApiKey || "",
                enabled: true,
                models: { chat: model }
            };

            const result = await generateCustomCompletion(config as any, messages, options);
            const durationMs = performance.now() - startTime;

            if (result.usage) {
                this.logTelemetry(model, result.usage, durationMs, "success");
            }

            return {
                content: result.content,
                usage: result.usage,
            };
        } catch (error) {
            const durationMs = performance.now() - startTime;
            logger.error(`OpenRouter failed:`, error);
            this.logTelemetry(model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, durationMs, "error");
            throw error;
        }
    }

    isAvailable(config?: AIConfig): boolean {
        return !!config?.openRouterApiKey;
    }
}
