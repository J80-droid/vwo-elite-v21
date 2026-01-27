/* eslint-disable @typescript-eslint/no-explicit-any */
import { useModuleState } from "@features/psychology/hooks/PsychologyLabContext";
import {
  CognitionState,
  defaultCognitionState,
} from "@features/psychology/types";
import { Activity, Brain, Timer, Zap } from "lucide-react";
import React from "react";

export const CognitionSidebar: React.FC = () => {
  const [state, setState] = useModuleState<CognitionState>(
    "cognition",
    defaultCognitionState,
  );

  const tests = [
    {
      id: "reaction",
      label: "Reactiesnelheid",
      icon: Zap,
      desc: "Meet je reflexen.",
    },
    {
      id: "memory",
      label: "Werkgeheugen",
      icon: Brain,
      desc: "Cijferreeks test.",
    },
    {
      id: "stroop",
      label: "Stroop Effect",
      icon: Activity,
      desc: "Interferentie controle.",
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
          <Activity size={14} className="text-amber-400" /> Test Selectie
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {tests.map((t) => (
            <button
              key={t.id}
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  activeTest: t.id as any,
                  status: "idle",
                }))
              }
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                state.activeTest === t.id
                  ? "bg-amber-500/20 border-amber-500/50 text-white shadow-lg shadow-amber-500/10"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${state.activeTest === t.id ? "bg-amber-500 text-white" : "bg-black/40 text-slate-500"}`}
              >
                <t.icon size={16} />
              </div>
              <div>
                <div className="text-xs font-bold">{t.label}</div>
                <div className="text-[10px] opacity-70">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
          <Timer size={14} className="text-emerald-400" /> Beste scores
        </h3>
        {Object.entries(state.highScores).length === 0 ? (
          <p className="text-xs text-slate-600 italic">
            Nog geen tests voltooid.
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(state.highScores).map(([key, score]) => (
              <div
                key={key}
                className="flex justify-between items-center text-xs"
              >
                <span className="text-slate-400 capitalize">{key}</span>
                <span className="font-mono font-bold text-white">
                  {score}ms
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
