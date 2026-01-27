// Core utilities and shared helpers for Gemini services
import { AIConfig as UserAIConfig, Language } from "../../types";
import { getGeminiAPI } from "../geminiBase";

// Helper to get full language name for prompts
export const getLangName = (lang: Language): string => {
  switch (lang) {
    case "nl":
      return "Dutch";
    case "es":
      return "Spanish";
    case "fr":
      return "French";
    default:
      return "English";
  }
};

// --- Audio Helpers for Live API ---
export function createBlob(data: Float32Array): {
  data: string;
  mimeType: string;
} {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i]! * 32768;
  }
  let binary = "";
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return {
    data: btoa(binary),
    mimeType: "audio/pcm;rate=16000",
  };
}

export function decodeAudioBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel]! / 32768.0;
    }
  }
  return buffer;
}

// Helper for file conversion
export const fileToGenerativePart = (
  file: File,
): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(",")[1]!;
      resolve({
        inlineData: {
          data: base64data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper for retrying API calls
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 2000,
): Promise<T> => {
  try {
    return await operation();
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      code?: number;
      message?: string;
      statusText?: string;
    };
    const isRateLimit =
      err?.status === 429 || err?.code === 429 || err?.message?.includes("429");
    const isServiceUnavailable =
      err?.status === 503 ||
      err?.code === 503 ||
      err?.statusText === "UNAVAILABLE";

    if (isRateLimit || isServiceUnavailable) {
      // Parse wait time from error message if available
      const waitMatch = err?.message?.match(/retry in (\d+(\.\d+)?)s/);
      if (waitMatch) {
        const waitSeconds = parseFloat(waitMatch![1]!);
        if (waitSeconds > 10) {
          console.warn(
            `Rate limit wait too long(${waitSeconds}s), aborting retries.`,
          );
          const enhancedError = new Error(
            `Rate limit exceeded.Please wait ${Math.ceil(waitSeconds)} seconds.`,
          ) as Error & { status: number; waitTime: number };
          enhancedError.status = 429;
          enhancedError.waitTime = waitSeconds;
          throw enhancedError;
        }
      }

      if (retries > 0) {
        console.warn(
          `API Error(${isRateLimit ? "Rate Limit" : "Service Unavailable"}), retrying in ${delay}ms... (${retries} retries left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * 2);
      }
    }
    throw error;
  }
};

// Generate text embeddings for semantic search
export const generateEmbedding = async (
  text: string,
  aiConfig?: UserAIConfig,
): Promise<number[]> => {
  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey ?? "");
    const model = ai.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);

    if (result.embedding) {
      return result.embedding.values ?? [];
    }
    return [];
  } catch (error) {
    console.error("[GeminiHelpers] Embedding generation failed:", error);
    throw error;
  }
};

/**
 * Generate multiple embeddings in a single native request
 * Elite performance: up to 100 items per request
 */
export const generateEmbeddingsBatch = async (
  texts: string[],
  aiConfig?: UserAIConfig,
): Promise<number[][]> => {
  if (texts.length === 0) return [];
  if (texts.length > 100) {
    console.warn("[GeminiHelpers] Batch size exceeds 100. Splitting is required.");
  }

  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey ?? "");
    const model = ai.getGenerativeModel({ model: "text-embedding-004" });

    const result = await model.batchEmbedContents({
      requests: texts.map(text => ({
        content: { role: "user", parts: [{ text }] },
        model: "models/text-embedding-004"
      }))
    });

    if (result.embeddings) {
      return result.embeddings.map(e => e.values ?? []);
    }
    return [];
  } catch (error) {
    console.error("[GeminiHelpers] Native batch embedding failed:", error);
    throw error;
  }
};
