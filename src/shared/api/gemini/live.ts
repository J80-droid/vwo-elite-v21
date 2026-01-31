import { calculateModelScore } from "@shared/lib/modelDefaults";

import { AIConfig as UserAIConfig, Language } from "../../types";
import { LiveClient, LiveEvent } from "./liveClient";

export interface LiveSession {
  sendAudio: (data: Float32Array) => void;
  sendPCM: (base64: string) => void;
  sendText: (text: string) => void;
  close: () => void;
}

/**
 * Connect to Gemini Live Session
 * Bridges the UI Audio logic with the LiveClient WebSocket protocol
 */
export const connectLiveSession = async (
  _lang: Language, // Configured via system instruction usually
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void,
  _onNavigate?: (view: string) => void,
  systemInstructionOverride?: string,
  aiConfig?: UserAIConfig,
  onTranscript?: (text: string, isUser: boolean) => void,
): Promise<LiveSession> => {
  const apiKey = aiConfig?.geminiApiKey;

  if (!apiKey) {
    console.warn("Missing Gemini API Key. Live session cannot start.");
    throw new Error("Gemini API Key vereist voor Live Voice.");
  }
  console.log("[LiveService] API Key validated.");

  // Helper to decode PCM output from Gemini (24kHz typically) to AudioBuffer
  // Note: We need an AudioContext to decode, but we might not have one here.
  // The UI passes `onAudioData(AudioBuffer)`.
  // To create an AudioBuffer, we need an AudioContext.
  // We can create a temporary offline context for decoding?
  // Actually, Gemini sends PCM data (raw bytes). 'decodeAudioData' expects a file format (WAV/MP3).
  // Raw PCM needs manual conversion to AudioBuffer.
  // Let's assume onAudioData handles playing. We need to convert ArrayBuffer (PCM) to AudioBuffer.

  // Create a persistent context for decoding helper?
  // Actually, we can just pass the raw float data if the UI accepted it.
  // But the UI expects `AudioBuffer`.
  console.log("[LiveService] Initializing AudioContext for output decoding...");
  const audioCtx = new AudioContext({ sampleRate: 24000 }); // Gemini native rate
  if (audioCtx.state === "suspended") {
    console.log("[LiveService] AudioContext suspended, will attempt to resume on output...");
  }

  const handleLiveEvent = (event: LiveEvent) => {
    if (event.type === "close" || event.type === "error") {
      if (event.type === "error") {
        console.error(`[LiveService] Error (${event.reason}): ${event.message}`);
        if (event.fatal) onClose();
      } else {
        onClose();
      }
    } else if (event.type === "audio") {
      // Convert PCM 16/24 int data (ArrayBuffer) to Float32 AudioBuffer
      const rawData = event.data;
      // Assume 16-bit PCM Little Endian
      const int16 = new Int16Array(rawData);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        const val = int16[i];
        if (val !== undefined) {
          float32[i] = val / 32768.0;
        }
      }

      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      onAudioData(buffer);
    } else if (event.type === "text" && onTranscript) {
      console.log("[LiveService] Received text from Gemini:", event.text);
      onTranscript(event.text, false); // false = AI (model)
    }
  };

  console.log("[LiveService] Creating LiveClient instance...");

  const modelToUse = aiConfig?.models?.geminiLive || "models/gemini-2.0-flash-exp";

  const client = new LiveClient(
    {
      apiKey,
      systemInstruction: systemInstructionOverride,
      voiceName: aiConfig?.geminiVoice,
      model: modelToUse,
    },
    handleLiveEvent,
  );

  console.log("[LiveService] Calling client.connect()...");
  client.connect();

  return {
    sendAudio: (data: Float32Array) => {
      client.sendFloat32Audio(data);
    },
    sendPCM: (base64: string) => {
      client.sendAudioChunk(base64);
    },
    sendText: (text: string) => {
      client.sendText(text);
    },
    close: () => {
      client.close();
      audioCtx.close();
    },
  };
};

export interface VoiceData {
  name: string;
  gender: "male" | "female";
}

export const GEMINI_LIVE_VOICES: VoiceData[] = [
  { name: "Puck", gender: "male" },
  { name: "Charon", gender: "male" },
  { name: "Kore", gender: "female" },
  { name: "Fenrir", gender: "male" },
  { name: "Aoede", gender: "female" },
  { name: "Zephyr", gender: "female" },
  { name: "Orus", gender: "male" },
  { name: "Leda", gender: "female" },
  { name: "Umbriel", gender: "male" },
  { name: "Iapetus", gender: "male" },
  { name: "Achernar", gender: "female" },
  { name: "Achird", gender: "male" },
  { name: "Algenib", gender: "male" },
  { name: "Algieba", gender: "male" },
  { name: "Alnilam", gender: "male" },
  { name: "Autonoe", gender: "female" },
  { name: "Callirrhoe", gender: "female" },
  { name: "Despina", gender: "female" },
  { name: "Enceladus", gender: "male" },
  { name: "Erinome", gender: "female" },
  { name: "Gacrux", gender: "female" },
  { name: "Laomedeia", gender: "female" },
  { name: "Pulcherrima", gender: "female" },
  { name: "Rasalgethi", gender: "male" },
  { name: "Sadachbia", gender: "male" },
  { name: "Sadaltager", gender: "male" },
  { name: "Schedar", gender: "male" },
  { name: "Sulafat", gender: "female" },
  { name: "Vindemiatrix", gender: "female" },
  { name: "Zubenelgenubi", gender: "male" },
];

