/**
 * Whisper Service
 * Real speech-to-text using OpenAI Whisper API
 * Part of the 750% Elite Intelligence Upgrade
 */

export interface WhisperConfig {
    apiKey?: string;
    deepgramApiKey?: string;
    provider?: "openai" | "deepgram";
    model?: string;
    language?: string;
    temperature?: number;
    responseFormat?: "json" | "verbose_json" | "text" | "srt" | "vtt";
}

export interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
}

export interface TranscriptionResult {
    text: string;
    language: string;
    duration: number;
    segments?: TranscriptionSegment[];
}

interface DeepgramSentence {
    text: string;
}

interface DeepgramParagraph {
    start: number;
    end: number;
    sentences?: DeepgramSentence[];
}

interface DeepgramAlternative {
    transcript: string;
    paragraphs?: {
        transcript?: DeepgramParagraph[];
    };
}

interface DeepgramChannel {
    alternatives: DeepgramAlternative[];
}

interface DeepgramResponse {
    metadata?: {
        duration: number;
    };
    results?: {
        channels: DeepgramChannel[];
    };
}

/**
 * Transcribe audio using AI providers (OpenAI Whisper or Deepgram)
 * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
 */
export async function transcribeAudio(
    audioData: Blob | File | ArrayBuffer,
    config: WhisperConfig,
): Promise<TranscriptionResult> {
    const provider = config.provider || (config.deepgramApiKey ? "deepgram" : "openai");

    // Convert to Blob
    let audioBlob: Blob;
    if (audioData instanceof ArrayBuffer) {
        audioBlob = new Blob([audioData], { type: "audio/wav" });
    } else {
        audioBlob = audioData as Blob;
    }

    if (provider === "deepgram") {
        if (!config.deepgramApiKey) {
            throw new Error("Deepgram API key is required for transcription");
        }

        const lang = config.language || "nl";
        const model = config.model || "nova-2";

        const response = await fetch(`https://api.deepgram.com/v1/listen?model=${model}&language=${lang}&smart_format=true`, {
            method: "POST",
            headers: {
                "Authorization": `Token ${config.deepgramApiKey}`,
                "Content-Type": audioBlob.type || "audio/wav",
            },
            body: audioBlob,
            signal: AbortSignal.timeout(60000)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.err_msg || "Deepgram transcription failed");
        }

        const data = (await response.json()) as DeepgramResponse;
        const alt = data.results?.channels[0]?.alternatives[0];

        return {
            text: alt?.transcript || "",
            language: lang,
            duration: data.metadata?.duration || 0,
            segments: alt?.paragraphs?.transcript?.map((p) => ({
                start: p.start,
                end: p.end,
                text: p.sentences?.map((s) => s.text).join(" ") || ""
            })) || [],
        };
    }
    // ...

    // Default: OpenAI Whisper
    if (!config.apiKey) {
        throw new Error("OpenAI API key is required for Whisper transcription");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", config.model || "whisper-1");

    if (config.language) {
        formData.append("language", config.language);
    }
    if (config.temperature !== undefined) {
        formData.append("temperature", String(config.temperature));
    }

    formData.append("response_format", config.responseFormat || "verbose_json");

    const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: formData,
            signal: AbortSignal.timeout(60000)
        },
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
            errorData.error?.message || `Whisper API error: ${response.status}`;
        throw new Error(errorMessage);
    }

    const result = await response.json();

    return {
        text: result.text || "",
        language: result.language || config.language || "unknown",
        duration: result.duration || 0,
        segments: result.segments?.map(
            (s: { start: number; end: number; text: string }) => ({
                start: s.start,
                end: s.end,
                text: s.text,
            }),
        ),
    };
}

/**
 * Translate audio to English using Whisper
 */
export async function translateAudio(
    audioData: Blob | File | ArrayBuffer,
    config: Omit<WhisperConfig, "language">,
): Promise<TranscriptionResult> {
    if (!config.apiKey) {
        throw new Error("OpenAI API key is required for Whisper translation");
    }

    let audioBlob: Blob;
    if (audioData instanceof ArrayBuffer) {
        audioBlob = new Blob([audioData], { type: "audio/wav" });
    } else {
        audioBlob = audioData as Blob;
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", config.model || "whisper-1");
    formData.append("response_format", "verbose_json");

    const response = await fetch("https://api.openai.com/v1/audio/translations", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
        },
        body: formData,
        signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Whisper translation failed");
    }

    const result = await response.json();

    return {
        text: result.text || "",
        language: "en", // Translation always outputs English
        duration: result.duration || 0,
        segments: result.segments?.map(
            (s: { start: number; end: number; text: string }) => ({
                start: s.start,
                end: s.end,
                text: s.text,
            }),
        ),
    };
}

/**
 * Check if Whisper is configured
 */
export function isWhisperConfigured(config: Partial<WhisperConfig>): boolean {
    return !!(config.apiKey || config.deepgramApiKey);
}

/**
 * Convert base64 audio data to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const pureBase64 = base64.includes(",") ? base64.split(",")[1]! : base64;
    const binaryString = window.atob(pureBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Get MIME type from base64 data URL
 */
export function getMimeType(dataUrl: string): string {
    if (!dataUrl.includes(";base64,")) {
        return "audio/wav";
    }
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    return mimeMatch?.[1] || "audio/wav";
}
