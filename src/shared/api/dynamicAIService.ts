/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic OpenAI-compatible API responses */
/**
 * Dynamic AI Service
 * Universal client for any OpenAI-compatible API (DeepSeek, OpenRouter, local LLMs, etc.)
 */
import { CustomAIProvider } from "../types";

/**
 * Generate completion using a custom provider
 */
export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate completion using a custom provider
 */
export const generateCustomCompletion = async (
  provider: CustomAIProvider,
  messages: { role: string; content: string }[],
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    minP?: number;
    mirostat?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    repetitionPenalty?: number;
    seed?: number;
    stopSequences?: string[] | string;
    jsonMode?: boolean;
    typicalP?: number;
    logitBias?: Record<string, number>;
  } = {},
): Promise<AIResponse> => {
  const { baseUrl, apiKey } = provider;
  const model = provider.models.chat;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      top_p: options.topP,
      top_k: options.topK,
      min_p: options.minP,
      typical_p: options.typicalP,
      mirostat: options.mirostat,
      mirostat_tau: options.mirostat !== 0 ? (options as any).mirostatTau : undefined,
      mirostat_eta: options.mirostat !== 0 ? (options as any).mirostatEta : undefined,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      repetition_penalty: options.repetitionPenalty,
      repetition_penalty_range: (options as any).repetitionPenaltyRange,
      tfs_z: (options as any).tfsZ,
      seed: options.seed,
      logit_bias: options.logitBias,
      stop: options.stopSequences,
      num_ctx: (options as any).numCtx,
      num_predict: options.maxTokens,
      ...(options.jsonMode && { response_format: { type: "json_object" } }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `[${provider.name}] API error: ${response.status} - ${error}`,
    );
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || "",
    usage: data.usage,
  };
};

/**
 * Fetch available models from a custom provider
 */
export const fetchCustomModels = async (
  provider: CustomAIProvider,
): Promise<string[]> => {
  try {
    const response = await fetch(`${provider.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return data.data?.map((m: any) => m.id).sort() || [];
  } catch (e) {
    console.error(
      `[DynamicAI] Failed to fetch models for ${provider.name}:`,
      e,
    );
    return [];
  }
};

/**
 * Health check for a custom provider
 */
export const checkCustomHealth = async (
  provider: CustomAIProvider,
): Promise<boolean> => {
  if (!provider.apiKey || !provider.baseUrl) return false;

  try {
    await generateCustomCompletion(
      provider,
      [{ role: "user", content: "Ping" }],
      { maxTokens: 1 },
    );
    return true;
  } catch (e) {
    console.warn(`[DynamicAI] Health check failed for ${provider.name}:`, e);
    return false;
  }
};
