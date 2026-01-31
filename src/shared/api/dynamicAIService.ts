/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic OpenAI-compatible API responses */
/**
 * Dynamic AI Service
 * Universal client for any OpenAI-compatible API (DeepSeek, OpenRouter, local LLMs, etc.)
 */
import { cleanKey } from "../lib/modelDefaults";
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
    mirostatTau?: number;
    mirostatEta?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    repetitionPenalty?: number;
    repetitionPenaltyRange?: number;
    tfsZ?: number;
    topA?: number;
    seed?: number;
    stopSequences?: string[] | string;
    jsonMode?: boolean;
    typicalP?: number;
    logitBias?: Record<string, number>;
    numCtx?: number;
    grammarGBNF?: string;
    loraPath?: string;
    loraScale?: number;
    quantizationLevel?: string;
    flashAttention?: boolean;
    threadCount?: number;
    dynamicTemperature?: boolean;
    modelId?: string;
  } = {},
): Promise<AIResponse> => {
  const { baseUrl, apiKey } = provider;
  const model = options.modelId || provider.models.chat;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleanKey(apiKey)}`,
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
      mirostat_tau: options.mirostat !== 0 ? options.mirostatTau : undefined,
      mirostat_eta: options.mirostat !== 0 ? options.mirostatEta : undefined,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      repetition_penalty: options.repetitionPenalty,
      repetition_penalty_range: options.repetitionPenaltyRange,
      tfs_z: options.tfsZ,
      top_a: options.topA,
      seed: options.seed,
      logit_bias: options.logitBias,
      stop: options.stopSequences,
      num_ctx: options.numCtx,
      num_predict: options.maxTokens,
      // Local Features
      grammar: options.grammarGBNF,
      lora_path: options.loraPath,
      lora_scale: options.loraScale,
      quantization_level: options.quantizationLevel,
      flash_attention: options.flashAttention,
      thread_count: options.threadCount,
      dynamic_temperature: options.dynamicTemperature,
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
        Authorization: `Bearer ${cleanKey(provider.apiKey)}`,
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
