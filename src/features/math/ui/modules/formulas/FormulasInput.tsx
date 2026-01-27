/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Formulas Input Component
 */

import "katex/dist/katex.min.css";

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { FormulasModuleState } from "@features/math/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import type { FormulaEntry } from "@shared/lib/data/formulas";
import { ArrowLeft, Book, BookOpen, Search } from "lucide-react";
import React from "react";
import { BlockMath } from "react-katex";

export const FormulasInput: React.FC = () => {
  const { t } = useTranslations();
  const {
    browserOpen,
    setBrowserOpen,
    setSelectedFormulaId,
    allFormulas,
    graphPlotterRef,
  } = useMathLabContext();
  const [state, setState] = useModuleState<FormulasModuleState>("formulas");

  const selectedFormula = allFormulas.find(
    (f) => f.id === state.selectedFormulaId,
  );

  // Filter formulas for search results
  const results = state.search
    ? allFormulas
        .filter(
          (f: FormulaEntry) =>
            f.name.toLowerCase().includes(state.search.toLowerCase()) ||
            f.description.toLowerCase().includes(state.search.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  // --- Detail View: If a formula is selected ---
  if (selectedFormula) {
    return (
      <div className="flex flex-col h-full space-y-6 animate-fade-in pb-20">
        {/* Back Button */}
        <button
          onClick={() => setSelectedFormulaId(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group px-1"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            {t("common.back") || "Terug naar Zoeken"}
          </span>
        </button>

        {/* Formula Header Card */}
        <div className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(236,72,153,0.05)]">
          <div className="text-white overflow-hidden">
            <BlockMath
              math={selectedFormula.latex || selectedFormula.formula}
            />
          </div>
        </div>

        {/* Formula Info */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {selectedFormula.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded text-[9px] font-bold text-pink-400 uppercase tracking-wider">
              {selectedFormula.context}
            </span>
            {selectedFormula.binasTable && (
              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                Binas {selectedFormula.binasTable}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {selectedFormula.description}
          </p>
        </div>

        {/* Quick Hint */}
        {selectedFormula.commonMistakes && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <span>Let Op</span>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              {selectedFormula.commonMistakes}
            </p>
          </div>
        )}

        {/* Reset View Button */}
        <button
          onClick={() => {
            if (graphPlotterRef?.current) {
              (graphPlotterRef.current as any).resetView();
            }
          }}
          className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] uppercase font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
        >
          Focus op Oorsprong
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
        {t("formula.search")}
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={state.search}
          onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
          placeholder={t("formula.search_placeholder")}
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-pink-500 transition-all"
        />
      </div>

      {/* Search Results in Sidebar */}
      {results.length > 0 && (
        <div className="space-y-2 mt-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {results.map((f: FormulaEntry) => (
            <button
              key={f.id}
              onClick={() => {
                console.log("Sidebar: Selecting formula:", f.id);
                setSelectedFormulaId(f.id);
                setState((s) => ({ ...s, search: "" })); // Clear search after selection
              }}
              className="w-full text-left p-3 rounded-lg bg-pink-500/5 border border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all group"
            >
              <div className="text-xs font-bold text-pink-400 group-hover:text-pink-300 flex justify-between">
                <span>{f.name}</span>
                <span className="text-[10px] opacity-50 font-normal">
                  {f.context}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-1">
                {f.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Open Browser Button */}
      <button
        onClick={() => setBrowserOpen(!browserOpen)}
        className={`w-full py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all border ${
          browserOpen
            ? "bg-pink-500/20 text-pink-400 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
            : "bg-white/5 text-slate-400 border-white/10 hover:border-pink-500/50 hover:text-pink-400 hover:bg-pink-500/5"
        }`}
      >
        {browserOpen ? <Book size={16} /> : <BookOpen size={16} />}
        {browserOpen ? t("formula.close_browser") : t("formula.open_browser")}
      </button>
    </div>
  );
};
