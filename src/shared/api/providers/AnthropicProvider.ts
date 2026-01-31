/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "../../lib/logger";
import { resolveModel } from "../../lib/modelDefaults";
import { AIConfig } from "../../types/config";
import { BaseProvider } from "./BaseProvider";
import {
    GenerationOptions,
    LLMMessage,
    PROVIDER_ID,
    ProviderCapabilities,
    ProviderResponse
} from "./types";

export class AnthropicProvider extends BaseProvider {
    readonly id: PROVIDER_ID = "anthropic";
    readonly capabilities: ProviderCapabilities = {
        multimodal: true, // Claude 3.5 Sonnet supports vision
        tools: true,
        jsonMode: true,
        maxContext: 200000,
    };

    private mapMessages(msgs?: LLMMessage[]): any[] {
        if (!msgs) return [];
        return msgs
            .filter(m => m.role !== "system" && m.role !== "model") // Filter system/model to map correctly
            .map(m => ({
                role: m.role as any,
                content: m.content
            }));
    }

    async generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse> {
        const startTime = performance.now();
        const model = options.modelId || resolveModel("anthropic", options.intelligenceId || "chat", options.aiConfig);

        try {
            // Map messages for Anthropic (expects user/assistant alternation, system is top-level)
            let messages: any[] = [];

            if (options.messages) {
                messages = options.messages
                    .filter(m => m.role !== "system")
                    .map(m => ({
                        role: m.role === "model" ? "assistant" : m.role,
                        content: m.content
                    }));
            } else {
                messages = [{ role: "user", content: prompt }];
            }

            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": options.aiConfig?.anthropicApiKey || "",
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true"
                },
                body: JSON.stringify({
                    model,
                    system: systemPrompt,
                    messages,
                    max_tokens: options.maxTokens || 4096,
                    temperature: options.temperature ?? 0.7,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Anthropic error: ${response.status}`);
            }

            const result = await response.json();
            const durationMs = performance.now() - startTime;

            const usage = {
                prompt_tokens: result.usage?.input_tokens || 0,
                completion_tokens: result.usage?.output_tokens || 0,
                total_tokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)
            };

            this.logTelemetry(model, usage, durationMs, "success");

            return {
                content: result.content[0]?.text || "",
                usage
            };
        } catch (error) {
            const durationMs = performance.now() - startTime;
            logger.error(`Anthropic failed:`, error);
            this.logTelemetry(model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, durationMs, "error");
            throw error;
        }
    }

    isAvailable(config?: AIConfig): boolean {
        return !!config?.anthropicApiKey;
    }
}
