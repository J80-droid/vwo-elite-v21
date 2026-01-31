import { AIConfig, CustomAIProvider } from "../../types/config";
export type { AIConfig, CustomAIProvider };

export type PROVIDER_ID = "gemini" | "groq" | "huggingface" | string;

export interface LLMMessage {
    role: "user" | "assistant" | "system" | "model" | "tool";
    content: string;
    name?: string;
}

export interface LLMToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    [key: string]: unknown;
}

export interface LLMFunctionCall {
    name: string;
    args: Record<string, unknown>;
}

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface ProviderResponse {
    content: string;
    functionCalls?: LLMFunctionCall[];
    usage?: TokenUsage;
    cost?: number;
}

export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    topP?: number;
    topK?: number;
    stopSequences?: string[] | string;
    seed?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    repetitionPenalty?: number;
    repetitionPenaltyRange?: number;
    logitBias?: Record<string, number>;
    signal?: AbortSignal;

    // Expert Sampling
    minP?: number;
    typicalP?: number;
    tfsZ?: number;
    topA?: number;
    mirostat?: number;
    mirostatTau?: number;
    mirostatEta?: number;

    // expert Structure & Search
    grammarGBNF?: string;
    jsonModeForced?: boolean;
    beamSearch?: boolean;
    numBeams?: number;
    contrastiveSearch?: boolean;

    // Expert Memory & Performance
    numCtx?: number;
    kvCacheQuantization?: number;
    ropeFrequencyBase?: number;
    ropeFrequencyScale?: number;
    flashAttention?: boolean;
    speculativeDecoding?: boolean;
    dynamicTemperature?: boolean;
    threadCount?: number;

    // Expert Guidance & Local
    cfgScale?: number;
    negativePrompt?: string;
    loraPath?: string;
    loraScale?: number;
    quantizationLevel?: string;
    promptTemplate?: string;

    // Intelligence Identification
    intelligenceId?: string;
    modelId?: string;

    // Advanced features
    inlineImages?: { mimeType: string; data: string }[];
    inlineMedia?: { mimeType: string; data: string }[];
    tools?: LLMToolDefinition[];
    messages?: LLMMessage[];
    requiresMultimodal?: boolean;
    systemPrompt?: string;

    // Custom provider info (passed for custom providers)
    customProvider?: CustomAIProvider;
    aiConfig?: AIConfig;

    // Status callback for UI feedback (e.g., rate limits)
    onStatus?: (status: string, message: string) => void;
    onProgress?: (stage: string, percentage: number) => void;
}

export interface ProviderCapabilities {
    multimodal: boolean;
    tools: boolean;
    jsonMode: boolean;
    maxContext?: number;
}

export interface AIProvider {
    readonly id: PROVIDER_ID;
    readonly capabilities: ProviderCapabilities;

    /**
     * Main generation method
     */
    generate(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions
    ): Promise<ProviderResponse>;

    /**
     * Calculate exact cost if usage is known, or estimate based on model
     */
    calculateCost(model: string, usage: TokenUsage): number;

    /**
     * Check if this provider is configured and available
     */
    isAvailable(config?: AIConfig): boolean;
}
