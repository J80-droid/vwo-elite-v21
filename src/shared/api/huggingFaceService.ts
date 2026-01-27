/// <reference types="vite/client" />
// import { HfInference } from '@huggingface/inference'; // Lazy loaded

const ENV_HF_API_KEY =
  import.meta.env.VITE_HF_API_KEY || import.meta.env.VITE_HF_TOKEN || "";

import { resolveModel } from "@shared/lib/modelDefaults";

// Initialize HF client
const getHfClient = async (customToken?: string) => {
  const token = customToken || ENV_HF_API_KEY;
  if (!token) {
    throw new Error(
      "Hugging Face API Key ontbreekt. Voeg een key toe in Instellingen > API Keys",
    );
  }
  const { HfInference } = await import("@huggingface/inference");
  return new HfInference(token);
};

// ============================================
// TEXT GENERATION MODELS
// ============================================
const TEXT_MODELS = {
  QWEN_7B: "Qwen/Qwen2.5-7B-Instruct",
  PHI_35_MINI: "microsoft/Phi-3.5-mini-instruct",
  MISTRAL_7B: "mistralai/Mistral-7B-Instruct-v0.3",
} as const;

// ============================================
// IMAGE GENERATION
// ============================================
export const generateImageHF = async (
  prompt: string,
  model?: string,
  language: string = "en",
  customToken?: string,
): Promise<string | null> => {
  const hf = await getHfClient(customToken);
  const activeModel = model || resolveModel("huggingface", "image");

  const languageMap: Record<string, string> = {
    nl: "text and labels in Nederlands (Netherlands Dutch), NOT German",
    en: "text and labels in English",
    es: "text and labels in Español (Spanish)",
    fr: "text and labels in Français (French)",
  };
  const langInstruction = languageMap[language] || "text and labels in English";

  const enhancedPrompt = `educational diagram, ${langInstruction}, dark background (#1a1a2e or dark blue), white and light blue text and lines, minimalist style, ${prompt}, high contrast, modern design, professional infographic`;

  try {
    console.log(`[HF Image] Generating with: ${model}`);

    const result = await hf.textToImage({
      model: activeModel,
      inputs: enhancedPrompt,
      parameters: {
        num_inference_steps: 4,
      },
    });

    return URL.createObjectURL(result as unknown as Blob);
  } catch (error: unknown) {
    console.error("[HF Image] Generation failed:", error);
    const err = error as { message?: string };
    if (err?.message?.includes("loading")) {
      throw new Error(`Model is opstarten... Probeer over 20s opnieuw.`);
    }
    if (err?.message?.includes("rate") || err?.message?.includes("429")) {
      throw new Error("Te veel verzoeken. Wacht even.");
    }

    throw error;
  }
};

// ============================================
// TEXT GENERATION
// ============================================

export const isHFTextConfigured = (customToken?: string): boolean =>
  !!(customToken || ENV_HF_API_KEY);

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate text using HuggingFace Inference API
 * Uses chat completion format for instruction-tuned models
 */
export const generateHFText = async (
  prompt: string,
  systemPrompt: string = "You are a helpful assistant.",
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    token?: string;
  } = {},
): Promise<AIResponse> => {
  const hf = await getHfClient(options.token);

  const {
    model = resolveModel("huggingface", "text", options), // Fallback to text default if no model specified
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  try {
    console.log(`[HF Text] Generating with: ${model}`);

    // Use chatCompletion for instruction models
    const response = await hf.chatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: response.usage,
    };
  } catch (error: unknown) {
    console.error("[HF Text] Generation failed:", error);
    const err = error as { message?: string };
    if (err?.message?.includes("loading")) {
      throw new Error(`Model ${model} is opstarten... Wacht 20s.`);
    }
    if (err?.message?.includes("rate") || err?.message?.includes("429")) {
      throw new Error("HuggingFace rate limit bereikt. Wacht even.");
    }
    if (err?.message?.includes("busy")) {
      throw new Error(`Model ${model} is druk. Probeer later.`);
    }

    throw error;
  }
};

/**
 * Chat with history using HuggingFace
 */
export const chatHF = async (
  history: { role: "user" | "assistant"; content: string }[],
  newMessage: string,
  systemPrompt: string = "You are a helpful assistant.",
  model: string = TEXT_MODELS.QWEN_7B,
  customToken?: string,
): Promise<AIResponse> => {
  const hf = await getHfClient(customToken);

  try {
    const response = await hf.chatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: newMessage },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: response.usage,
    };
  } catch (error) {
    console.error("[HF Chat] Failed:", error);
    throw error;
  }
};

/**
 * Health check for HuggingFace API
 */
export const checkHFHealth = async (customToken?: string): Promise<boolean> => {
  if (!isHFTextConfigured(customToken)) {
    // console.log('[HF Health] No API key configured - marking as down');
    return false;
  }

  try {
    const hf = await getHfClient(customToken);
    // Use chatCompletion (conversational task) which is more widely supported for instruction models
    await hf.chatCompletion({
      model: "Qwen/Qwen2.5-Coder-32B-Instruct",
      messages: [{ role: "user", content: "Ping" }],
      max_tokens: 1,
    });
    return true;
  } catch (e: unknown) {
    // Suppress noisy quota/auth errors to keep console clean
    const err = e as { status?: number; message?: string };
    const isQuotaError =
      err?.status === 402 ||
      err?.message?.includes("quota") ||
      err?.message?.includes("limit") ||
      err?.message?.includes("payment");
    if (!isQuotaError) {
      // console.warn('[HF Health] Check failed:', err?.message || e);
    }
    return false;
  }
};
