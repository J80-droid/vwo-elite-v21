import { logger } from "../../lib/logger";
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

export class CustomProvider extends BaseProvider {
    readonly id: PROVIDER_ID;
    readonly capabilities: ProviderCapabilities = {
        multimodal: true, // Custom providers/local LLMs often support vision
        tools: true,
        jsonMode: true,
    };

    constructor(id: string) {
        super();
        this.id = id;
    }

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

        // Determine which custom provider config to use
        let config = options.customProvider;

        if (!config && options.aiConfig?.customProviders) {
            const providerId = this.id.startsWith("custom:") ? this.id.split(":")[1] : this.id;
            config = options.aiConfig.customProviders.find(p => p.id === providerId);
        }

        // Handle explicit local engines (Ollama, LM Studio, etc.) if not explicitly configured
        if (!config && ["ollama", "lmstudio", "jan", "local"].includes(this.id.toLowerCase())) {
            let baseUrl = "http://localhost:11434/v1";
            if (this.id === "lmstudio") baseUrl = "http://localhost:1234/v1";
            if (this.id === "jan") baseUrl = "http://localhost:1337/v1";

            config = {
                id: this.id,
                name: this.id,
                baseUrl,
                apiKey: "none",
                enabled: true,
                models: { chat: "default", embedding: "", image: "", vision: "" }
            };
        }

        if (!config) throw new Error(`Custom provider ${this.id} non configured or not found`);

        const model = options.modelId || config.models.chat;

        try {
            const messages = options.messages
                ? this.mapMessages(options.messages)
                : [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ];

            const result = await generateCustomCompletion(config, messages, options);

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
            logger.error(`Custom Provider (${this.id}) failed:`, error);
            this.logTelemetry(model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, durationMs, "error");
            throw error;
        }
    }

    isAvailable(config?: AIConfig): boolean {
        if (["ollama", "lmstudio", "jan", "local"].includes(this.id.toLowerCase())) return true;

        const providerId = this.id.startsWith("custom:") ? this.id.split(":")[1] : this.id;
        return !!config?.customProviders?.find(p => p.id === providerId && p.enabled);
    }
}
