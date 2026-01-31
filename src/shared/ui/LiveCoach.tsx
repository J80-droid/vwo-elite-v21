import { connectLiveSession, LiveAudioService } from "@shared/api/gemini";
import { useSettings } from "@shared/hooks/useSettings";
import { Language } from "@shared/types";
import { Mic } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

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

  const isMounted = useRef(true);
  const audioServiceRef = useRef<LiveAudioService | null>(null);

  const liveSessionRef = useRef<{
    sendAudio: (d: Float32Array) => void;
    sendPCM: (base64: string) => void;
    close: () => void;
  } | null>(null);

  const stopSession = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }

    if (audioServiceRef.current) {
      audioServiceRef.current.stop();
      audioServiceRef.current = null;
    }

    if (isMounted.current) {
      setIsActive(false);
      setStatus(t.ready);
    }
  }, [t.ready]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopSession();
    };
  }, [stopSession]);

  const startSession = async () => {
    if (isActive) return;

    try {
      setStatus(t.connecting);

      // 1. Initialize High-Performance Audio Service
      const audioService = new LiveAudioService((base64) => {
        if (liveSessionRef.current) {
          liveSessionRef.current.sendPCM(base64);
        }
      });
      audioServiceRef.current = audioService;

      // 2. Connect Gemini Session
      const session = await connectLiveSession(
        lang,
        (audioBuffer) => {
          if (audioServiceRef.current) {
            audioServiceRef.current.playAudioBuffer(audioBuffer);
          }
        },
        () => {
          if (isMounted.current) {
            setIsActive(false);
            setStatus(t.ended);
          }
        },
        onNavigate,
        systemInstruction
          ? systemInstruction +
          (viewContext
            ? `\nCURRENT APP CONTEXT: User was previously in ${viewContext}.`
            : "")
          : undefined,
        settings.aiConfig,
      );

      // Re-initialize session with proper audio relay
      // We need to handle the incoming audio from session correctly.
      // Since connectLiveSession currently decodes to AudioBuffer, 
      // let's update it to provide raw bytes if we want full optimization.

      liveSessionRef.current = session;

      await audioService.start();

      if (isMounted.current) {
        setIsActive(true);
        setStatus(t.listening);
      }
    } catch (e) {
      console.error(e);
      stopSession();
      if (isMounted.current) {
        setStatus(t.error || "Connection failed");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-obsidian-900 border border-obsidian-800 rounded-xl shadow-xl w-full">
      <div className="mb-6 relative">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isActive
            ? "border-electric shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-pulse"
            : "border-gray-700"
            }`}
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
          <Mic className="w-5 h-5" />
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
