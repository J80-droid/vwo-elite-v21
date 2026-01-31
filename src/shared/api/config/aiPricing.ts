/**
 * AI Provider Pricing Configuration
 * Prices are USD per 1M tokens
 */

export interface PricingInfo {
    input: number;
    output: number;
}

export const AI_PRICING: Record<string, PricingInfo> = {
    // OpenAI (Reference / Fallback)
    "gpt-4o": { input: 5.0, output: 15.0 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4-turbo": { input: 10.0, output: 30.0 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },

    // Google Gemini
    "gemini-1.5-pro": { input: 3.5, output: 10.5 },
    "gemini-1.5-flash": { input: 0.075, output: 0.3 },
    "gemini-2.0-flash-exp": { input: 0.0, output: 0.0 }, // Free during exp phase usually

    // Anthropic
    "claude-3-5-sonnet": { input: 3.0, output: 15.0 },
    "claude-3-opus": { input: 15.0, output: 75.0 },
    "claude-3-sonnet": { input: 3.0, output: 15.0 },
    "claude-3-haiku": { input: 0.25, output: 1.25 },

    // DeepSeek
    "deepseek-v3": { input: 0.14, output: 0.28 },
    "deepseek-reasoner": { input: 0.14, output: 0.28 },

    // Perplexity
    "llama-3-sonar-large": { input: 1.0, output: 1.0 },
    "llama-3-sonar-small": { input: 0.2, output: 0.2 },

    // Groq (Llama 3 / Meta)
    "llama3-70b": { input: 0.59, output: 0.79 },
    "llama3-8b": { input: 0.05, output: 0.08 },
    "mixtral-8x7b": { input: 0.27, output: 0.27 },

    // Moonshot AI (Kimi)
    "moonshot-v1-8k": { input: 1.6, output: 1.6 },
    "moonshot-v1-32k": { input: 3.3, output: 3.3 },
    "moonshot-v1-128k": { input: 8.3, output: 8.3 },

    // Cohere
    "command-r-plus": { input: 3.0, output: 15.0 },
    "command-r": { input: 0.15, output: 0.6 },
};

export const DEFAULT_PRICING: PricingInfo = { input: 0.1, output: 0.1 };

/**
 * Get pricing for a model with fallback logic
 */
export const getModelPricing = (model: string): PricingInfo => {
    // Deep search for partial matches
    const key = Object.keys(AI_PRICING).find(k => model.includes(k));
    return (key ? AI_PRICING[key] : DEFAULT_PRICING) as PricingInfo;
};
