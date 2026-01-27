import { BookOpen, Check, X } from "lucide-react";
import React from "react";

import {
  RELATIVITY_SCENARIOS,
  useRelativityEngine,
} from "./useRelativityEngine";

interface ScenarioLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScenarioLibraryModal: React.FC<ScenarioLibraryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const engine = useRelativityEngine();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">
              Scenario Bibliotheek
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Grid */}
        <div className="p-4 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {RELATIVITY_SCENARIOS.map((scenario) => {
            const isActive = engine.activeScenarioId === scenario.id;

            return (
              <button
                key={scenario.id}
                onClick={() => {
                  engine.loadScenario(scenario.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] btn-elite-neon ${
                  isActive
                    ? "btn-elite-neon-rose active"
                    : "btn-elite-neon-slate"
                }`}
                style={{ height: "auto", display: "block" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">
                    {scenario.name}
                  </h3>
                  {isActive && (
                    <div className="w-4 h-4 bg-rose-500/10 border border-rose-500/50 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-rose-400" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  {scenario.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] px-2 py-1 bg-slate-800 rounded-lg text-slate-300 font-mono">
                    {scenario.events.length} events
                  </span>
                  <span className="text-[9px] px-2 py-1 bg-slate-800 rounded-lg text-slate-300 font-mono">
                    {scenario.worldlines.length} worldlines
                  </span>
                  <span className="text-[9px] px-2 py-1 bg-rose-500/5 border border-rose-500/10 rounded-lg text-rose-400/80 font-mono">
                    β = {scenario.initialBeta}
                  </span>
                  <span className="text-[9px] px-2 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg text-amber-400/80 font-mono">
                    γ ≈{" "}
                    {(
                      1 /
                      Math.sqrt(1 - scenario.initialBeta * scenario.initialBeta)
                    ).toFixed(2)}
                  </span>
                </div>

                {/* Events Preview */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex gap-1.5">
                    {scenario.events.slice(0, 4).map((event, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: event.color }}
                        title={event.label}
                      >
                        {event.label.charAt(0)}
                      </div>
                    ))}
                    {scenario.events.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-slate-400">
                        +{scenario.events.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <p className="text-[10px] text-slate-500 text-center">
            Selecteer een scenario om events en worldlines automatisch te laden
          </p>
        </div>
      </div>
    </div>
  );
};
