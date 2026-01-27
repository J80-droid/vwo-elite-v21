import "mafs/core.css";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Coordinates, Mafs, Plot } from "mafs";
import { useState } from "react";

export const ConceptTuner = () => {
  // 1. Session State
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 20;
  const [isFinished, setIsFinished] = useState(false);

  // 2. Target Parameters (Randomized)
  const [targetParams, setTargetParams] = useState({ a: 2, b: 3, c: 1 });

  const generateNewChallenge = () => {
    if (currentQuestion >= totalQuestions) {
      setIsFinished(true);
      return;
    }

    const newA = Math.floor(Math.random() * 8) - 4 || 1; // -4 to 4, not zero
    const newB = Math.floor(Math.random() * 9) - 4; // -4 to 4
    const newC = Math.floor(Math.random() * 9) - 4; // -4 to 4
    setTargetParams({ a: newA, b: newB, c: newC });
    setCurrentQuestion((prev) => prev + 1);
  };

  const restartSession = () => {
    setCurrentQuestion(1);
    setIsFinished(false);
    generateNewChallenge(); // Just sets target, but we need to reset the counter too
    setParams({ a: 1, b: 0, c: 0 });
  };

  // 3. Player Parameters (Start at y = x^2)
  const [params, setParams] = useState({ a: 1, b: 0, c: 0 });

  // 4. Define functions
  const targetFn = (x: number) =>
    targetParams.a * Math.pow(x - targetParams.b, 2) + targetParams.c;
  const playerFn = (x: number) =>
    params.a * Math.pow(x - params.b, 2) + params.c;

  // Success check (Simple heuristic: parameters must be close)
  const isSuccess =
    Math.abs(params.a - targetParams.a) < 0.1 &&
    Math.abs(params.b - targetParams.b) < 0.1 &&
    Math.abs(params.c - targetParams.c) < 0.1;

  // Professional color palette for "Elite" look
  const COLORS = {
    target: "#f43f5e", // soft rose/rose-500
    player: "#3b82f6", // blue-500
    success: "#10b981", // emerald-500
    grid: "rgba(255, 255, 255, 0.03)",
    axis: "rgba(255, 255, 255, 0.1)",
  };

  if (isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-obsidian-950 p-8 text-center animate-in fade-in duration-1000">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <Sparkles size={40} className="text-emerald-500 animate-pulse" />
        </div>
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Sessie Voltooid
        </h2>
        <p className="text-slate-400 max-w-md mb-12 uppercase tracking-[0.2em] text-[10px] font-bold leading-loose">
          Gefeliciteerd! Je hebt 20 transformaties succesvol gematcht. Je
          intuïtie voor parabolen is nu significant scherper.
        </p>

        <div className="flex gap-4">
          <button
            onClick={restartSession}
            className="group relative overflow-hidden rounded-xl p-[1px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/50 to-teal-500/50" />
            <div className="relative px-8 py-4 bg-obsidian-950 rounded-[11px] flex items-center gap-3 group-hover:bg-emerald-950/20 transition-colors">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                Nieuwe Sessie
              </span>
            </div>
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 border border-white/10 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Terug naar Lab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white bg-obsidian-950 font-outfit selection:bg-blue-500/30">
      {/* Progress Bar (Elite Style) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          style={{
            width: `${((currentQuestion - 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* 1. Header & Visualization Stage (Mafs) */}
      <div className="flex-1 relative overflow-hidden flex flex-col pt-1">
        {/* Floating Instructions Overlay */}
        <div className="absolute top-10 left-6 z-10 max-w-sm p-5 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 pointer-events-none shadow-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <h2 className="text-xl font-black text-emerald-400 flex items-center gap-2 uppercase tracking-tighter">
              <Sparkles size={18} className="animate-pulse" /> Tuner
            </h2>
            <span className="text-[10px] font-black tabular-nums bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 text-slate-400">
              {currentQuestion} <span className="text-slate-600 px-1">/</span>{" "}
              {totalQuestions}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-relaxed">
            Manipuleer de parameters zodat jouw{" "}
            <span className="text-blue-400">blauwe</span> lijn de{" "}
            <span className="text-rose-500/70">gestippelde</span> doellijn dekt.
          </p>
        </div>

        {/* Success Feedback Overlay */}
        {isSuccess && (
          <div className="absolute top-10 right-6 z-20 flex flex-col gap-4 animate-in fade-in zoom-in duration-700 cubic-bezier(0.16, 1, 0.3, 1)">
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/40 rounded-3xl flex items-center gap-4 text-emerald-400 font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-2xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Check size={14} strokeWidth={3} />
              </div>
              Perfecte Match!
            </div>
            <button
              onClick={generateNewChallenge}
              className="group relative overflow-hidden rounded-2xl p-[1.5px] transition-all duration-300 hover:scale-[1.05] active:scale-95 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-100" />
              <div className="relative px-8 py-5 bg-obsidian-950 rounded-[14.5px] flex items-center justify-center gap-4 transition-colors group-hover:bg-emerald-950/40">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                  {currentQuestion === totalQuestions ? "Afronden" : "Volgende"}
                </span>
                <ArrowRight
                  size={18}
                  className="text-emerald-400 group-hover:translate-x-1.5 transition-transform"
                />
              </div>
            </button>
          </div>
        )}

        {/* Graph Wrapper with Elite Glow */}
        <div className="flex-1 w-full h-full relative group p-6">
          <div className="w-full h-full relative rounded-[40px] overflow-hidden border border-white/5 shadow-inner">
            <Mafs
              zoom={true}
              pan={true}
              height={600}
              width="auto"
              viewBox={{ x: [-10, 10], y: [-5, 15] }}
            >
              <Coordinates.Cartesian
                xAxis={{ labels: (n) => (n % 2 === 0 ? n.toString() : "") }}
                yAxis={{ labels: (n) => (n % 2 === 0 ? n.toString() : "") }}
              />

              <Plot.OfX
                y={targetFn}
                style="dashed"
                color={COLORS.target}
                opacity={0.3}
                weight={2}
              />

              <Plot.OfX
                y={playerFn}
                color={isSuccess ? COLORS.success : COLORS.player}
                weight={4}
              />
            </Mafs>

            {/* Elite "Alive" Background Glow */}
            <div className="absolute -inset-10 bg-white/[0.02] blur-[100px] opacity-30 pointer-events-none elite-alive-glow" />
          </div>
        </div>
      </div>

      {/* 2. Horizontal Controls Panel */}
      <div className="bg-black/40 backdrop-blur-[40px] border-t border-white/5 p-10 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />

        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-12 items-center relative z-10">
          {/* Formula Preview (Column 1-4) - Elite Glass Box */}
          <div className="col-span-4">
            <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[32px] flex flex-col items-center gap-3 shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black mb-2 relative z-10">
                Live Functie
              </div>
              <div className="font-outfit text-2xl select-none flex items-center gap-1.5 relative z-10 font-bold tabular-nums">
                <span className="text-slate-400">y = </span>
                <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                  {params.a}
                </span>
                <span className="text-slate-500">(x - </span>
                <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  {params.b}
                </span>
                <span className="text-slate-500">)² + </span>
                <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  {params.c}
                </span>
              </div>
            </div>
          </div>

          {/* Sliders (Column 5-12) */}
          <div className="col-span-8 grid grid-cols-3 gap-12">
            <ControlSlider
              label="Peak Depth (a)"
              value={params.a}
              onChange={(v: number) => setParams((p) => ({ ...p, a: v }))}
              min={-5}
              max={5}
              step={0.1}
              color="blue"
            />
            <ControlSlider
              label="Horizontal (b)"
              value={params.b}
              onChange={(v: number) => setParams((p) => ({ ...p, b: v }))}
              min={-5}
              max={5}
              step={0.1}
              color="amber"
            />
            <ControlSlider
              label="Vertical (c)"
              value={params.c}
              onChange={(v: number) => setParams((p) => ({ ...p, c: v }))}
              min={-5}
              max={5}
              step={0.1}
              color="emerald"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component

interface ControlSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  color: "emerald" | "amber" | "blue";
}

const ControlSlider: React.FC<ControlSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  color,
}) => {
  const colorClasses: Record<string, string> = {
    emerald: "accent-emerald-500",
    amber: "accent-amber-500",
    blue: "accent-blue-500",
  };

  return (
    <div className="space-y-5 group">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-300 transition-colors">
          {label}
        </span>
        <span
          className={`font-outfit text-sm font-bold text-white tabular-nums px-3 py-1 rounded-xl bg-white/5 border border-white/10 shadow-lg`}
        >
          {value.toFixed(1)}
        </span>
      </div>
      <div className="relative pt-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`
                        w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer 
                        ${colorClasses[color]}
                        hover:bg-white/10 transition-all
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(255,255,255,0.6)]
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-125
                    `}
        />
      </div>
    </div>
  );
};
