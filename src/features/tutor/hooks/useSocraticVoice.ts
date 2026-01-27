import { aiGenerate } from "@shared/api/aiCascadeService";
import { connectLiveSession } from "@shared/api/geminiService";
import { saveCoachingSession } from "@shared/api/sqliteService";
import { useVoiceCoach } from "@shared/lib/contexts/VoiceCoachContext";
import { Language } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SOCRATIC_SYSTEM_PROMPT } from "../data/systemPrompts";

// Fix window type for WebKitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export type CoachState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking";

interface UseSocraticVoiceProps {
  lang?: Language;
  onTranscript?: (text: string, isUser: boolean) => void;
}

export function useSocraticVoice({
  lang = "nl",
  onTranscript,
}: UseSocraticVoiceProps = {}) {
  const { context, isActive, setIsActive } = useVoiceCoach();
  const [state, setState] = useState<CoachState>("idle");

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const liveSessionRef = useRef<{
    sendAudio: (d: Float32Array) => void;
    close: () => void;
  } | null>(null);
  const nextStartTimeRef = useRef(0);
  const transcriptRef = useRef("");
  const sessionStartTimeRef = useRef(0);

  // Helper to build prompt - Memoized to be safe, though not strictly necessary if used inside callback
  const buildSystemPrompt = useCallback(() => {
    // PRIORITIZE THE SOCRATIC SYSTEM PROMPT
    let basePrompt = SOCRATIC_SYSTEM_PROMPT;

    // Add specific language instruction if needed
    basePrompt += `\n\nSpreek ${lang === "nl" ? "Nederlands" : "Engels"}.`;

    if (context?.systemPrompt) {
      // Merge View-Specific Context if available
      return `${basePrompt}\n\n[SPECIFIC CONTEXT]:\n${context.systemPrompt}\n\n${context.contextData
        ? `[DATA]: ${JSON.stringify(context.contextData)}`
        : ""
        }`;
    }

    return basePrompt;
  }, [lang, context]);

  const stopSession = useCallback(async () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.port.onmessage = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // SAVE SESSION LOGIC
    const transcript = transcriptRef.current;
    if (transcript.length > 50) {
      const subject = context?.viewName || "Socratic Session";
      const duration = (Date.now() - sessionStartTimeRef.current) / 1000;

      let summary = "";
      try {
        summary = await aiGenerate(
          `Summarize the following coaching session for a student. Extract 3 key bullet points useful for exam preparation. Transcript: ${transcript}`,
          { systemPrompt: "You are a helpful education assistant." },
        );
      } catch (e) {
        console.error("Summary failed", e);
      }

      await saveCoachingSession(subject, transcript, duration, summary);
    }

    setIsActive(false);
    setState("idle");
    nextStartTimeRef.current = 0;
    transcriptRef.current = ""; // Reset
  }, [context?.viewName, setIsActive]); // Added context.viewName and setIsActive dep

  const startSession = useCallback(async () => {
    try {
      setState("connecting");

      // Setup Output Context
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      // Setup Input with Noise Cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);

      await inputCtx.audioWorklet.addModule("/audio-processor.js");
      const processor = new AudioWorkletNode(inputCtx, "audio-processor");
      processorRef.current = processor;

      // Connect to Gemini Live
      const session = await connectLiveSession(
        lang,
        (audioBuffer) => {
          if (!audioContextRef.current) return;
          setState("speaking");

          const ctx = audioContextRef.current;
          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(ctx.destination);

          const currentTime = ctx.currentTime;
          const startTime = Math.max(currentTime, nextStartTimeRef.current);

          src.start(startTime);

          src.onended = () => {
            setState("listening");
          };

          nextStartTimeRef.current = startTime + audioBuffer.duration;
        },
        () => {
          stopSession(); // Clean close on remote close
        },
        undefined, // _onNavigate
        buildSystemPrompt(), // systemInstructionOverride
        undefined, // aiConfig
        (text, isUser) => {
          // Append to transcript ref
          const prefix = isUser ? "User: " : "Coach: ";
          transcriptRef.current += `\n${prefix}${text}`;

          if (onTranscript) onTranscript(text, isUser);
        },
      );

      liveSessionRef.current = session;
      sessionStartTimeRef.current = Date.now();

      // Send Input Data from Worklet
      processor.port.onmessage = (e) => {
        const audioData = e.data as Float32Array;

        // Calculate RMS (Root Mean Square) for volume
        if (!audioData) return;
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
          const sample = audioData[i];
          if (sample !== undefined) {
            sum += sample * sample;
          }
        }
        const rms = Math.sqrt(sum / audioData.length);

        // Noise Gate
        if (rms > 0.01) {
          session.sendAudio(audioData);
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      setIsActive(true);
      setState("listening");
    } catch (e: unknown) {
      console.error("[SocraticVoice] Error:", e);
      setState("idle");
      setIsActive(false);
      toast.error(
        `Could not start voice session: ${(e as Error).message || "Unknown error"}`,
      );
    }
  }, [lang, buildSystemPrompt, setIsActive, onTranscript, stopSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        // If the component unmounts or deps change, we clean up.
        // Since stopSession is now stable-ish (depends on context), it should be fine.
        // However, we can't easily call 'stopSession' if it's not in the dependency array?
        // But we CAN call it if we add it.
        // NOTE: We do NOT want to stop session just because context changed?
        // But startSession depends on context (via buildSystemPrompt).
        // So if context changes, prompt changes -> we might want to restart?
        // For now, let's accept that context change = restart session.
        stopSession();
      }
    };
  }, [isActive, stopSession]);

  return {
    state,
    isActive,
    getTranscript: () => transcriptRef.current,
    startSession,
    stopSession,
    context,
  };
}
