import type {
  FunctionDeclaration,
  GoogleGenerativeAI,
  ModelParams,
} from "@google/generative-ai";
import { resolveModel } from "@shared/lib/modelDefaults";
import type { AIConfig } from "./providers/types";

const getStoredKey = () => {
  if (typeof localStorage === "undefined") return "";
  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const parsed = JSON.parse(backup);
      return parsed.aiConfig?.geminiApiKey || "";
    }
  } catch {
    console.warn("Failed to read settings backup for API key");
  }
  return "";
};

let genAIInstance: GoogleGenerativeAI | null = null;
let currentKey: string = "";

/**
 * Lazily load and initialize the Google Generative AI SDK
 */
export const getGeminiAPI = async (customKey?: string) => {
  const key = customKey || getStoredKey();

  // Re-initialize if key changed or just started
  if (!genAIInstance || (key && key !== currentKey)) {
    if (key) {
      try {
        // Dynamic import to avoid bundling the heavy SDK in the main bundle
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        genAIInstance = new GoogleGenerativeAI(key);
        currentKey = key;
      } catch (err) {
        console.error(
          "[GeminiBase] Failed to load GoogleGenerativeAI SDK:",
          err,
        );
        throw new Error(
          "Kon de AI-module niet laden. Controleer je internetverbinding.",
        );
      }
    }
  }

  if (!genAIInstance) {
    throw new Error(
      "Gemini API Key ontbreekt of is ongeldig. Ga naar Instellingen > AI Config om je key in te vullen.",
    );
  }

  return genAIInstance;
};

export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[] | string;
  jsonMode?: boolean;
  apiKey?: string;
  aiConfig?: AIConfig;
  tools?: FunctionDeclaration[];
  inlineImages?: { mimeType: string; data: string }[];
  inlineMedia?: { mimeType: string; data: string }[];
  messages?: { role: string; content: string }[];
  signal?: AbortSignal;
  // Expert Parameters
  seed?: number;
  typicalP?: number;
  minP?: number;
}

export const geminiGenerate = async (
  prompt: string,
  systemPrompt: string = "",
  options: GeminiGenerateOptions = {},
) => {
  const modelName =
    options.model || resolveModel("gemini", "chat", options.aiConfig);
  const ai = await getGeminiAPI(options.apiKey);

  const modelOptions: ModelParams = {
    model: modelName,
    systemInstruction: systemPrompt || undefined,
  };

  // Add tools if provided
  if (options.tools && options.tools.length > 0) {
    modelOptions.tools = [{ functionDeclarations: options.tools }];
  }

  const model = ai.getGenerativeModel(modelOptions);

  const config: {
    temperature: number;
    maxOutputTokens: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    responseMimeType?: string;
    seed?: number;
  } = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxTokens ?? 2048,
    topP: options.topP,
    topK: options.topK,
    frequencyPenalty: options.frequencyPenalty,
    presencePenalty: options.presencePenalty,
    stopSequences: typeof options.stopSequences === 'string' ? [options.stopSequences] : options.stopSequences,
    // ELITE: Map Expert Params
    seed: options.seed,
  };

  if (options.jsonMode) {
    config.responseMimeType = "application/json";
  }

  // Use structured conversation history if available, otherwise fall back to prompt/systemPrompt
  const contents = options.messages
    ? options.messages.map(m => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }]
    }))
    : [{
      role: "user",
      parts: [{ text: prompt }, ...(options.inlineImages || []).map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })), ...(options.inlineMedia || []).map(m => ({ inlineData: { mimeType: m.mimeType, data: m.data } }))]
    }];

  const result = await model.generateContent({
    contents,
    generationConfig: config,
  }, { signal: options.signal });

  const response = result.response;
  const usage = response.usageMetadata;

  // Check for function calls
  const candidates = response.candidates;
  const functionCalls = candidates?.[0]?.content?.parts?.filter(
    (p: { functionCall?: unknown }) => p.functionCall,
  );

  return {
    content: response.text() || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    functionCalls: functionCalls?.map((f: any) => f.functionCall) || [],
    usage: usage
      ? {
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0,
      }
      : undefined,
  };
};

export const geminiChat = async (
  history: { role: "user" | "assistant"; content: string }[],
  newMessage: string,
  systemPrompt: string = "",
  modelName?: string,
  options: GeminiGenerateOptions = {},
) => {
  const activeModel =
    modelName || resolveModel("gemini", "chat", options?.aiConfig);
  const formattedHistory = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  const ai = await getGeminiAPI(options?.apiKey);
  const model = ai.getGenerativeModel({
    model: activeModel,
    systemInstruction: systemPrompt || undefined,
  });

  const chat = model.startChat({
    history: formattedHistory,
  });

  const result = await chat.sendMessage(newMessage);
  return result.response.text() || "";
};

/**
 * Health check for Gemini API - 100% dynamic, always fetches fresh model list
 */
export const checkGeminiHealth = async (
  customKey?: string,
): Promise<boolean> => {
  const key = customKey || getStoredKey();
  if (!key) {
    return false;
  }

  try {
    // Fetch available models dynamically (100% fresh, no cache)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return !!(data.models && data.models.length > 0);
  } catch {
    return false;
  }
};
