/**
 * Text-to-Speech (TTS) Service
 * Synthesizes high-quality speech from text using OpenAI TTS
 * Part of the 1250% Elite Intelligence Upgrade
 */

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export interface TTSConfig {
    apiKey?: string;
    elevenLabsApiKey?: string;
    provider?: "openai" | "elevenlabs";
    model?: string;
    voice?: string;
    speed?: number; // 0.25 to 4.0
}

/**
 * Convert text to speech (returns an ArrayBuffer)
 */
export async function synthesizeSpeech(
    text: string,
    config: TTSConfig
): Promise<ArrayBuffer> {
    const provider = config.provider || (config.elevenLabsApiKey ? "elevenlabs" : "openai");

    if (provider === "elevenlabs") {
        if (!config.elevenLabsApiKey) {
            throw new Error("ElevenLabs API key is required for synthesis");
        }

        const voiceId = config.voice || "pNInz6obpgmqS81G48uW"; // Rachel (Default)
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": config.elevenLabsApiKey,
            },
            body: JSON.stringify({
                text,
                model_id: config.model || "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail?.status || "ElevenLabs synthesis failed");
        }

        return await response.arrayBuffer();
    }

    // Fallback to OpenAI
    if (!config.apiKey) {
        throw new Error("OpenAI API key is required for TTS synthesis");
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model || "tts-1",
            input: text,
            voice: config.voice || "nova",
            speed: config.speed || 1.0,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Speech synthesis failed");
    }

    return await response.arrayBuffer();
}

/**
 * Play speech directly in the browser
 */
export async function playSpeech(
    text: string,
    config: TTSConfig
): Promise<void> {
    const audioData = await synthesizeSpeech(text, config);
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();

    const buffer = await audioContext.decodeAudioData(audioData);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

/**
 * Check if TTS is configured
 */
export function isTTSConfigured(config: Partial<TTSConfig>): boolean {
    return !!(config.apiKey || config.elevenLabsApiKey);
}
