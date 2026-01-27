/**
 * Gemini Live Client (Protocol Wrapper)
 * Handles the BidiStreaming API WebSocket protocol.
 * Agnostic to audio implementation (expects Base64 PCM input/output).
 */

export interface LiveConfig {
  apiKey: string;
  model?: string;
  voiceName?: string;
  systemInstruction?: string;
}

export type LiveEvent =
  | { type: "open" }
  | { type: "close" }
  | { type: "audio"; data: ArrayBuffer } // PCM 16/24kHz
  | { type: "text"; text: string }
  | { type: "interrupted" }
  | { type: "error"; message: string };

interface BidiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface BidiServerMessage {
  serverContent?: {
    modelTurn?: {
      parts: BidiPart[];
    };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
}

export class LiveClient {
  private ws: WebSocket | null = null;
  private config: LiveConfig;
  private onEvent: (event: LiveEvent) => void;

  constructor(config: LiveConfig, onEvent: (event: LiveEvent) => void) {
    this.config = config;
    this.onEvent = onEvent;
  }

  connect() {
    try {
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.onEvent({ type: "open" });
        this.sendSetupMessage();
      };

      this.ws.onmessage = async (event) => {
        await this.handleMessage(event.data);
      };

      this.ws.onerror = (e) => {
        console.error("[LiveClient] WebSocket Error:", e);
        this.onEvent({ type: "error", message: "WebSocket connection failed" });
      };

      this.ws.onclose = () => {
        this.onEvent({ type: "close" });
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      this.onEvent({ type: "error", message: msg });
    }
  }

  private sendSetupMessage() {
    if (!this.ws) return;

    const setupMsg = {
      setup: {
        model: this.config.model || "models/gemini-2.0-flash-exp",
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: this.config.voiceName || "Aoede",
              },
            },
          },
        },
        system_instruction: this.config.systemInstruction
          ? { parts: [{ text: this.config.systemInstruction }] }
          : undefined,
      },
    };

    this.ws.send(JSON.stringify(setupMsg));
  }

  /**
   * Send Realtime Input (Audio Chunk)
   * @param base64PCM Audio data in Base64 PCM format (16kHz Little Endian)
   */
  sendAudioChunk(base64PCM: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "audio/pcm",
            data: base64PCM,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(msg));
  }

  /**
   * Helper to convert Float32 (Web Audio) to PCM16 Base64 (Gemini WSS)
   */
  sendFloat32Audio(data: Float32Array) {
    const pcm16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      if (val !== undefined) {
        const s = Math.max(-1, Math.min(1, val));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
    }

    // Convert Int16Array to Base64 manually
    // Use a more efficient approach if possible, but loop is reliable for standard array
    let binary = "";
    const bytes = new Uint8Array(pcm16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      const b = bytes[i];
      if (b !== undefined) binary += String.fromCharCode(b);
    }

    this.sendAudioChunk(window.btoa(binary));
  }

  private async handleMessage(data: Blob | string) {
    try {
      let msg: BidiServerMessage;
      if (typeof data === "string") {
        msg = JSON.parse(data);
      } else {
        const text = await data.text();
        msg = JSON.parse(text);
      }

      this.processMessage(msg);
    } catch (e) {
      console.error("[LiveClient] Parse error:", e);
    }
  }

  private processMessage(msg: BidiServerMessage) {
    const content = msg.serverContent;
    if (!content) return;

    // 1. Audio Turn
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
          // Convert Base64 to ArrayBuffer
          const binary = window.atob(part.inlineData.data);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            const b = binary.charCodeAt(i);
            if (!isNaN(b)) bytes[i] = b;
          }
          this.onEvent({ type: "audio", data: bytes.buffer });
        }

        if (part.text) {
          this.onEvent({ type: "text", text: part.text });
        }
      }
    }

    // 2. Interruption
    if (content.interrupted) {
      this.onEvent({ type: "interrupted" });
    }

    // 3. Turn Complete
    if (content.turnComplete) {
      // ready for input
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
