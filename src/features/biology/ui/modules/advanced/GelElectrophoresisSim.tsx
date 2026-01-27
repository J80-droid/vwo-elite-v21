import { Activity, Info, Play, RotateCcw, Zap } from "lucide-react";
import React, { useState } from "react";

interface GelElectrophoresisSimProps {
  samples: { id: string; name: string; fragments: number[] }[];
}

export const GelElectrophoresisSim: React.FC<GelElectrophoresisSimProps> = ({
  samples,
}) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRun = () => {
    setRunning(true);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRunning(false);
          return 100;
        }
        return prev + 0.5;
      });
    }, 50);
  };

  const handleReset = () => {
    setProgress(0);
    setRunning(false);
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-950 p-6 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            Gel Elektroforese
          </h2>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1 italic">
            Fragment Scheiding (DNA Fingerprinting)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <RotateCcw size={16} className="text-slate-400" />
          </button>
          <button
            onClick={handleRun}
            disabled={running || progress === 100}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${running ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-emerald-500 border-emerald-400 text-black font-bold uppercase text-xs hover:scale-105"}`}
          >
            {running ? (
              <Activity size={16} className="animate-pulse" />
            ) : (
              <Play size={16} />
            )}
            {running ? "Bezig..." : "Start Run"}
          </button>
        </div>
      </div>

      {/* The Gel Body */}
      <div className="flex-1 bg-blue-900/10 border border-blue-500/20 rounded-xl p-8 relative flex gap-8">
        {/* Voltage HUD */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Zap
            size={12}
            className={
              running ? "text-yellow-400 animate-pulse" : "text-slate-600"
            }
          />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Voltage: {running ? "120V" : "0V"}
          </span>
        </div>

        {samples.map((sample, sIdx) => (
          <div key={sIdx} className="flex-1 flex flex-col items-center">
            <div className="w-full h-8 bg-blue-900/30 border border-white/10 rounded-t-md mb-4 flex items-center justify-center text-[9px] font-mono text-slate-400 uppercase font-black overflow-hidden truncate px-1">
              {sample.name}
            </div>
            <div className="flex-1 w-full bg-black/40 rounded-b-md relative overflow-hidden ring-1 ring-inset ring-white/5 shadow-inner">
              {/* The fragments (bands) */}
              {sample.fragments.map((size, fIdx) => {
                // Smaller fragments move faster
                const speedFactor = 1000 / size;
                const currentPos = Math.min(
                  100,
                  (progress * speedFactor) / 1.5,
                );
                return (
                  <div
                    key={fIdx}
                    className="absolute left-0 right-0 h-1 bg-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-300"
                    style={{ top: `${currentPos}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Ladle / Marker */}
        <div className="w-12 flex flex-col items-center border-l border-white/10 pl-4">
          <div className="h-8 mb-4 border-b border-white/10 w-full text-center text-[8px] font-black text-slate-600 uppercase pt-2">
            Ladder
          </div>
          <div className="flex-1 w-full bg-black/20 rounded-b-md relative opacity-30">
            {[100, 250, 500, 750, 1000].map((m) => (
              <div
                key={m}
                className="absolute left-0 right-0 h-[1px] bg-white/20"
                style={{ top: `${(progress * (1000 / m)) / 1.5}%` }}
              >
                <span className="absolute -left-6 top-0 text-[6px] font-mono text-slate-600 uppercase">
                  {m}bp
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white/5 border border-white/5 p-4 rounded-xl flex items-start gap-3">
        <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-400 leading-relaxed font-outfit">
          Kleine fragmenten bewegen sneller door de poriën van de agarose-gel
          onder invloed van een elektrisch veld. DNA is negatief geladen en
          beweegt dus richting de positieve pool (anode).
        </p>
      </div>
    </div>
  );
};
