import { FormulaEntry } from "@shared/lib/data/formulas";
import Fuse from "fuse.js";
import {
  Atom,
  Beaker,
  Calculator,
  ChevronRight,
  PlusCircle,
  Search,
  Star,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { InlineMath } from "react-katex";

interface FormulaBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  category: "Natuurkunde" | "Scheikunde" | "Wiskunde B";
  formulas: FormulaEntry[];
  onSelect: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addCustomFormula: (formula: FormulaEntry) => void;
}

export const FormulaBrowser: React.FC<FormulaBrowserProps> = ({
  isOpen,
  onClose,
  category: initialCategory,
  formulas,
  onSelect,
  toggleFavorite,
  isFavorite,
  addCustomFormula,
}) => {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  // New Formula Form State
  const [newName, setNewName] = useState("");
  const [newLatex, setNewLatex] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // --- SEARCH LOGIC (Fuse.js) ---
  const filtered = React.useMemo(() => {
    // 1. First filter by category
    const catFiltered = formulas.filter((f) => {
      const cat = activeCategory.toLowerCase();
      return (
        cat === "alle" ||
        f.context.toLowerCase().includes(cat) ||
        (cat === "wiskunde b" && f.context.toLowerCase().includes("wiskunde"))
      );
    });

    // 2. If no search, return filtered by category
    if (!search.trim()) return catFiltered;

    // 3. Setup Fuzzy Search on the CATEGORY-FILTERED set
    const fuse = new Fuse(catFiltered, {
      keys: [
        { name: "name", weight: 0.4 },
        { name: "id", weight: 0.2 },
        { name: "description", weight: 0.3 },
        { name: "related", weight: 0.3 }, // High value for semantic tags
        { name: "context", weight: 0.1 },
      ],
      threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
      distance: 100,
      ignoreLocation: true, // Search anywhere in string
    });

    return fuse.search(search).map((result) => result.item);
  }, [formulas, activeCategory, search]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `custom_${Date.now()}`;
    const newFormula: FormulaEntry = {
      id,
      name: newName,
      formula: newLatex, // Plain text fallback
      latex: newLatex,
      description: newDesc,
      context: `${initialCategory} (Eigen)`,
      difficulty: "Basis",
      related: [],
      units: [], // Simplified for custom ones for now
      commonMistakes: "Eigen toegevoegde formule.",
    };
    addCustomFormula(newFormula);
    setShowAddForm(false);
    setNewName("");
    setNewLatex("");
    setNewDesc("");
  };

  const categories = [
    {
      id: "Natuurkunde",
      label: "Natuurkunde",
      icon: Atom,
      color: "cyan",
      tailwindText: "text-cyan-400",
      tailwindBg: "bg-cyan-500/10",
      tailwindBorder: "border-cyan-500/50",
    },
    {
      id: "Scheikunde",
      label: "Scheikunde",
      icon: Beaker,
      color: "emerald",
      tailwindText: "text-emerald-400",
      tailwindBg: "bg-emerald-500/10",
      tailwindBorder: "border-emerald-500/50",
    },
    {
      id: "Wiskunde B",
      label: "Wiskunde",
      icon: Calculator,
      color: "fuchsia",
      tailwindText: "text-fuchsia-400",
      tailwindBg: "bg-fuchsia-500/10",
      tailwindBorder: "border-fuchsia-500/50",
    },
    {
      id: "Alle",
      label: "Alle",
      icon: Zap,
      color: "amber",
      tailwindText: "text-amber-400",
      tailwindBg: "bg-amber-500/10",
      tailwindBorder: "border-amber-500/50",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-obsidian-950 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-4">
            {/* Dynamic Neon Icon Container */}
            <div
              className={`p-4 rounded-2xl transition-all duration-500 ${activeCategory === "Natuurkunde"
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)]"
                  : activeCategory === "Scheikunde"
                    ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_-5px_rgba(52,211,153,0.3)]"
                    : activeCategory === "Wiskunde B"
                      ? "bg-fuchsia-500/10 text-fuchsia-400 shadow-[0_0_30px_-5px_rgba(232,121,249,0.3)]"
                      : "bg-amber-500/10 text-amber-400 shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]"
                }`}
            >
              {activeCategory === "Natuurkunde" ? (
                <Atom size={32} />
              ) : activeCategory === "Scheikunde" ? (
                <Beaker size={32} />
              ) : activeCategory === "Alle" ? (
                <Zap size={32} />
              ) : (
                <Calculator size={32} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                {activeCategory === "Alle" ? "Volledige" : activeCategory}{" "}
                Bibliotheek
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">
                Browse & Manage Formulas
              </p>
            </div>
          </div>

          {/* Category Tabs - Neon Style */}
          <div className="hidden lg:flex items-center gap-3 bg-black/20 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 border ${activeCategory === cat.id
                    ? `${cat.tailwindText} ${cat.tailwindBg} ${cat.tailwindBorder} shadow-[0_0_15px_-3px_currentColor]`
                    : "text-slate-500 border-transparent hover:text-white hover:bg-white/5"
                  }`}
              >
                <cat.icon
                  size={14}
                  className={
                    activeCategory === cat.id
                      ? "drop-shadow-[0_0_8px_currentColor]"
                      : ""
                  }
                />
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center bg-black/20">
          <div className="relative flex-1 group w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Zoek in ${activeCategory === "Alle" ? "de volledige database" : activeCategory}...`}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 pl-12 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all group-hover:bg-black/60"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
          </div>

          {/* Mobile Category Select (Visible on small screens) */}
          <div className="lg:hidden flex overflow-x-auto gap-2 w-full pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeCategory === cat.id
                    ? `${cat.tailwindBg} ${cat.tailwindText} ring-1 ring-white/10 shadow-[0_0_10px_-2px_currentColor]`
                    : "text-slate-500 bg-white/5"
                  }`}
              >
                <cat.icon size={12} />
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-black/40 border border-blue-500/30 rounded-2xl text-xs font-black uppercase tracking-widest text-blue-400 hover:text-white hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 shrink-0 w-full md:w-auto justify-center group"
          >
            <PlusCircle
              size={16}
              className="text-blue-400 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
            />
            <span className="group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
              Eigen Formule
            </span>
          </button>
        </div>

        {/* Quick Discovery */}
        <div className="px-6 py-4 bg-black/10 border-b border-white/5">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap shrink-0">
              Snel Ontdekken:
            </span>
            <div className="flex gap-2">
              {[
                {
                  id: "Mechanica",
                  label: "Mechanica",
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Elektriciteit",
                  label: "Elektra",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Magnetisme",
                  label: "Magnetisme",
                  color: "text-orange-400",
                  bg: "bg-orange-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Warmte",
                  label: "Warmte",
                  color: "text-rose-400",
                  bg: "bg-rose-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Optica",
                  label: "Licht",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Relativiteit",
                  label: "Relativiteit",
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Quantum",
                  label: "Quantum",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Straling",
                  label: "Straling",
                  color: "text-red-400",
                  bg: "bg-red-500/10",
                  main: "Natuurkunde",
                },
                {
                  id: "Molariteit",
                  label: "Concentratie",
                  color: "text-lime-400",
                  bg: "bg-lime-500/10",
                  main: "Scheikunde",
                },
                {
                  id: "Algebra",
                  label: "Algebra",
                  color: "text-fuchsia-400",
                  bg: "bg-fuchsia-500/10",
                  main: "Wiskunde B",
                },
                {
                  id: "Vectoren",
                  label: "Vectoren",
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/10",
                  main: "Wiskunde B",
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSearch(cat.id);
                    setActiveCategory(cat.main);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all duration-300 ${cat.bg} ${cat.color} border-${cat.color.split("-")[1]}-500/20 hover:border-${cat.color.split("-")[1]}-500/60 hover:shadow-[0_0_10px_currentColor]`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {showAddForm ? (
            <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-black text-white uppercase italic">
                Nieuwe Formule Toevoegen
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Naam
                  </label>
                  <input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                    placeholder="Bijv. Wet van ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    LaTeX Formule
                  </label>
                  <input
                    required
                    value={newLatex}
                    onChange={(e) => setNewLatex(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                    placeholder="Bijv. E = m \cdot c^2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Beschrijving
                  </label>
                  <textarea
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24"
                    placeholder="Korte uitleg..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 bg-black/20 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
                  >
                    Annuleer
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-500/10 border border-blue-500/50 rounded-xl text-xs font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:text-white transition-all duration-300"
                  >
                    Opslaan
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {filtered.map((f) => (
                <div
                  key={f.id}
                  className="p-5 bg-black/20 border border-white/5 rounded-[28px] group hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        {f.context}
                      </span>
                      <h4 className="font-black text-white leading-tight mt-1">
                        {f.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => toggleFavorite(f.id)}
                      className={`p-2 rounded-xl transition-all ${isFavorite(f.id) ? "bg-amber-500/20 text-amber-500" : "text-slate-600 hover:text-slate-400"}`}
                    >
                      <Star
                        size={18}
                        fill={isFavorite(f.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <div className="my-4 p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center min-h-[60px]">
                    <InlineMath math={f.latex} />
                  </div>

                  <button
                    onClick={() => {
                      onSelect(f.id);
                      onClose();
                    }}
                    className="w-full py-3 bg-transparent border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/5 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300 flex items-center justify-center gap-2 group-hover/btn"
                  >
                    Selecteer Formule{" "}
                    <ChevronRight
                      size={14}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Count */}
        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <div>{filtered.length} Formules Gevonden</div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-amber-500" /> v.4.5 Formula Engine
          </div>
        </div>
      </div>
    </div>
  );
};
