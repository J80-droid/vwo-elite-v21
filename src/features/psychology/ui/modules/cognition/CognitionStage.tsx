import { useModuleState } from "@features/psychology/hooks/PsychologyLabContext";
import {
  CognitionState,
  defaultCognitionState,
} from "@features/psychology/types";
import { Play, RotateCcw, Zap } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export const CognitionStage: React.FC = () => {
  const [state, setState] = useModuleState<CognitionState>(
    "cognition",
    defaultCognitionState,
  );
  const [visualState, setVisualState] = useState<
    "wait" | "ready" | "click" | "result"
  >("wait");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTest = () => {
    setVisualState("ready");
    setReactionTime(null);
    setState((prev) => ({ ...prev, status: "playing" }));

    const delay = 1000 + Math.random() * 3000; // Random delay 1-4s

    timerRef.current = window.setTimeout(() => {
      setVisualState("click");
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (visualState === "ready") {
      // Too early
      clearTimeout(timerRef.current!);
      setVisualState("wait");
      alert("Te vroeg! Wacht op groen.");
      setState((prev) => ({ ...prev, status: "idle" }));
    } else if (visualState === "click") {
      const end = Date.now();
      const time = end - startTimeRef.current;
      setReactionTime(time);
      setVisualState("result");
      setState((prev) => ({
        ...prev,
        status: "complete",
        score: time,
        highScores: {
          ...prev.highScores,
          reaction: prev.highScores.reaction
            ? Math.min(prev.highScores.reaction, time)
            : time,
        },
      }));
    }
  };

  const reset = () => {
    setVisualState("wait");
    setState((prev) => ({ ...prev, status: "idle" }));
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!state.activeTest) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Zap size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold mb-2">
          Selecteer een Cognitieve Test
        </h2>
        <p>Kies een test uit het menu om te beginnen.</p>
      </div>
    );
  }

  if (state.activeTest !== "reaction") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <h2 className="text-xl font-bold mb-2">Binnenkort beschikbaar</h2>
        <p>Deze module is momenteel in ontwikkeling.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative select-none">
      {visualState === "wait" && (
        <div className="text-center space-y-6">
          <div className="w-64 h-64 rounded-full bg-white/5 border-4 border-white/10 flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Zap size={80} className="text-slate-600" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Reactiesnelheid Test
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Klik zodra het scherm groen wordt.
          </p>
          <button
            onClick={startTest}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 mx-auto"
          >
            <Play size={20} /> Start Test
          </button>
        </div>
      )}

      {visualState === "ready" && (
        <div
          onClick={handleClick}
          className="absolute inset-0 bg-red-500 flex items-center justify-center cursor-pointer transition-colors"
        >
          <h1 className="text-6xl font-black text-white drop-shadow-md">
            WACHT...
          </h1>
        </div>
      )}

      {visualState === "click" && (
        <div
          onClick={handleClick}
          className="absolute inset-0 bg-emerald-500 flex items-center justify-center cursor-pointer"
        >
          <h1 className="text-8xl font-black text-white drop-shadow-md">
            KLIK!
          </h1>
        </div>
      )}

      {visualState === "result" && (
        <div className="text-center space-y-6 animate-in zoom-in duration-300">
          <h2 className="text-2xl text-slate-400 font-bold">Jouw Tijd</h2>
          <div className="text-8xl font-black text-white font-mono">
            {reactionTime} ms
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={startTest}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              Probeer Opnieuw
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-transparent text-slate-500 hover:text-white transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} /> Terug
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
