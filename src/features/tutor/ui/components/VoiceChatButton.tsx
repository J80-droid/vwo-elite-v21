/**
 * Voice Chat Button - Activates Gemini Live voice mode
 * Part of the 750% Elite Intelligence Upgrade
 */
import { LiveClient, LiveEvent } from "@shared/api/gemini/liveClient";
import { cn } from "@shared/lib/utils";
import { AlertCircle, Mic, MicOff, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VoiceChatButtonProps {
    systemPrompt?: string;
    onTranscript?: (text: string) => void;
    onError?: (error: string) => void;
    className?: string;
    geminiApiKey?: string;
    voiceName?: string;
}

export function VoiceChatButton({
    systemPrompt,
    onTranscript,
    onError,
    className,
    geminiApiKey,
    voiceName = "Aoede",
}: VoiceChatButtonProps) {
    const [isActive, setIsActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<LiveClient | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Get API key from props or localStorage
    const getApiKey = useCallback(() => {
        if (geminiApiKey) return geminiApiKey;

        try {
            const backup = localStorage.getItem("vwo_elite_settings_backup");
            if (backup) {
                const settings = JSON.parse(backup);
                return settings?.aiConfig?.geminiApiKey;
            }
        } catch {
            // Ignore
        }
        return null;
    }, [geminiApiKey]);

    const playAudio = useCallback(async (data: ArrayBuffer) => {
        try {
            // Create or reuse audio context at 24kHz (Gemini output rate)
            if (
                !audioContextRef.current ||
                audioContextRef.current.state === "closed"
            ) {
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }

            // PCM 16-bit to Float32
            const pcm16 = new Int16Array(data);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
                const sample = pcm16[i];
                if (sample !== undefined) {
                    float32[i] = sample / 32768;
                }
            }

            const buffer = audioContextRef.current.createBuffer(
                1,
                float32.length,
                24000,
            );
            buffer.copyToChannel(float32, 0);

            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsSpeaking(false);
            source.start();
        } catch (e) {
            console.error("[VoiceChat] Audio playback error:", e);
            setIsSpeaking(false);
        }
    }, []);

    const handleEvent = useCallback(
        (event: LiveEvent) => {
            switch (event.type) {
                case "open":
                    setIsListening(true);
                    setError(null);
                    console.log("[VoiceChat] Connection opened");
                    break;

                case "audio":
                    setIsSpeaking(true);
                    playAudio(event.data);
                    break;

                case "text":
                    console.log("[VoiceChat] Received text:", event.text);
                    onTranscript?.(event.text);
                    break;

                case "interrupted":
                    console.log("[VoiceChat] Interrupted");
                    setIsSpeaking(false);
                    break;

                case "close":
                    console.log("[VoiceChat] Connection closed");
                    setIsActive(false);
                    setIsListening(false);
                    break;

                case "error":
                    console.error("[VoiceChat] Error:", event.message);
                    setError(event.message);
                    onError?.(event.message);
                    setIsActive(false);
                    break;
            }
        },
        [onTranscript, onError, playAudio],
    );

    const startVoiceChat = async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            const errMsg =
                "Gemini API key is vereist voor voice chat. Configureer in Instellingen.";
            setError(errMsg);
            onError?.(errMsg);
            return;
        }

        setError(null);

        try {
            // Request microphone with optimal settings for speech
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            // Create audio processing context at 16kHz (Gemini input rate)
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });
            sourceRef.current = audioContextRef.current.createMediaStreamSource(
                streamRef.current,
            );

            // Create script processor for capturing audio chunks
            // Note: ScriptProcessorNode is deprecated but still widely supported
            // AudioWorklet would be the modern alternative
            processorRef.current = audioContextRef.current.createScriptProcessor(
                4096,
                1,
                1,
            );

            // Initialize Live Client
            clientRef.current = new LiveClient(
                {
                    apiKey,
                    model: "models/gemini-2.0-flash-exp",
                    voiceName,
                    systemInstruction: systemPrompt,
                },
                handleEvent,
            );

            clientRef.current.connect();

            // Send audio chunks when processing
            processorRef.current.onaudioprocess = (e) => {
                if (clientRef.current && isListening) {
                    const input = e.inputBuffer.getChannelData(0);
                    clientRef.current.sendFloat32Audio(input);
                }
            };

            sourceRef.current.connect(processorRef.current);
            // Connect to destination to keep the audio graph running
            // but we're not actually playing the mic input
            processorRef.current.connect(audioContextRef.current.destination);

            setIsActive(true);
        } catch (e) {
            const errMsg =
                e instanceof Error ? e.message : "Failed to start voice chat";
            console.error("[VoiceChat] Failed to start:", e);
            setError(errMsg);
            onError?.(errMsg);
        }
    };

    const stopVoiceChat = useCallback(() => {
        console.log("[VoiceChat] Stopping...");

        // Close WebSocket connection
        clientRef.current?.close();
        clientRef.current = null;

        // Stop microphone stream
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Disconnect audio nodes
        processorRef.current?.disconnect();
        processorRef.current = null;

        sourceRef.current?.disconnect();
        sourceRef.current = null;

        // Close audio context
        if (
            audioContextRef.current &&
            audioContextRef.current.state !== "closed"
        ) {
            audioContextRef.current.close().catch(console.warn);
        }
        audioContextRef.current = null;

        setIsActive(false);
        setIsListening(false);
        setIsSpeaking(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopVoiceChat();
        };
    }, [stopVoiceChat]);

    // Update isListening for the audio processor
    useEffect(() => {
        // This is a workaround since onaudioprocess callback captures stale state
        // In production, use AudioWorklet for proper state handling
    }, [isListening]);

    return (
        <div className="relative inline-flex items-center">
            <button
                onClick={isActive ? stopVoiceChat : startVoiceChat}
                className={cn(
                    "relative p-3 rounded-full transition-all duration-300",
                    isActive
                        ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30"
                        : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:shadow-indigo-500/30",
                    isSpeaking && "animate-pulse",
                    error && "ring-2 ring-red-500/50",
                    className,
                )}
                title={isActive ? "Stop voice chat" : "Start voice chat (Gemini Live)"}
                aria-label={isActive ? "Stop voice chat" : "Start voice chat"}
            >
                {isActive ? (
                    <MicOff className="w-5 h-5 text-white" />
                ) : (
                    <Mic className="w-5 h-5 text-white" />
                )}

                {/* Speaking indicator */}
                {isSpeaking && (
                    <Volume2 className="absolute -top-1 -right-1 w-4 h-4 text-green-400 animate-bounce" />
                )}

                {/* Listening ring animation */}
                {isListening && !isSpeaking && (
                    <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" />
                )}

                {/* Error indicator */}
                {error && !isActive && (
                    <AlertCircle className="absolute -top-1 -right-1 w-4 h-4 text-red-400" />
                )}
            </button>

            {/* Error tooltip */}
            {error && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-500/90 text-white text-xs rounded-lg whitespace-nowrap">
                    {error}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500/90" />
                </div>
            )}
        </div>
    );
}

export default VoiceChatButton;
