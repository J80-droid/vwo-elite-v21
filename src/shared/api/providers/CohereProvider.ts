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

export class CohereProvider extends BaseProvider {
    readonly id: PROVIDER_ID = "cohere";
    readonly capabilities: ProviderCapabilities = {
        multimodal: false,
        tools: true,
        jsonMode: true,
        maxContext: 128000,
    };

    private mapChatHistory(msgs?: LLMMessage[]): { role: string; message: string }[] {
        if (!msgs) return [];
        // Cohere uses 'USER' and 'CHATBOT' as roles in chat_history
        return msgs.map(m => ({
            role: m.role === "assistant" || m.role === "model" ? "CHATBOT" : "USER",
            message: m.content
        }));
    }

    async generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse> {
        const startTime = performance.now();
        const model = options.modelId || resolveModel("cohere", "chat", options.aiConfig);

        try {
            const chatHistory = options.messages
                ? this.mapChatHistory(options.messages.slice(0, -1))
                : [];

            const lastMessage = options.messages
                ? options.messages[options.messages.length - 1]?.content || prompt
                : prompt;

            const response = await fetch("https://api.cohere.com/v1/chat", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${options.aiConfig?.cohereApiKey}`,
                    "Content-Type": "application/json",
                    "accept": "application/json"
                },
                body: JSON.stringify({
                    model,
                    message: lastMessage,
                    preamble: systemPrompt,
                    chat_history: chatHistory,
                    temperature: options.temperature ?? 0.3,
                    max_tokens: options.maxTokens ?? 4096,
                    p: options.topP,
                    k: options.topK,
                    ...(options.jsonMode && { response_format: { type: "json_object" } })
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Cohere API error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            const durationMs = performance.now() - startTime;

            const usage = {
                prompt_tokens: data.meta?.tokens?.input_tokens || 0,
                completion_tokens: data.meta?.tokens?.output_tokens || 0,
                total_tokens: (data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0),
            };

            this.logTelemetry(model, usage, durationMs, "success");

            return {
                content: data.text,
                usage,
            };
        } catch (error) {
            const durationMs = performance.now() - startTime;
            logger.error(`Cohere failed:`, error);
            this.logTelemetry(model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, durationMs, "error");
            throw error;
        }
    }

    isAvailable(config?: AIConfig): boolean {
        return !!config?.cohereApiKey;
    }
}
