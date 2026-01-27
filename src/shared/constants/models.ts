import { DEFAULT_MODELS } from "@shared/lib/modelDefaults";

/**
 * Gemini Model Configuration
 * Centralized model names for easy updates and environment overrides
 */

// Primary model for fast, general-purpose tasks (quizzes, video analysis, study plans)
export const MODEL_FLASH =
  import.meta.env.VITE_MODEL_FLASH || DEFAULT_MODELS.gemini.chat;

// Advanced model for complex reasoning (problem solving, Socratic coaching)
export const MODEL_PRO =
  import.meta.env.VITE_MODEL_PRO || DEFAULT_MODELS.gemini.reasoning;

// Live API model for real-time voice conversations
// Live API model for real-time voice conversations
export const MODEL_LIVE =
  import.meta.env.VITE_MODEL_LIVE ||
  "gemini-2.5-flash-native-audio-preview-09-2025";

// Video generation model
export const MODEL_VEO = "veo-1.0-generate-preview";

// Image generation model
export const MODEL_IMAGEN = "imagen-3.0-generate-002";

// TTS model for podcast/audio generation
export const MODEL_TTS = "gemini-2.0-flash-exp";

// Fallback model (Reliable, high quota)
export const MODEL_FALLBACK = DEFAULT_MODELS.gemini.chat;
