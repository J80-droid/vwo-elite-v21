import { GraduationCap, History } from "lucide-react";
import React from "react";

import { useSimulatorState } from "./useSimulatorState";

export const SimulatorResults: React.FC = () => {
  const { data } = useSimulatorState();

  if (!data.aiResult && data.simState !== "results") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2 opacity-30">
        <History size={32} />
        <span className="text-[10px] uppercase font-bold tracking-widest">
          No Recent Session
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.aiResult && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">
              CUMULATIVE SCORE
            </div>
            <div className="text-4xl font-black text-white">
              {data.aiResult.score}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-slate-500">
              FEEDBACK & ANALYSIS
            </div>
            <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 italic">
              "{data.aiResult.feedback}"
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-slate-500">
              TOPICS IDENTIFIED
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.aiResult.topics.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-slate-400 capitalize"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <button className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
        <GraduationCap size={14} />
        View Full Breakdown
      </button>
    </div>
  );
};
