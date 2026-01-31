import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Atom,
  Eye,
  FlaskConical,
  RefreshCcw,
  Search,
  X as CloseIcon,
  Zap,
} from "lucide-react";
import React, { useMemo } from "react";

import { ChemicalFormatter } from "../chemistry";
import {
  EnvironmentType,
  ReactantDef,
} from "./data/ChemistryTypes";
import { REACTANTS } from "./data/ReactionData";
import { useReactionStore } from "./data/useReactionStore";

// Helper: Simple Fuzzy Match
const fuzzyMatch = (query: string, text: string) => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let i = 0,
    j = 0;
  while (i < q.length && j < t.length) {
    if (q[i] === t[j]) i++;
    j++;
  }
  return i === q.length;
};

// Helper: Get Mix Color (Robust & Elite)
const getMixColor = (c1: string, c2: string) => {
  const extractBaseColor = (cls: string) => {
    if (!cls) return "gray";
    const clean = cls.replace("bg-", "");
    return clean.split("/")[0]!.split("-")[0]!;
  };

  const color1 = extractBaseColor(c1);
  const color2 = extractBaseColor(c2);
  const fallback = "#4f46e5";
  return `linear-gradient(135deg, var(--color-${color1}-500, ${fallback}), var(--color-${color2}-500, ${fallback}))`;
};

export const ReactionLab: React.FC<{ mode?: "stage" | "controls" | "full" }> = ({
  mode = "full",
}) => {
  const { t } = useTranslations();
  const {
    selected,
    setSelected,
    result,
    setResult,
    environment,
    setEnvironment,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    reset,
    mix,
  } = useReactionStore();

  useVoiceCoachContext(
    "ChemistryLab",
    `Reactie Lab: ${selected.length} stoffen geselecteerd in ${environment} milieu.`,
    {
      activeModule: "reaction",
      selectedCount: selected.length,
      environment,
      resultType: result?.type,
    },
  );

  const handleSelect = (r: ReactantDef) => {
    if (selected.length < 2) {
      setSelected((prev: ReactantDef[]) => [...prev, r]);
      setResult(null);
    }
  };

  const removeSelect = (id: string) => {
    setSelected((prev: ReactantDef[]) => prev.filter((r) => r.id !== id));
    setResult(null);
  };

  const categories = ["all", "acid", "base", "salt", "metal", "oxide", "other"];

  const handleMix = () => {
    if (selected.length !== 2) return;
    setResult(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mix(t);
      });
    });
  };

  const filteredReactants = useMemo(() => {
    if (!search)
      return REACTANTS.filter(
        (r) => categoryFilter === "all" || r.category === categoryFilter,
      );

    return REACTANTS.filter((r) => {
      const matchesCat =
        categoryFilter === "all" || r.category === categoryFilter;
      if (!matchesCat) return false;

      const nameMatch = fuzzyMatch(search, r.name);
      const formulaMatch = r.formula
        .toLowerCase()
        .includes(search.toLowerCase());
      const tagMatch = r.tags?.some((t) =>
        t.toLowerCase().includes(search.toLowerCase()),
      );

      return nameMatch || formulaMatch || tagMatch;
    });
  }, [search, categoryFilter]);

  if (mode === "controls") {
    return (
      <div className="flex flex-row items-center gap-4">
        {/* Compact Search & Category Filter */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
          <div className="relative w-32">
            <Search className="absolute left-2.5 top-2 text-slate-500" size={12} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek..."
              className="w-full bg-transparent pl-8 pr-2 py-1 text-[10px] text-white outline-none"
            />
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex gap-0.5">
            {["all", "acid", "base", "salt"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${categoryFilter === cat ? 'bg-purple-500/20 text-purple-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Selected / Reagents Horizontal List */}
        <div className="flex-1 flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5 overflow-hidden">
          <div className="flex gap-1 overflow-x-auto no-scrollbar px-1 max-w-[400px]">
            {filteredReactants.slice(0, 12).map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                disabled={selected.some((s) => s.id === r.id) || selected.length >= 2}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold whitespace-nowrap transition-all ${selected.some((s) => s.id === r.id)
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                  : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20'
                  } disabled:opacity-30`}
              >
                {r.formula}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2 px-2">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Mix</span>
            <div className="flex -space-x-2">
              {[0, 1].map((i) => {
                const s = selected[i];
                return (
                  <div key={i} className={`w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[8px] font-bold ${s ? s.color : 'bg-black/40 border-dashed'}`}>
                    {s ? s.formula[0] : ''}
                  </div>
                );
              })}
            </div>
            {selected.length > 0 && (
              <button onClick={reset} className="p-1 hover:text-red-400 text-slate-600 transition-colors">
                <RefreshCcw size={10} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {(["neutral", "acid", "base"] as EnvironmentType[]).map(env => (
              <button
                key={env}
                onClick={() => setEnvironment(env)}
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${environment === env ? 'bg-white/10 text-white' : 'text-slate-600'}`}
              >
                {env[0]}
              </button>
            ))}
          </div>
          <button
            onClick={handleMix}
            disabled={selected.length !== 2}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${selected.length === 2 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-slate-600'}`}
          >
            <Zap size={14} className={selected.length === 2 ? "animate-pulse" : ""} />
            Mix
          </button>
        </div>
      </div>
    );
  }

  if (mode === "stage") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Visual Lab Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.01] pointer-events-none select-none">
          <FlaskConical size={400} />
        </div>

        {/* Selected Reagents Large Visualization */}
        {!result ? (
          <div className="flex items-center gap-12 animate-in fade-in zoom-in-95 duration-500">
            {[0, 1].map((i) => {
              const s = selected[i];
              return (
                <div key={i} className="flex flex-col items-center gap-4">
                  <div className={`w-32 h-44 border-2 border-white/10 rounded-3xl relative overflow-hidden bg-white/5 shadow-2xl backdrop-blur-sm group transition-all duration-500 ${s ? 'scale-105 border-white/20' : 'opacity-20'}`}>
                    {s && (
                      <div className={`absolute bottom-0 left-0 right-0 h-1/2 ${s.color} animate-pulse duration-[3s]`} />
                    )}
                    <div className="absolute top-6 left-0 right-0 text-center">
                      <div className="text-3xl font-black text-white font-mono">{s ? s.formula : '?'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{s ? s.name : 'Leeg'}</div>
                    </div>
                  </div>
                  {s && (
                    <button onClick={() => removeSelect(s.id)} className="text-[10px] font-black text-rose-500/60 hover:text-rose-400 uppercase tracking-widest transition-colors">
                      Verwijder
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Results Visualization */
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-obsidian-900/60 p-10 rounded-[3rem] border border-purple-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            {/* Dynamic Result Glow */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 ${result.resultColor || 'bg-purple-500'}`} />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                  {result.type}
                </span>
                <button onClick={() => setResult(null)} className="text-slate-500 hover:text-white transition-colors">
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-inner">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Reactievergelijking</span>
                  <div className="text-3xl md:text-5xl font-mono text-white font-black tracking-tighter">
                    <ChemicalFormatter formula={result.equation || result.products} />
                  </div>
                </div>

                <div className="px-4">
                  <span className="text-[10px] text-purple-500 uppercase font-black tracking-widest block mb-2">Waarneming</span>
                  <p className="text-xl text-slate-300 font-medium leading-relaxed italic">
                    "{result.observation}"
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // LEGACY FULL MODE
  return (
    <div className="h-full flex flex-col p-6 bg-obsidian-950 relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center text-slate-500 italic">
        Full mode rendering is deactivated. Please use mode="stage" and mode="controls".
      </div>
    </div>
  );
};
