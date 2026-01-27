/**
 * Whisper Service
 * Real speech-to-text using OpenAI Whisper API
 * Part of the 750% Elite Intelligence Upgrade
 */

export interface WhisperConfig {
    apiKey: string;
    model?: "whisper-1";
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

/**
 * Transcribe audio using OpenAI Whisper API
 * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
 */
export async function transcribeAudio(
    audioData: Blob | File | ArrayBuffer,
    config: WhisperConfig,
): Promise<TranscriptionResult> {
    if (!config.apiKey) {
        throw new Error("OpenAI API key is required for Whisper transcription");
    }

    const formData = new FormData();

    // Convert ArrayBuffer to Blob if needed
    let audioBlob: Blob;
    if (audioData instanceof ArrayBuffer) {
        audioBlob = new Blob([audioData], { type: "audio/wav" });
    } else if (audioData instanceof File) {
        audioBlob = audioData;
    } else {
        audioBlob = audioData;
    }

    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", config.model || "whisper-1");

    if (config.language) {
        formData.append("language", config.language);
    }
    if (config.temperature !== undefined) {
        formData.append("temperature", String(config.temperature));
    }

    // Use verbose_json to get segments and duration
    formData.append("response_format", config.responseFormat || "verbose_json");

    const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: formData,
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

    const formData = new FormData();

    let audioBlob: Blob;
    if (audioData instanceof ArrayBuffer) {
        audioBlob = new Blob([audioData], { type: "audio/wav" });
    } else if (audioData instanceof File) {
        audioBlob = audioData;
    } else {
        audioBlob = audioData;
    }

    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", config.model || "whisper-1");
    formData.append("response_format", "verbose_json");

    const response = await fetch("https://api.openai.com/v1/audio/translations", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
        },
        body: formData,
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
 * Check if Whisper is configured (OpenAI API key present)
 */
export function isWhisperConfigured(apiKey?: string): boolean {
    return !!apiKey && apiKey.startsWith("sk-");
}

/**
 * Convert base64 audio data to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Handle data URL format
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
        return "audio/wav"; // Default
    }

    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    return mimeMatch?.[1] || "audio/wav";
}
