import { AIConfig as UserAIConfig, Language } from "../../types";
import { LiveClient, LiveEvent } from "./liveClient";

export interface LiveSession {
  sendAudio: (data: Float32Array) => void;
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
  const audioCtx = new AudioContext({ sampleRate: 24000 }); // Gemini native rate

  const handleLiveEvent = (event: LiveEvent) => {
    if (event.type === "close" || event.type === "error") {
      if (event.type === "error") console.error(event.message);
      onClose();
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
      onTranscript(event.text, false); // false = AI (model)
    }
  };

  const client = new LiveClient(
    {
      apiKey,
      systemInstruction: systemInstructionOverride,
    },
    handleLiveEvent,
  );

  client.connect();

  return {
    sendAudio: (data: Float32Array) => {
      client.sendFloat32Audio(data);
    },
    close: () => {
      client.close();
      audioCtx.close();
    },
  };
};
