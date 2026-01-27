/// <reference types="vite/client" />
/**
 * Groq API Service
 * Primary provider for fast text generation using Llama 3.1 8B
 * Free tier: 30 RPM, very fast inference
 */

import { resolveModel } from "@shared/lib/modelDefaults";
import { AIConfig } from "@shared/types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: {
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Check if Groq API is configured
 */
export const isGroqConfigured = (customKey?: string): boolean => {
  return !!(customKey || GROQ_API_KEY);
};

export interface AIResponse {
  content: string;
  functionCalls?: { name: string; args: Record<string, unknown> }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GroqGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  typicalP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  seed?: number;
  stopSequences?: string[] | string;
  logitBias?: Record<string, number>;
  jsonMode?: boolean;
  apiKey?: string;
  aiConfig?: AIConfig;
  tools?: Record<string, unknown>[];
  messages?: GroqMessage[];
  signal?: AbortSignal;
}

/**
 * Generate text completion using Groq API
 */
export const generateGroqCompletion = async (
  messages: GroqMessage[],
  options: GroqGenerateOptions = {},
): Promise<AIResponse> => {
  const key = options.apiKey || GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "Groq API key ontbreekt. Voeg een key toe in Instellingen > API Keys",
    );
  }

  const {
    model = resolveModel("groq", "fast", options.aiConfig),
    temperature = 0.7,
    maxTokens = 4096,
    jsonMode = false,
  } = options;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: options.topP,
      top_k: options.topK,
      typical_p: options.typicalP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      repetition_penalty: options.repetitionPenalty,
      seed: options.seed,
      logit_bias: options.logitBias,
      stop: options.stopSequences,
      ...(jsonMode && { response_format: { type: "json_object" } }),
      ...(options.tools && { tools: options.tools, tool_choice: "auto" }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data: GroqResponse = await response.json();

  const functionCalls = data.choices[0]?.message?.tool_calls?.map((tc) => ({
    name: tc.function.name,
    args: JSON.parse(tc.function.arguments),
  }));

  return {
    content: data.choices[0]?.message?.content || "",
    functionCalls,
    usage: data.usage,
  };
};

/**
 * Simple text generation with system prompt
 */
export const groqGenerate = async (
  prompt: string,
  systemPrompt: string = "You are a helpful assistant.",
  options: GroqGenerateOptions = {},
): Promise<AIResponse> => {
  const messages: GroqMessage[] = options.messages || [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  return generateGroqCompletion(messages, { ...options, tools: options.tools });
};

/**
 * Health check for Groq API
 * Tries to list models to verify connectivity and API key
 */
export const checkGroqHealth = async (customKey?: string): Promise<boolean> => {
  const key = customKey || GROQ_API_KEY;
  if (!key) {
    return false;
  }

  try {
    // Quick generation test with very low tokens
    await generateGroqCompletion([{ role: "user", content: "Ping" }], {
      maxTokens: 1,
      apiKey: key,
    });
    return true;
  } catch {
    return false;
  }
};