import { getCachedVoice, saveVoiceToCache } from "./voiceCache";

/**
 * Preview a Gemini voice by generating a short audio snippet
 */
export const previewGeminiVoice = async (
  voiceName: string,
  apiKey: string,
  modelName: string,
) => {
  // 0. ELITE CACHE CHECK
  const cachedAudio = await getCachedVoice(voiceName);
  if (cachedAudio) {
    console.log(`[VoicePreview] CACHE HIT for ${voiceName}. Playing instantly...`);
    return playBase64Audio(cachedAudio);
  }

  // 1. DYNAMIC PREVIEW RESOLUTION
  // We use the Capabilities Cache (populated via fetchGeminiModels) to find a model
  // that definitely supports standard REST 'generateContent' with AUDIO modality.
  const cacheRaw = localStorage.getItem("vwo-elite-capabilities-v1");
  const cache = cacheRaw ? JSON.parse(cacheRaw) : {};

  let previewModel = modelName;
  const isBidiOnly = modelName.includes("native-audio") && !modelName.includes("latest"); // Preview variants often fail REST

  // Check if selected model supports general REST generation
  const supportsRest = cache[modelName]?.methods?.some((m: string) =>
    m.toLowerCase().includes("generatecontent")
  );

  if (!supportsRest || isBidiOnly) {
    console.log(`[VoicePreview] Model ${modelName} lacks REST audio support or is Bidi-only. Finding best alternative...`);

    // Filter all cached models for generateContent support AND ensure it's not an image/vision-only model
    const validModels = Object.keys(cache).filter(id => {
      const supportsGen = cache[id].methods?.some((m: string) => m.toLowerCase().includes("generatecontent"));
      const isSpecModel = id.toLowerCase().match(/image|imagen|robotics|video|veo|nano-banana/);
      return supportsGen && !isSpecModel;
    });

    if (validModels.length > 0) {
      // Pick the most powerful available REST model using the Elite Power Score (Speech domain)
      previewModel = validModels.sort((a, b) => calculateModelScore(b, "speech") - calculateModelScore(a, "speech"))[0] || "gemini-2.0-flash-exp";
      console.log(`[VoicePreview] Veilige fallback gekozen: ${previewModel}`);
    } else {
      // Ultimate hardcoded fallback
      previewModel = "gemini-2.0-flash-exp";
    }
  }

  console.log(`[LiveService] Previewing voice: ${voiceName} with model: ${previewModel} (Input was: ${modelName})`);

  // Normalize model name (ensure it doesn't have double 'models/' prefix)
  const cleanModel = previewModel.startsWith("models/") ? previewModel : `models/${previewModel}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: "Hallo! Ik ben een van de nieuwe stemmen van VWO Elite. Hoe klink ik?" }] }],
    generationConfig: {
      response_modalities: ["AUDIO"],
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: voiceName,
          },
        },
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("[LiveService] REST Preview Error Response:", err);
      throw new Error(`Voice preview failed: ${err.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const audioBase64 = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )?.inlineData?.data;

    if (!audioBase64) throw new Error("No audio data returned from Gemini");

    // ELITE: Save to permanent cache
    saveVoiceToCache(voiceName, audioBase64).catch(e => console.warn("Failed to cache voice", e));

    return playBase64Audio(audioBase64);
  } catch (error) {
    console.error("[LiveService] Preview error:", error);
    throw error;
  }
};

/**
 * Internal helper to play base64 PCM audio data
 */
async function playBase64Audio(audioBase64: string): Promise<void> {
  // Convert Base64 to Int16 PCM bytes
  const binary = window.atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  // The audio data returned by generateContent for AUDIO modality is raw PCM 24000Hz 16-bit
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    const val = int16[i];
    if (val !== undefined) {
      float32[i] = val / 32768.0;
    }
  }

  const buffer = audioCtx.createBuffer(1, float32.length, 24000);
  buffer.getChannelData(0).set(float32);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();

  return new Promise<void>((resolve) => {
    source.onended = () => {
      audioCtx.close();
      resolve();
    };
  });
}

export { LiveAudioService } from "./liveAudioService";
