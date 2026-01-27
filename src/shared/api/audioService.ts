/**
 * Audio Service
 * Manages Text-to-Speech (TTS) and Audio Playback
 * Supports: Browser Native, Google Cloud TTS, ElevenLabs
 */

import { AIConfig } from "../types";

export type TTSProvider = "browser" | "google" | "elevenlabs";

export interface TTSOptions {
  provider?: TTSProvider;
  voiceId?: string; // For ElevenLabs/Google
  lang?: string; // e.g., 'nl-NL'
  rate?: number; // 0.5 - 2.0
  pitch?: number; // 0.5 - 2.0
}

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

// --- 1. Browser Native TTS ---
const speakBrowser = (text: string, options: TTSOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      return reject(new Error("Browser TTS not supported"));
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || "nl-NL";
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang === utterance.lang &&
        (v.name.includes("Google") || v.name.includes("Premium")),
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};

// --- 2. Google Cloud TTS ---
const speakGoogle = async (
  text: string,
  key: string,
  options: TTSOptions,
): Promise<ArrayBuffer> => {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`;

  const body = {
    input: { text },
    voice: {
      languageCode: options.lang || "nl-NL",
      name: options.voiceId || "nl-NL-Wavenet-B", // Premium Dutch voice
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: options.rate || 1.0,
      pitch: (options.pitch || 1.0) - 1.0 * 20, // Google uses semitones
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google TTS Error: ${response.statusText}`);
  }

  const data = await response.json();
  const audioContent = data.audioContent; // Base64 string

  // Convert Base64 to ArrayBuffer
  const binaryString = window.atob(audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- 3. ElevenLabs TTS ---
const speakElevenLabs = async (
  text: string,
  key: string,
  options: TTSOptions,
): Promise<ArrayBuffer> => {
  const voiceId = options.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel (Default)
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": key,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2", // Better for Dutch
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs Error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
};

// =============================================================================
// MAIN SERVICE
// =============================================================================

export const AudioService = {
  /**
   * Synthesize audio data (ArrayBuffer) without playing
   */
  synthesize: async (
    text: string,
    aiConfig?: AIConfig,
    options: TTSOptions = {},
  ): Promise<ArrayBuffer | null> => {
    let provider = options.provider || "browser";

    // Auto-upgrade
    if (!options.provider) {
      if (aiConfig?.elevenLabsApiKey) provider = "elevenlabs";
      else if (aiConfig?.googleCloudApiKey) provider = "google";
    }

    if (provider === "browser") {
      console.warn(
        "[AudioService] Browser TTS does not support binary synthesis. Use speak() instead.",
      );
      return null;
    }

    if (provider === "elevenlabs" && aiConfig?.elevenLabsApiKey) {
      return await speakElevenLabs(text, aiConfig.elevenLabsApiKey, options);
    } else if (provider === "google" && aiConfig?.googleCloudApiKey) {
      return await speakGoogle(text, aiConfig.googleCloudApiKey, options);
    }

    return null;
  },

  /**
   * Speak text using the best available provider
   */
  speak: async (
    text: string,
    aiConfig?: AIConfig,
    options: TTSOptions = {},
  ): Promise<void> => {
    // 1. Determine Provider
    let provider = options.provider || "browser";

    // Auto-upgrade if keys are present and no specific provider requested
    if (!options.provider) {
      if (aiConfig?.elevenLabsApiKey) provider = "elevenlabs";
      else if (aiConfig?.googleCloudApiKey) provider = "google";
    }

    try {
      // 2. Handle Browser TTS (Direct Playback)
      if (provider === "browser") {
        return await speakBrowser(text, options);
      }

      // 3. Handle Cloud TTS (Fetch Audio -> Play)
      let audioData: ArrayBuffer | null = null;

      if (provider === "elevenlabs" && aiConfig?.elevenLabsApiKey) {
        audioData = await speakElevenLabs(
          text,
          aiConfig.elevenLabsApiKey,
          options,
        );
      } else if (provider === "google" && aiConfig?.googleCloudApiKey) {
        audioData = await speakGoogle(
          text,
          aiConfig.googleCloudApiKey,
          options,
        );
      } else {
        console.warn(
          `[AudioService] Missing key for ${provider}, falling back to browser.`,
        );
        return await speakBrowser(text, options);
      }

      // Play Audio Buffer
      if (audioData) {
        const context = new AudioContext();
        const buffer = await context.decodeAudioData(audioData);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);

        return new Promise((resolve) => {
          source.onended = () => resolve();
        });
      }
    } catch (error) {
      console.error("[AudioService] TTS Failed:", error);
      // Final Fallback
      if (provider !== "browser") {
        console.log("Falling back to browser TTS...");
        return await speakBrowser(text, options);
      }
    }
  },

  /**
   * Stop all playback
   */
  stop: () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Note: AudioContext stop needs reference to source nodes,
    // for now we simplistically just rely on browser TTS cancel or strict lifecycle
  },
};
