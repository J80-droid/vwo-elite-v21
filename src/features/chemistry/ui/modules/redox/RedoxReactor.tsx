import { useModuleState } from "@features/chemistry/hooks/ChemistryLabContext";
import ChemicalFormatter from "@features/chemistry/ui/ui/ChemicalFormatter";
import { calculateRedox, type RedoxCouple } from "@features/simulation";
import { BINAS_DATA } from "@shared/assets/data/BinasData";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import {
  ArrowRight,
  FlaskConical,
  Info,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import React from "react";

// Parse T48 data into RedoxCouple objects
const REDOX_COUPLES: RedoxCouple[] = BINAS_DATA.T48.rows.map((row) => ({
  id: `redox-${row[0]}`, // improved ID generation
  oxidator: row[0] || "Unknown",
  reductor: row[1] || "Unknown",
  potential: parseFloat((row[2] || "0").replace(",", ".")),
}));

export const RedoxControls: React.FC = () => {
  const [state, setState] = useModuleState("redox-reactor", {
    oxId: REDOX_COUPLES[1]!.id, // MnO4-
    redId: REDOX_COUPLES[18]!.id, // Fe2+
  });

  return (
    <div className="flex flex-row items-center gap-4">
      {/* Oxidator Selection */}
      <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
        <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest px-2">Oxidator</span>
        <select
          value={state.oxId}
          onChange={(e) => setState({ ...state, oxId: e.target.value })}
          className="bg-transparent text-[10px] text-white outline-none font-bold py-1 pr-4 max-w-[120px]"
        >
          {REDOX_COUPLES.map((c) => (
            <option key={c.id} value={c.id} className="bg-obsidian-950">
              {c.oxidator.split("+")[0]!.trim()} ({c.potential > 0 ? "+" : ""}{c.potential.toFixed(2)}V)
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-white/10 mx-1" />

      {/* Reductor Selection */}
      <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
        <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest px-2">Reductor</span>
        <select
          value={state.redId}
          onChange={(e) => setState({ ...state, redId: e.target.value })}
          className="bg-transparent text-[10px] text-white outline-none font-bold py-1 pr-4 max-w-[120px]"
        >
          {REDOX_COUPLES.map((c) => (
            <option key={c.id} value={c.id} className="bg-obsidian-950">
              {c.reductor.split("+")[0]!.trim()} ({c.potential > 0 ? "+" : ""}{c.potential.toFixed(2)}V)
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Analyse</span>
          <span className="text-[10px] font-black text-cyan-400 uppercase leading-tight">BINAS T48</span>
        </div>
      </div>
    </div>
  );
};

export const RedoxStage: React.FC = () => {
  const [state] = useModuleState("redox-reactor", {
    oxId: REDOX_COUPLES[1]!.id,
    redId: REDOX_COUPLES[18]!.id,
  });

  const ox =
    REDOX_COUPLES.find((c) => c.id === state.oxId) || REDOX_COUPLES[1]!;
  const red =
    REDOX_COUPLES.find((c) => c.id === state.redId) || REDOX_COUPLES[18]!;

  // ELITE CHECK: Voorkom identieke selectie
  const isSameCouple = ox.id === red.id;

  const calculation = calculateRedox(ox, red);
  const result = isSameCouple
    ? {
      ...calculation,
      canOccur: false,
      log: [
        "Je hebt dezelfde halfreactie gekozen voor zowel oxidator als reductor.",
        "Er kan geen potentiaalverschil ontstaan.",
        "ΔV = 0.00V",
      ],
      totalReaction: "Geen Reactie (Identieke Stoffen)",
    }
    : calculation;

  useVoiceCoachContext(
    "ChemistryLab",
    `Analyse van een redoxreactie tussen ${ox.oxidator.split("+")[0]!.trim()} en ${red.reductor.split("+")[0]!.trim()}. delta V is ${result.deltaV.toFixed(2)} Volt.`,
    {
      activeModule: "redox-reactor",
      deltaV: result.deltaV,
      canOccur: result.canOccur,
    },
  );

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in zoom-in-95 duration-500 overflow-visible relative">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <div className="mb-10 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono font-bold text-cyan-400">
            BINAS T48 SIMULATOR
          </span>
          <div className="h-px w-12 bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-white to-white bg-clip-text text-transparent tracking-tight mb-2">
          Redox Reactor
        </h1>
        <p className="text-slate-500 max-w-xl leading-relaxed">
          Selecteer een halfreactie links (oxidator) en rechts (reductor). De
          reactor berekent de balans en controleert de spontaniteit (ΔV).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 space-y-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.05),transparent_70%)]" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col items-center gap-4 group/box">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center relative shadow-2xl transition-transform group-hover/box:scale-110 duration-500">
                <FlaskConical className="text-cyan-400 opacity-60" size={32} />
                <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-hover/box:opacity-100 transition-opacity" />
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1">
                  Oxidator
                </div>
                <div className="text-sm font-bold text-white">
                  <ChemicalFormatter
                    formula={ox.oxidator.split("+")[0]!.trim()}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div
                className={`px-6 py-2 rounded-full border text-[13px] font-bold transition-all duration-500 ${result.canOccur
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]"
                  }`}
              >
                {result.canOccur ? "REACTIE!" : "GEEN REACTIE"}
              </div>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="text-[11px] font-mono text-slate-500">
                ΔV = {result.deltaV.toFixed(2)}V
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 group/box">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-center relative shadow-2xl transition-transform group-hover/box:scale-110 duration-500">
                <FlaskConical
                  className="text-purple-400 opacity-60"
                  size={32}
                />
                <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-hover/box:opacity-100 transition-opacity" />
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1">
                  Reductor
                </div>
                <div className="text-sm font-bold text-white">
                  <ChemicalFormatter
                    formula={red.reductor.split("+")[0]!.trim()}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Info size={14} className="text-cyan-500/50" />
              <span>Stappenplan analyse</span>
            </div>
            <div className="space-y-2">
              {result.log.map((line: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 transition-opacity duration-500"
                  style={{ opacity: 0.1 * (i + 1) + 0.5 }}
                >
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[11px] leading-relaxed text-slate-500 font-mono tracking-tight">
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resultaat Blok */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl h-full">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Totaalvergelijking
            </h3>

            {result.canOccur ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-4">
                  <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                    Gecombineerde Halfreacties
                  </div>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex items-center gap-4 group/step">
                      <span className="text-cyan-500/80 font-bold opacity-40 group-hover/step:opacity-100 transition-opacity">
                        OX
                      </span>
                      <div className="flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            ({result.factors.ox}x)
                          </span>
                          <ChemicalFormatter formula={ox.oxidator} />
                        </div>
                        <div className="text-slate-600 opacity-20 w-8 flex justify-center">
                          <ArrowRight size={14} />
                        </div>
                        <ChemicalFormatter formula={ox.reductor} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group/step">
                      <span className="text-purple-500/80 font-bold opacity-40 group-hover/step:opacity-100 transition-opacity">
                        RED
                      </span>
                      <div className="flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            ({result.factors.red}x)
                          </span>
                          <ChemicalFormatter formula={red.reductor} />
                        </div>
                        <div className="text-slate-600 opacity-20 w-8 flex justify-center">
                          <ArrowRight size={14} />
                        </div>
                        <ChemicalFormatter
                          formula={red.oxidator.replace(/\+\s*\d*e[-⁻]/g, "")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                    Netto Ionvergelijking
                  </div>
                  <div className="p-6 rounded-2xl bg-cyan-400/5 border border-cyan-400/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] relative overflow-hidden group/final">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/final:opacity-30 transition-opacity">
                      <ShieldCheck className="text-cyan-400" size={40} />
                    </div>
                    <div className="text-lg md:text-xl font-bold text-white relative z-10 text-center lg:text-left">
                      <ChemicalFormatter formula={result.totalReaction} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-center opacity-40 grayscale">
                <ShieldAlert size={48} className="text-slate-600" />
                <div className="max-w-xs">
                  <div className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-1">
                    Reactie Onmogelijk
                  </div>
                  <p className="text-xs leading-relaxed">
                    De gekozen oxidator is niet sterk genoeg om de gekozen
                    reductor te oxideren. (ΔV &le; 0)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
