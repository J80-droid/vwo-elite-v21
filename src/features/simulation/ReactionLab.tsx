import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Atom,
  Eye,
  FlaskConical,
  Plus,
  RefreshCcw,
  Search,
  X as CloseIcon,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { ChemicalFormatter } from "../chemistry";
import {
  EnvironmentType,
  ReactantDef,
  ReactionDef,
} from "./data/ChemistryTypes";
import { analyzeReaction, REACTANTS } from "./data/ReactionData";

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
  // Helper om de basiskleur te extraheren (bijv. 'bg-purple-600/80' -> 'purple')
  const extractBaseColor = (cls: string) => {
    if (!cls) return "gray";
    const clean = cls.replace("bg-", "");
    // Split op '/' (opacity) en '-' (tint) en pak het eerste deel
    return clean.split("/")[0]!.split("-")[0]!;
  };

  const color1 = extractBaseColor(c1);
  const color2 = extractBaseColor(c2);

  // Fallback voor veiligheid
  const fallback = "#4f46e5";

  // Genereer een veilige gradient string (var prefix --color- voor Tailwind v4)
  return `linear-gradient(135deg, var(--color-${color1}-500, ${fallback}), var(--color-${color2}-500, ${fallback}))`;
};

export const ReactionLab: React.FC = () => {
  const { t } = useTranslations();
  const [selected, setSelected] = useState<ReactantDef[]>([]);
  const [result, setResult] = useState<ReactionDef | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentType>("neutral");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

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

  // Category Color Themes (Neon Minimalist - 100% Elite Consistency)
  const CATEGORY_THEMES: Record<string, string> = {
    all: "border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-white/5",
    acid: "border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)] bg-rose-500/10",
    base: "border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] bg-cyan-500/10",
    salt: "border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-amber-500/10",
    metal:
      "border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] bg-purple-500/10",
    oxide:
      "border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)] bg-orange-500/10",
    other:
      "border-slate-500/50 text-slate-400 shadow-[0_0_15px_rgba(100,116,139,0.25)] bg-slate-500/10",
  };

  const reset = () => {
    setSelected([]);
    setResult(null);
  };

  const mix = () => {
    if (selected.length !== 2) return;

    // Stap 1: Reset (Visual Flush)
    setResult(null);

    // Stap 2: Gebruik requestAnimationFrame voor perfecte sync met de GPU
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Double RAF zorgt voor een gegarandeerde paint-frame ertussen

        // Engine Call
        const outcome = analyzeReaction(
          selected.map((r) => r.id),
          environment,
        );

        if (outcome) {
          setResult(outcome);
        } else {
          // Fallback: Physical Mix
          const r1 = selected[0]!;
          const r2 = selected[1]!;
          setResult({
            reactants: [r1.id, r2.id],
            products: t("chemistry.simulation.physical_mixture") || "Mengsel",
            observation:
              t("chemistry.simulation.no_reaction") ||
              "Geen waarneembare reactie.",
            type: "Menging",
            equation: `${r1.formula} + ${r2.formula} → (mix)`,
            visualMix: true,
            resultColor: "bg-white/5",
          });
        }
      });
    });
  };

  // Filter logic (Semantic & Fuzzy)
  const filteredReactants = useMemo(() => {
    if (!search)
      return REACTANTS.filter(
        (r) => categoryFilter === "all" || r.category === categoryFilter,
      );

    return REACTANTS.filter((r) => {
      const matchesCat =
        categoryFilter === "all" || r.category === categoryFilter;
      if (!matchesCat) return false;

      // Search Strategy: Name (Fuzzy) OR Formula (Direct) OR Tags (Includes)
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

  return (
    <div className="h-full flex flex-col p-6 bg-obsidian-950 relative overflow-hidden">
      {/* Elite Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <FlaskConical className="text-purple-400" />{" "}
              {t("chemistry.simulation.title")}
            </h2>
            <p className="text-slate-400 text-sm">
              {t("chemistry.simulation.description")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0">
          {/* Reagents Selection (Left - 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-obsidian-900/50 rounded-2xl border border-white/5 p-4">
            {/* Search Field */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-3 text-slate-500"
                size={16}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("chemistry.simulation.search_placeholder")}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/20">
              {categories.map((cat) => {
                const isSelected = categoryFilter === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`btn-elite-glass !px-4 !py-1.5 !rounded-lg border-transparent transition-all duration-300 ${isSelected
                      ? cat === "all"
                        ? "btn-elite-purple active"
                        : cat === "acid"
                          ? "btn-elite-rose active"
                          : cat === "base"
                            ? "btn-elite-cyan active"
                            : cat === "salt"
                              ? "btn-elite-amber active"
                              : cat === "metal"
                                ? "btn-elite-purple active"
                                : cat === "oxide"
                                  ? "btn-elite-rose active"
                                  : "btn-elite-emerald active"
                      : "bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"
                      }`}
                  >
                    {cat === "all"
                      ? t("chemistry.simulation.all", "Alles")
                      : t(`chemistry.simulation.category_${cat}`, cat)}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar mt-2">
              <div className="grid grid-cols-2 gap-3 content-start pb-4">
                {filteredReactants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    disabled={
                      selected.some((s) => s.id === r.id) ||
                      selected.length >= 2
                    }
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${selected.some((s) => s.id === r.id)
                      ? `${CATEGORY_THEMES[r.category]?.split(" ")[0]} bg-white/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]`
                      : "bg-black/40 border-white/10 hover:border-white/30 text-slate-300"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div
                      className={`absolute top-0 right-0 px-2 py-0.5 bg-white/5 rounded-bl-lg text-[0.6rem] uppercase tracking-widest font-black ${CATEGORY_THEMES[r.category]?.split(" ")[1] || "text-slate-500"}`}
                    >
                      {t(
                        `chemistry.simulation.category_${r.category}`,
                        r.category,
                      )}
                    </div>
                    <div className="font-bold mb-1 truncate pr-8 text-sm group-hover:text-white transition-colors">
                      {r.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 bg-black/40 w-fit px-2 py-1 rounded border border-white/5">
                      {r.formula}{" "}
                      <span className="opacity-40 italic">({r.state})</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mixing Area (Right - 7 Cols) */}
          <div className="lg:col-span-7 bg-black/20 rounded-2xl border border-white/5 p-8 flex flex-col items-center justify-start relative overflow-hidden">
            {/* Elite Milieu Selector */}
            <div className="absolute top-4 right-4 z-20 flex bg-obsidian-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm shadow-2xl gap-1">
              {(["neutral", "acid", "base"] as EnvironmentType[]).map((env) => {
                const theme =
                  env === "neutral"
                    ? "btn-elite-purple"
                    : env === "acid"
                      ? "btn-elite-rose"
                      : "btn-elite-cyan";
                return (
                  <button
                    key={env}
                    onClick={() => setEnvironment(env)}
                    className={`btn-elite-glass ${theme} !px-4 !py-1.5 !rounded-lg border-transparent ${environment === env ? "active" : ""}`}
                  >
                    {t(`chemistry.simulation.env_${env}`)}
                  </button>
                );
              })}
            </div>

            {/* Selected Reagents Visualization */}
            <div className="flex items-center gap-6 mb-12 mt-8">
              {[0, 1].map((i) => {
                const s = selected[i];
                return (
                  <div key={i} className="flex items-center gap-6">
                    {i > 0 && <Plus className="text-slate-600" size={24} />}

                    <div className="relative group">
                      {s ? (
                        <div className="w-32 h-40 border-2 border-white/20 rounded-2xl relative overflow-hidden bg-white/5 shadow-2xl flex flex-col justify-end">
                          <div
                            className={`absolute bottom-0 left-0 right-0 h-2/3 ${s.color} transition-all duration-500`}
                          />
                          <div className="absolute top-3 left-0 right-0 text-center">
                            <div className="text-2xl font-bold text-white font-mono">
                              {s.formula}
                            </div>
                            <div className="text-[0.7rem] text-slate-300 font-medium uppercase tracking-widest leading-tight px-1">
                              {s.name}
                            </div>
                          </div>
                          <button
                            onClick={() => removeSelect(s.id)}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-600 gap-2">
                          <FlaskConical className="opacity-20" size={32} />
                          <span className="text-[10px] uppercase tracking-tighter opacity-40">
                            {t("chemistry.simulation.empty_selection")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex gap-4 w-full max-w-md mb-8">
              <button
                onClick={reset}
                className="btn-elite-glass btn-elite-rose !p-4 !rounded-xl"
                title="Reset"
              >
                <RefreshCcw size={20} />
              </button>
              <button
                onClick={mix}
                disabled={selected.length !== 2}
                className={`btn-elite-glass btn-elite-purple flex-1 !py-4 !rounded-xl text-xs ${selected.length === 2 ? "active" : "opacity-40"}`}
              >
                <Zap
                  size={20}
                  className={selected.length === 2 ? "animate-pulse" : ""}
                />
                {t("chemistry.simulation.mix_button")}
              </button>
            </div>

            {/* Results Area */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={result.products}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full max-w-2xl bg-obsidian-900/80 p-6 rounded-2xl border border-purple-500/30 backdrop-blur-md shadow-2xl relative overflow-hidden"
                >
                  {/* Visual Mix/Product Color Indicator */}
                  {result.visualMix && selected.length === 2 ? (
                    <div
                      className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none"
                      style={{
                        background: getMixColor(
                          selected[0]!.color,
                          selected[1]!.color,
                        ),
                      }}
                    />
                  ) : result.resultColor ? (
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-30 pointer-events-none ${result.resultColor}`}
                    />
                  ) : null}

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="text-xs text-purple-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <FlaskConical size={14} />
                      {result.typeKey
                        ? t(
                          `chemistry.simulation.type_${result.typeKey}`,
                          result.type,
                        )
                        : result.type}
                    </div>
                    <button
                      onClick={() => setResult(null)}
                      className="text-slate-500 hover:text-white transition-colors p-1"
                      title="Close"
                    >
                      <CloseIcon size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                      <div className="text-xs text-slate-500 mb-1 uppercase flex items-center gap-2">
                        <ArrowRight size={12} className="text-purple-400" />{" "}
                        {t("chemistry.simulation.equation_label")}
                      </div>
                      <div className="text-xl md:text-2xl font-mono text-white font-bold tracking-wide relative z-10">
                        <ChemicalFormatter
                          formula={
                            result.equation ||
                            `${selected[0]!.formula} + ${selected[1]!.formula} → ${result.products}`
                          }
                        />
                      </div>
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Atom size={48} className="text-purple-500" />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-purple-400/80 mb-1 uppercase font-bold tracking-wider flex items-center gap-2">
                        <Eye size={12} />{" "}
                        {t("chemistry.simulation.observation_label")}
                      </div>
                      <div className="text-slate-200 text-lg leading-relaxed font-medium">
                        "
                        {result.observationKey
                          ? t(
                            `chemistry.simulation.${result.observationKey}`,
                            result.observationData || {},
                          )
                          : result.observation}
                        "
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
