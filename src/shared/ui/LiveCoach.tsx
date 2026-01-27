import { connectLiveSession } from "@shared/api/geminiService";
import { useSettings } from "@shared/hooks/useSettings";
import { Language } from "@shared/types";
import React, { useEffect, useRef, useState } from "react";

interface LiveCoachProps {
  lang: Language;
  t: Record<string, string>;
  systemInstruction?: string;
  viewContext?: string;
  onNavigate?: (view: string) => void;
}

export const LiveCoach: React.FC<LiveCoachProps> = ({
  lang,
  t,
  systemInstruction,
  viewContext,
  onNavigate,
}) => {
  const { settings } = useSettings();
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState(t.ready);

  // Initialize status with translation - no effect needed since t.ready doesn't change mid-session
  // The status is already set from props in useState initializer

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | AudioWorkletNode | null>(
    null,
  );
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveSessionRef = useRef<{
    sendAudio: (d: Float32Array) => void;
    close: () => void;
  } | null>(null);
  const nextStartTimeRef = useRef(0);

  const startSession = async () => {
    try {
      setStatus(t.connecting);

      // Setup Output Context
      const outputCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )({ sampleRate: 24000 });
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

      const inputCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);

      await inputCtx.audioWorklet.addModule("/audio-processor.js");
      const processor = new AudioWorkletNode(inputCtx, "audio-processor");

      sourceRef.current = source;
      processorRef.current = processor;

      // Connect to Gemini Live
      const session = await connectLiveSession(
        lang,
        (audioBuffer) => {
          // Play audio
          if (!audioContextRef.current) return;

          const ctx = audioContextRef.current;
          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(ctx.destination);

          const currentTime = ctx.currentTime;
          // Ensure we schedule after the current playhead or next scheduled time
          const startTime = Math.max(currentTime, nextStartTimeRef.current);

          src.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
        },
        () => {
          setIsActive(false);
          setStatus(t.ended);
        },
        onNavigate, // Pass the navigation callback
        systemInstruction // Pass the override
          ? systemInstruction +
              (viewContext
                ? `\nCURRENT APP CONTEXT: User was previously in ${viewContext}.`
                : "")
          : undefined,
        settings.aiConfig,
      );

      liveSessionRef.current = session;

      // Send Input Data from Worklet
      processor.port.onmessage = (e) => {
        // Received audio from worklet
        session.sendAudio(e.data);
      };

      source.connect(processor);
      processor.connect(inputCtx.destination); // Keep destination connection to keep graph alive, though we mute it? No, if we want loopback? No we don't.
      // But Worklet needs output connected? Not strictly necessary for input-only if getting data via port.
      // But usually good to connect to destination or a dummy node to ensure 'process' is called.
      // Actually, AudioWorkletProcessor.process is called if there are inputs connected. Connecting output ensures the graph is pulled.
      processor.connect(inputCtx.destination);

      setIsActive(true);
      setStatus(t.listening);
    } catch (e) {
      console.error(e);
      setStatus(t.error);
    }
  };

  const stopSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (processorRef.current) {
      if (processorRef.current instanceof AudioWorkletNode) {
        processorRef.current.port.onmessage = null;
      }
      processorRef.current.disconnect();
    }
    setIsActive(false);
    setStatus(t.ready);
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    return () => stopSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-obsidian-900 border border-obsidian-800 rounded-xl shadow-xl w-full">
      <div className="mb-6 relative">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isActive ? "border-electric shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-pulse" : "border-gray-700"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-white ${isActive ? "text-electric" : "text-gray-500"}`}
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2 text-slate-100">
        Socratic Voice Coach
      </h2>
      <p className="text-sm text-slate-400 mb-6">{status}</p>

      {!isActive ? (
        <button
          onClick={startSession}
          className="px-6 py-3 bg-electric hover:bg-electric-glow text-white font-medium rounded-full transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h.01" />
            <path d="M2 12h.01" />
            <path d="M22 12h.01" />
            <path d="M17 20.662V19a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1.662" />
          </svg>
          {t.start}
        </button>
      ) : (
        <button
          onClick={stopSession}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-full transition-colors"
        >
          {t.end}
        </button>
      )}
    </div>
  );
};
