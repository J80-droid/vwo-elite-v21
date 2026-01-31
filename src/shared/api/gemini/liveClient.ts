/**
 * Gemini Live Client (Protocol Wrapper)
 * Handles the BidiStreaming API WebSocket protocol.
 * Agnostic to audio implementation (expects Base64 PCM input/output).
 */

const GEMINI_API_VERSION = "v1beta";
const GEMINI_SERVICE_ENDPOINT = "GenerativeService.BidiGenerateContent";

export interface LiveConfig {
  apiKey: string;
  model?: string;
  voiceName?: string;
  systemInstruction?: string;
}

export type LiveErrorReason =
  | "AUTH_FAILED"      // 403: Ongeldige API Key
  | "MODEL_NOT_FOUND"  // 404: Modelnaam onjuist
  | "UNSUPPORTED"     // 400: Model ondersteunt geen Bidi/Live
  | "QUOTA_EXCEEDED"   // 429: Rate limit bereikt
  | "NETWORK_ERROR"    // Verbindingsverlies
  | "UNKNOWN";

export type LiveEvent =
  | { type: "open" }
  | { type: "close" }
  | { type: "audio"; data: ArrayBuffer } // PCM 16/24kHz
  | { type: "text"; text: string }
  | { type: "interrupted" }
  | { type: "error"; reason: LiveErrorReason; message: string; fatal: boolean };

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
  private messageQueue: string[] = [];

  private reconnectAttempts = 0;
  private readonly maxReconnectDelay = 30000;
  private isExplicitlyClosed = false;

  constructor(config: LiveConfig, onEvent: (event: LiveEvent) => void) {
    this.config = config;
    this.onEvent = onEvent;
  }

  private send(msg: object) {
    const raw = JSON.stringify(msg);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(raw);
    } else {
      this.messageQueue.push(raw);
    }
  }

  private flushQueue() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg) this.ws.send(msg);
      }
    }
  }

  connect() {
    this.isExplicitlyClosed = false;
    try {
      const maskedKey = this.config.apiKey ? (this.config.apiKey.substring(0, 4) + "..." + this.config.apiKey.substring(this.config.apiKey.length - 4)) : "MISSING";
      // 🚀 ELITE: Parameterized API versioning for future-proofing (Gemini 2.0/2.5)
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${GEMINI_API_VERSION}.${GEMINI_SERVICE_ENDPOINT}?key=${this.config.apiKey}`;

      console.log(`[LiveClient] Connecting to Gemini WSS (Key: ${maskedKey})...`);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[LiveClient] WebSocket Connected (onopen)");
        this.reconnectAttempts = 0;
        this.onEvent({ type: "open" });
        this.sendSetupMessage();
        this.flushQueue(); // Flush everything queued during connect
      };

      this.ws.onmessage = async (event) => {
        // console.log("[LiveClient] Received raw message");
        await this.handleMessage(event.data);
      };

      this.ws.onerror = (e) => {
        console.error("[LiveClient] WebSocket Error:", e);
      };

      this.ws.onclose = (event) => {
        console.log(`[LiveClient] WebSocket Closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.onEvent({ type: "close" });
        if (!this.isExplicitlyClosed) {
          this.attemptReconnect(event);
        }
      };
    } catch {
      this.attemptReconnect();
    }
  }

  private attemptReconnect(event?: CloseEvent) {
    if (this.isExplicitlyClosed) return;

    // Detect fatal errors based on WebSocket close codes or our heuristic mapping
    const isFatal = event && (event.code === 4000 || event.code === 4003 || event.code === 4004);

    if (isFatal || this.reconnectAttempts >= 5) {
      const reason = this.mapCodeToReason(event?.code);
      this.onEvent({
        type: "error",
        reason,
        message: "Verbinding definitief mislukt. Controleer model-instellingen.",
        fatal: true,
      });
      this.close();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, this.maxReconnectDelay);
    console.warn(`[LiveClient] Reconnect attempt ${this.reconnectAttempts} in ${delay}ms...`);
    setTimeout(() => {
      if (!this.isExplicitlyClosed) this.connect();
    }, delay);
  }

  private mapCodeToReason(code?: number): LiveErrorReason {
    if (code === 4003) return "AUTH_FAILED";
    if (code === 4004) return "MODEL_NOT_FOUND";
    if (code === 4000) return "UNSUPPORTED";
    return "NETWORK_ERROR";
  }

  private sendSetupMessage() {
    const setupMsg = {
      setup: {
        // Ensure model has 'models/' prefix
        model: this.config.model?.startsWith("models/") ? this.config.model : `models/${this.config.model || "gemini-2.0-flash-exp"}`,
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

    this.send(setupMsg);
  }

  /**
   * Send Realtime Input (Audio Chunk)
   * @param base64PCM Audio data in Base64 PCM format (16kHz Little Endian)
   */
  sendAudioChunk(base64PCM: string) {
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

    this.send(msg);
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

    const bytes = new Uint8Array(pcm16.buffer);
    // 🛡️ SAFES: Loop conversion to prevent stack overflow on large buffers
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      const b = bytes[i];
      if (b !== undefined) {
        binary += String.fromCharCode(b);
      }
    }
    this.sendAudioChunk(window.btoa(binary));
  }

  /**
   * Send Text Input (for triggering specific responses or metadata)
   */
  sendText(text: string) {
    const msg = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
        turn_complete: true,
      },
    };

    this.send(msg);
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
    this.isExplicitlyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
