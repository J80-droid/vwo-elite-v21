/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module media
 * @description Audio, Video, and Image Generation services using Gemini
 */

import { MODEL_IMAGEN } from "@shared/lib/constants";

import { AIConfig as UserAIConfig } from "../../types";
import { getGeminiAPI } from "../geminiBase";
import { retryOperation } from "./helpers";

/**
 * Generate podcast-style audio from text using TTS
 */
export const generatePodcastAudio = async (
  text: string,
  aiConfig?: UserAIConfig,
) => {
  const { AudioService } = await import("../audioService");

  // Try to synthesize audio (Google/ElevenLabs)
  const buffer = await AudioService.synthesize(text, aiConfig, {
    provider: aiConfig?.elevenLabsApiKey
      ? "elevenlabs"
      : aiConfig?.googleCloudApiKey
        ? "google"
        : undefined,
  });

  if (!buffer) {
    console.warn(
      "Podcast generation requires a Cloud TTS provider (Google or ElevenLabs).",
    );
    return null;
  }

  // Convert ArrayBuffer to Base64
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    if (b !== undefined) binary += String.fromCharCode(b);
  }
  return window.btoa(binary);
};

/**
 * Generate educational video using Veo model
 */
export const generateVeoVideo = async (
  _prompt: string,
  _imageBase64?: string,
  _aspectRatio: "16:9" | "9:16" = "16:9",
  _aiConfig?: UserAIConfig,
) => {
  console.warn(
    "Video generation is currently unavailable in the Web SDK. Please use a backend service.",
  );
  return null;
};

/**
 * Generate educational images using Imagen model
 */
export const generateEducationalImage = async (
  prompt: string,
  _size: "1K" | "2K" = "1K",
  aiConfig?: UserAIConfig,
) => {
  // Check key for Pro Image model
  if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }
  const freshAi = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = freshAi.getGenerativeModel({ model: MODEL_IMAGEN });

  return retryOperation(async () => {
    const response = await model.generateContent(prompt);
    const candidates = response.response.candidates;
    for (const part of candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};
