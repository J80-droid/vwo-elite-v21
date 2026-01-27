/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-useless-escape */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any -- nerdamer solver and Recharts types */
import "katex/dist/katex.min.css";
import "nerdamer/Solve";

import { FormulaBrowser } from "@features/search/ui/FormulaBrowser";
import { useFormulas } from "@shared/hooks/useFormulas";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useFormulaStore } from "@shared/model/formulaStore";
import {
  AlertTriangle,
  ArrowRightLeft,
  Book,
  ChevronRight,
  Compass,
  Cpu,
  Database,
  RotateCcw,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import nerdamer from "nerdamer";
import React, { useEffect, useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FormulaSearchProps {
  setCurrentView?: (view: any) => void;
}

export const FormulaSearch: React.FC<FormulaSearchProps> = ({
  setCurrentView: _setCurrentView,
}) => {
  // Hooks
  const { t } = useTranslations();

  const {
    allFormulas,
    toggleFavorite,
    isFavorite,
    addCustomFormula,
    favorites,
  } = useFormulas();
  const { logInteraction } = useFormulaStore();

  // UI State
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "Natuurkunde" | "Scheikunde" | "Wiskunde B"
  >("Natuurkunde");
  const [selectedId, setSelectedId] = useState<string | null>(
    allFormulas[0]?.id || null,
  );
  const [browserOpen, setBrowserOpen] = useState(false);
  const [showDerivation, setShowDerivation] = useState(false);

  // Solver Engine State
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [targetVar, setTargetVar] = useState<string>("");
  const [calculatedResult, setCalculatedResult] = useState<string | null>(null);
  const [solverError, setSolverError] = useState<string | null>(null);

  // Category and Filter logic
  const filteredFormulas = useMemo(() => {
    return allFormulas.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.symbolic?.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = f.category === activeCategory || !activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allFormulas, search, activeCategory]);

  const selectedFormula = useMemo(
    () => allFormulas.find((f) => f.id === selectedId) || filteredFormulas[0],
    [allFormulas, selectedId, filteredFormulas],
  );

  // Auto-select first result if current selection is filtered out
  useEffect(() => {
    if (
      filteredFormulas.length > 0 &&
      !filteredFormulas.some((f) => f.id === selectedId)
    ) {
      setSelectedId(filteredFormulas[0].id);
    }
  }, [filteredFormulas, selectedId]);

  // EFFECT: Reset & Target Selection
  useEffect(() => {
    if (selectedFormula) {
      setInputs({});
      setCalculatedResult(null);
      setSolverError(null);
      setShowDerivation(false);

      // Slimme target selectie: Pak de eerste variabele
      if (selectedFormula.units.length > 0) {
        setTargetVar(selectedFormula.units[0].symbol);
      }

      // Didactisch Loggen (Debounce)
      const timer = setTimeout(() => {
        logInteraction({
          type: "search",
          formulaId: selectedFormula.id,
          formulaName: selectedFormula.name,
          category: selectedFormula.category || "Algemeen",
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedId, selectedFormula, logInteraction]);

  // --- 1. ROBUUSTE SOLVER ENGINE ---
  const solveFormula = () => {
    // Veiligheidscheck: Heeft deze formule wel een symbolische definitie?
    if (!selectedFormula || !selectedFormula.symbolic) {
      setSolverError(t.formula.solver_error);
      return;
    }

    try {
      const equation = selectedFormula.symbolic; // Bijv: "F=m*a"

      // Verzamel inputs
      const knownValues: Record<string, string> = {};
      let filledCount = 0;

      selectedFormula.units.forEach((u: any) => {
        // Alleen invullen als het NIET de target is én er een waarde is
        if (
          u.symbol !== targetVar &&
          inputs[u.symbol] &&
          inputs[u.symbol] !== ""
        ) {
          knownValues[u.symbol] = inputs[u.symbol]!;
          filledCount++;
        }
      });

      // Hebben we genoeg variabelen? (N-1)
      // if (filledCount < selectedFormula.units.length - 1) return;

      // De Magie: Symbolisch oplossen
      const solution = (nerdamer as any).solve(equation, targetVar);
      const evaluated = solution.evaluate(knownValues);

      // Resultaat opschonen
      const resultDec = evaluated.text("decimals").replace(/[\[\]]/g, "");

      setCalculatedResult(resultDec);
      setSolverError(null);

      logInteraction({
        type: "calculation",
        formulaId: selectedFormula.id,
        formulaName: selectedFormula.name,
        category: selectedFormula.category || "Algemeen",
        details: `${targetVar} = ${resultDec}`,
      });
    } catch (e: any) {
      // Vang wiskundige fouten af (delen door nul, etc.)
      // console.warn("Solver Exception:", e);
      // setCalculatedResult(null);
      // setSolverError("Kan niet berekenen. Controleer je waarden.");
    }
  };

  // Auto-solve trigger
  useEffect(() => {
    const timer = setTimeout(() => solveFormula(), 300);
    return () => clearTimeout(timer);
  }, [inputs, targetVar]);

  // --- 2. VEILIGE GRAFIEK GENERATOR ---
  const graphData = useMemo(() => {
    // Strenge checks vooraf om crashes te voorkomen
    if (
      !selectedFormula ||
      !calculatedResult ||
      !targetVar ||
      !selectedFormula.symbolic
    )
      return [];

    // Kies variabele voor X-as
    const xVarUnit = selectedFormula.units.find(
      (u: any) => u.symbol !== targetVar && inputs[u.symbol],
    );
    if (!xVarUnit) return [];

    const data = [];
    const baseVal = parseFloat(inputs[xVarUnit.symbol] || "1");
    if (isNaN(baseVal) || baseVal === 0) return []; // Vermijd 0-divisies bij percentages

    try {
      // Genereer punten van 50% tot 150%
      for (let i = 0; i <= 10; i++) {
        const factor = 0.5 + i / 10;
        const xVal = baseVal * factor;

        // Kloon inputs
        const tempInputs = { ...inputs, [xVarUnit.symbol]: xVal.toString() };
        const knownValues: Record<string, string> = { ...tempInputs };
        delete knownValues[targetVar];

        // Los op voor dit punt
        const solution = (nerdamer as any).solve(
          selectedFormula.symbolic,
          targetVar,
        );
        const yValRaw = solution
          .evaluate(knownValues)
          .text("decimals")
          .replace(/[\[\]]/g, "");
        const yVal = parseFloat(yValRaw);

        if (!isNaN(yVal) && isFinite(yVal)) {
          data.push({
            name: (factor * 100).toFixed(0) + "%",
            x: xVal.toPrecision(3),
            y: yVal,
          });
        }
      }
    } catch (e) {
      console.error("Graph gen error", e); // Faal stil, toon gewoon geen grafiek
    }
    return data;
  }, [inputs, calculatedResult, targetVar, selectedFormula]);

  // Helpers
  const openBrowser = (cat: any) => {
    setActiveCategory(cat);
    setBrowserOpen(true);
  };

  return (
    <div
      className="flex h-screen bg-black overflow-hidden pt-16 font-outfit"
      id="formula-assistant-container"
    >
      {/* LINKER SIDEBAR */}
      <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-obsidian-950 relative z-10 shadow-2xl overflow-y-auto custom-scrollbar flex-shrink-0">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Database className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">
                Binas.Core
              </h2>
              <p className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
                Scientific Engine
              </p>
            </div>
          </div>
          <div className="relative group mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.formula.search_placeholder}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-xs text-white outline-none focus:border-blue-500/50 transition-all"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
          </div>
        </div>

        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Database size={10} /> Categorieën
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {(["Natuurkunde", "Scheikunde", "Wiskunde B"] as const).map((cat) => {
            const styles = {
              Natuurkunde: {
                active:
                  "bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]",
                hover:
                  "hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-200",
              },
              Scheikunde: {
                active:
                  "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                hover:
                  "hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-200",
              },
              "Wiskunde B": {
                active:
                  "bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_15px_rgba(232,121,249,0.4)]",
                hover:
                  "hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30 hover:text-fuchsia-200",
              },
            }[cat];

            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-3 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? styles.active
                    : `bg-white/5 border-white/5 text-slate-500 ${styles.hover}`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          {search ? <Search size={10} /> : <Star size={10} />}{" "}
          {search ? "Zoekresultaten" : "Favorieten"}
        </h3>
        <div className="space-y-1">
          {(() => {
            const displayItems = search
              ? filteredFormulas
              : allFormulas.filter((f) => favorites.includes(f.id));

            if (displayItems.length === 0 && !search) {
              return (
                <div className="text-slate-500 text-[10px] italic p-3 border border-dashed border-slate-800 rounded-lg text-center">
                  Nog geen favorieten. <br />
                  <span className="text-[9px] mt-1 block opacity-60">
                    Klik op <Star size={8} className="inline text-yellow-500" />{" "}
                    om te bewaren.
                  </span>
                </div>
              );
            }

            return displayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-2 rounded-lg border transition flex items-center gap-3 group ${selectedId === item.id ? "bg-blue-500/10 border-blue-500/30" : "bg-transparent border-transparent hover:bg-white/5"}`}
              >
                <div
                  className={`p-1.5 rounded-md ${search ? "bg-blue-500/10 text-blue-400" : "bg-yellow-500/10 text-yellow-400"}`}
                >
                  {search ? (
                    <Search size={12} />
                  ) : (
                    <Star size={12} fill="currentColor" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold truncate ${selectedId === item.id ? "text-white" : "text-slate-400"}`}
                  >
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-600 truncate flex items-center gap-2 mt-1">
                    {item.category && (
                      <span
                        className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[9px] font-bold tracking-wide"
                        style={{
                          color:
                            item.category === "Natuurkunde"
                              ? "#3b82f6"
                              : item.category === "Scheikunde"
                                ? "#10b981"
                                : "#d946ef",
                          backgroundColor:
                            item.category === "Natuurkunde"
                              ? "rgba(59,130,246,0.1)"
                              : item.category === "Scheikunde"
                                ? "rgba(16,185,129,0.1)"
                                : "rgba(217,70,239,0.1)",
                        }}
                      >
                        {item.category.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {selectedId === item.id && (
                  <ChevronRight size={12} className="text-blue-500" />
                )}
              </button>
            ));
          })()}
        </div>
        <div className="p-6 border-t border-white/5 bg-black/20 mt-auto">
          <button
            onClick={() => openBrowser("Natuurkunde")}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            Open Bibliotheek
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-black relative flex flex-col p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto space-y-8 pb-20">
          {selectedFormula ? (
            <>
              {/* HERO SECTION */}
              <div className="bg-obsidian-900/60 border border-white/10 rounded-[32px] p-8 backdrop-blur-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/30">
                      {selectedFormula.category}
                    </span>
                    {selectedFormula.binasTable && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/30 flex items-center gap-2">
                        <Book size={12} /> Binas {selectedFormula.binasTable}
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(selectedFormula.id)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Book
                        className={
                          isFavorite(selectedFormula.id)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }
                        size={16}
                      />
                    </button>
                  </div>
                  <div className="text-3xl md:text-5xl text-white font-serif mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <BlockMath math={selectedFormula.latex} />
                  </div>
                  <p className="text-slate-400 text-sm max-w-xl italic leading-relaxed">
                    "{selectedFormula.description}"
                  </p>
                </div>
                <div className="flex flex-col gap-2 z-10">
                  <button
                    onClick={() => setShowDerivation(!showDerivation)}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-all"
                  >
                    <ArrowRightLeft size={14} />{" "}
                    {showDerivation ? "Verberg Afleiding" : "Toon Afleiding"}
                  </button>
                </div>
              </div>

              {/* AFLEIDING PANEL */}
              {showDerivation && (
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">
                    Wiskundige Afleiding
                  </h4>
                  <div className="text-slate-300 space-y-2 font-serif">
                    <p>De afleiding volgt uit de basisprincipes:</p>
                    <BlockMath math="E_{tot} = \text{constant}" />
                    <p className="text-xs italic text-slate-500">
                      (Gedetailleerde afleiding komt in volgende update)
                    </p>
                  </div>
                </div>
              )}

              {/* INTERACTIVE SOLVER SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SOLVER */}
                <div className="lg:col-span-7 bg-gradient-to-br from-blue-900/10 to-indigo-900/10 border border-blue-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      <Compass size={14} /> Multi-Directional Solver
                    </h4>
                    <button
                      onClick={() => setInputs({})}
                      className="text-xs text-slate-500 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  </div>

                  {!selectedFormula.symbolic ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                      <AlertTriangle size={32} className="mb-2 opacity-50" />
                      <p className="text-xs">
                        Geen symbolische data beschikbaar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      {selectedFormula.units.map((u: any, i: number) => {
                        const isTarget = u.symbol === targetVar;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 ${isTarget ? "bg-blue-500/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "bg-black/40 border-white/5 hover:border-white/10"}`}
                          >
                            <button
                              onClick={() => setTargetVar(u.symbol)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-serif font-bold text-xl shadow-lg transition-all hover:scale-105 active:scale-95 ${isTarget ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-black" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}
                              title={
                                isTarget
                                  ? "Huidig doel"
                                  : "Klik om te berekenen"
                              }
                            >
                              <InlineMath math={u.symbol} />
                            </button>
                            <div className="flex-1">
                              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1.5 px-1">
                                <span>{u.name}</span>
                                <span className="text-slate-400 bg-white/5 px-1.5 rounded">
                                  {u.unit}
                                </span>
                              </div>
                              {isTarget ? (
                                <div className="w-full h-10 flex items-center px-2 text-2xl font-mono text-blue-200 font-bold tracking-tight">
                                  {calculatedResult ? (
                                    parseFloat(calculatedResult).toPrecision(5)
                                  ) : (
                                    <span className="text-slate-600 animate-pulse">
                                      ...
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  placeholder="?"
                                  value={inputs[u.symbol] || ""}
                                  onChange={(e) =>
                                    setInputs({
                                      ...inputs,
                                      [u.symbol]: e.target.value,
                                    })
                                  }
                                  className="w-full h-10 bg-transparent border-b border-white/10 text-white font-mono text-lg focus:border-blue-500 outline-none transition-colors placeholder:text-slate-700"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {solverError && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-bold text-center">
                      {solverError}
                    </div>
                  )}
                </div>

                {/* GRAPH (5 cols) */}
                <div className="lg:col-span-5 bg-obsidian-900/40 border border-white/5 rounded-3xl p-6 flex flex-col min-h-[300px]">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <TrendingUp size={14} /> {t.formula.graph_title}
                  </h4>

                  <div className="flex-1 w-full relative">
                    {calculatedResult && graphData.length > 0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minHeight={150}
                      >
                        <LineChart data={graphData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                            vertical={false}
                          />
                          <XAxis dataKey="x" hide />
                          <YAxis hide domain={["auto", "auto"]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#09090b",
                              border: "1px solid #333",
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                            itemStyle={{ color: "#10b981" }}
                            formatter={(value: any) => [
                              value?.toPrecision(4) || "",
                              targetVar,
                            ]}
                            labelFormatter={() => ""}
                          />
                          <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 0 }}
                            activeDot={{
                              r: 6,
                              fill: "#10b981",
                              stroke: "#000",
                              strokeWidth: 2,
                            }}
                            animationDuration={500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-slate-600 text-xs">
                        {selectedFormula?.symbolic
                          ? t.formula.fill_values
                          : t.formula.graph_unavailable}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center opacity-30 h-full py-32">
              <Cpu size={80} className="text-blue-500 mb-6 animate-pulse" />
              <h3 className="text-xl font-black text-white uppercase tracking-[0.5em] text-center">
                Selecteer Formule
              </h3>
            </div>
          )}
        </div>
      </div>

      <FormulaBrowser
        isOpen={browserOpen}
        onClose={() => setBrowserOpen(false)}
        category={activeCategory}
        formulas={allFormulas}
        onSelect={setSelectedId}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        addCustomFormula={addCustomFormula}
      />
    </div>
  );
};
