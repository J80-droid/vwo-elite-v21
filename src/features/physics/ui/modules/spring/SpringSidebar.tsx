import { analyzeSnapshot } from "@shared/api/gemini/vision";
import { useTranslations } from "@shared/hooks/useTranslations";
import {
  Activity,
  Bot,
  Calculator,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Zap,
} from "lucide-react";
import React from "react";

import { useSpringEngine } from "./useSpringEngine";

export const SpringSidebar: React.FC = () => {
  const { state, setParam, reset } = useSpringEngine();
  const { t } = useTranslations();

  const handleAnalyze = async () => {
    const canvas = document.querySelector(
      "#physics-stage canvas",
    ) as HTMLCanvasElement;
    if (!canvas) return;
    setParam("isAnalyzing", true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1] || "";
      const prompt = `Analyseer deze massa-veer simulatie voor een VWO 5/6 student. 
            Focus op:
            1. De harmonische trilling (fase, amplitude, trillingstijd).
            2. De energie-uitwisseling (Ek en Ev).
            3. De resulterende krachtvector (Fres).
            Geef uitleg in het Nederlands.`;
      await analyzeSnapshot(base64, prompt, "nl");
    } catch (e) {
      console.error(e);
    } finally {
      setParam("isAnalyzing", false);
    }
  };

  return (
    <div className="flex flex-row items-center gap-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Visual Options */}
      <div className="flex items-center gap-2 pr-4 border-r border-white/10">
        <button
          onClick={() => setParam("showGraph", !state.showGraph)}
          className={`btn-elite-neon ${state.showGraph ? "active" : ""} !p-2`}
          title={t("physics.spring.graph")}
        >
          <Activity size={18} />
        </button>
        <button
          onClick={() => setParam("showEnergy", !state.showEnergy)}
          className={`btn-elite-neon btn-elite-neon-emerald ${state.showEnergy ? "active" : ""} !p-2`}
          title={t("physics.spring.energy")}
        >
          <Zap size={18} />
        </button>
        <button
          onClick={() => setParam("showFormulas", !state.showFormulas)}
          className={`btn-elite-neon btn-elite-neon-amber ${state.showFormulas ? "active" : ""} !p-2`}
          title={t("physics.spring.formulas")}
        >
          <Calculator size={18} />
        </button>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setParam("isPlaying", !state.isPlaying)}
          className={`btn-elite-neon !px-6 ${state.isPlaying ? "btn-elite-neon-rose active" : "btn-elite-neon-emerald"}`}
        >
          {state.isPlaying ? (
            <>
              <Square size={14} fill="currentColor" className="mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t("physics.spring.stop")}
              </span>
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" className="mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t("physics.spring.start")}
              </span>
            </>
          )}
        </button>
        <button
          onClick={reset}
          className="btn-elite-neon btn-elite-neon-blue !p-2"
          title={t("physics.spring.reset")}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* AI Analysis */}
      <button
        onClick={handleAnalyze}
        disabled={state.isAnalyzing}
        className={`btn-elite-neon btn-elite-neon-violet ml-4 ${state.isAnalyzing ? "active" : ""}`}
      >
        {state.isAnalyzing ? (
          <Sparkles size={14} className="animate-spin mr-2" />
        ) : (
          <Bot size={14} className="mr-2" />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {state.isAnalyzing
            ? t("physics.spring.analyzing")
            : t("physics.spring.analyze")}
        </span>
      </button>

      {/* Timer Status */}
      <div className="flex flex-col gap-1 pr-6 pl-4 border-l border-white/10 relative">
        <div className="absolute inset-0 bg-white/5 blur-md -z-10 rounded-lg"></div>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
          Sim Time
        </span>
        <span className="text-xl font-mono text-white leading-none tracking-tight shadow-glow">
          {state.time.toFixed(2)}
          <span className="text-xs text-slate-500 ml-1">s</span>
        </span>
      </div>
    </div>
  );
};
