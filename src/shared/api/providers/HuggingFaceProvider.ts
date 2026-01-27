import { concurrency } from "../../lib/concurrency";
import { logger } from "../../lib/logger";
import { resolveModel } from "../../lib/modelDefaults";
import { AIConfig } from "../../types/config";
import { generateHFText, isHFTextConfigured } from "../huggingFaceService";
import { BaseProvider } from "./BaseProvider";
import {
    GenerationOptions,
    PROVIDER_ID,
    ProviderCapabilities,
    ProviderResponse
} from "./types";

export class HuggingFaceProvider extends BaseProvider {
    readonly id: PROVIDER_ID = "huggingface";
    readonly capabilities: ProviderCapabilities = {
        multimodal: false,
        tools: false,
        jsonMode: false,
        maxContext: 4096,
    };

    async generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse> {
        const startTime = performance.now();
        // ELITE FIX: Dynamic resolution picks the best performant HF model based on scores
        const model = resolveModel("huggingface", "text", options.aiConfig);

        try {
            const result = await concurrency.schedule(async () => {
                return await generateHFText(prompt, systemPrompt, {
                    ...options,
                    model,
                    token: options.aiConfig?.hfToken,
                });
            }, false); // HF is categorized as Fast

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
            logger.error(`HuggingFace failed:`, error);
            this.logTelemetry(model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, durationMs, "error");
            throw error;
        }
    }

    isAvailable(config?: AIConfig): boolean {
        return isHFTextConfigured(config?.hfToken);
    }
}
