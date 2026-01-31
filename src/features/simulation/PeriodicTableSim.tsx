/* eslint-disable @typescript-eslint/no-explicit-any */
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { useModuleState } from "../chemistry";
import {
  ElementData,
  getCategoryHex,
  PERIODIC_DATA,
} from "./data/PeriodicData";

interface PeriodicTableProps {
  mode?: "sidebar" | "main" | "stage" | "controls";
}

interface PeriodicState {
  selected: ElementData | null;
  secondarySelected: ElementData | null;
  heatmapMode:
  | "none"
  | "electronegativity"
  | "atomicRadius"
  | "meltingPoint"
  | "boilingPoint"
  | "density";
  filter: string;
  activeCategories: string[];
  viewMode: "bohr" | "lattice" | "orbitals";
}

export const PeriodicTableSim: React.FC<PeriodicTableProps> = ({ mode }) => {
  const { t } = useTranslation("chemistry");
  const [state, setState] = useModuleState("periodic-table", {
    selected: null,
    secondarySelected: null,
    heatmapMode: "none",
    filter: "",
    activeCategories: [],
    viewMode: "bohr",
  } as PeriodicState);

  const {
    selected,
    secondarySelected,
    heatmapMode,
    filter,
    activeCategories,
  } = state;

  useVoiceCoachContext(
    "ChemistryLab",
    `Analyse van ${selected?.name || "het periodiek systeem"}${secondarySelected ? ` in vergelijking met ${secondarySelected.name}` : ""}. Heatmap: ${heatmapMode}.`,
    {
      activeModule: "periodic-table",
      selected: selected?.symbol,
      secondarySelected: secondarySelected?.symbol,
    },
  );

  const setSelected = (el: ElementData | null) => {
    if (el && selected && el.number !== selected.number) {
      // New selection acts as Primary (so sidebar updates), old Primary becomes Secondary (for bonding)
      setState({ ...state, selected: el, secondarySelected: selected });
    } else {
      // No previous selection, or clicking the current Primary again (clears secondary)
      setState({ ...state, selected: el, secondarySelected: null });
    }
  };

  const setHeatmapMode = (m: PeriodicState["heatmapMode"]) =>
    setState({ ...state, heatmapMode: m });
  const setFilter = (f: string) => setState({ ...state, filter: f });

  const toggleCategory = (cat: string) => {
    const cats = activeCategories || [];
    if (cats.includes(cat)) {
      setState({ ...state, activeCategories: cats.filter((c) => c !== cat) });
    } else {
      setState({ ...state, activeCategories: [...cats, cat] });
    }
  };

  const getGridPos = (el: ElementData) => ({
    gridColumn: el.group,
    gridRow: el.period,
  });

  const getOpacity = (el: ElementData) => {
    if (filter) {
      const f = filter.toLowerCase();
      if (
        !el.name.toLowerCase().includes(f) &&
        !el.symbol.toLowerCase().includes(f)
      )
        return 0.15;
    }
    if (activeCategories && activeCategories.length > 0) {
      if (!activeCategories.includes(el.category)) return 0.15;
    }
    return 1;
  };

  const getBondType = (en1: number, en2: number) => {
    const diff = Math.abs(en1 - en2);
    if (diff > 1.7) return { type: "Ionbinding", color: "rose-500" };
    if (diff > 0.4) return { type: "Polair Covalent", color: "cyan-400" };
    return { type: "Covalent / Apolaire binding", color: "emerald-400" };
  };

  const bondInfo =
    selected?.electronegativity && secondarySelected?.electronegativity
      ? getBondType(
        selected.electronegativity,
        secondarySelected.electronegativity,
      )
      : null;

  const getHeatmapColor = (
    value: number | undefined,
    min: number,
    max: number,
  ) => {
    if (value === undefined) return "#1e293b"; // slate-800 for undefined
    const ratio = (value - min) / (max - min);
    // Hue from 240 (blue/cold) to 0 (red/hot)
    const hue = 240 - ratio * 240;
    return `hsl(${hue}, 80%, 50%)`;
  };

  const getPropertyRange = (prop: string) => {
    const values = PERIODIC_DATA.map((e) => (e as any)[prop]).filter(
      (v) => typeof v === "number",
    );
    return { min: Math.min(...values), max: Math.max(...values) };
  };

  const ElementTile = ({ el }: { el: ElementData }) => {
    const isPrimary = selected?.number === el.number;
    const isSecondary = secondarySelected?.number === el.number;
    const isActive = isPrimary || isSecondary;
    const opacity = getOpacity(el);

    let colorHex = getCategoryHex(el.category);
    if (heatmapMode !== "none") {
      const { min, max } = getPropertyRange(heatmapMode);
      colorHex = getHeatmapColor((el as any)[heatmapMode], min, max);
    }

    return (
      <motion.button
        layoutId={`el-${el.number}`}
        onClick={() => setSelected(el)}
        className={`
                    relative p-1 rounded-xl transition-all text-left flex flex-col items-stretch group overflow-hidden
                    bg-slate-900/40 backdrop-blur-md border border-white/10
                    ${isActive ? "scale-110 z-20 shadow-2xl border-b-4" : "hover:scale-105 hover:z-10 hover:bg-slate-800/60 border-b-2"}
                `}
        style={{
          ...getGridPos(el),
          opacity,
          filter: opacity < 1 ? "grayscale(0.8)" : "none",
          aspectRatio: "1",
          borderColor: isActive
            ? isPrimary
              ? colorHex
              : "#a855f7"
            : `${colorHex}44`,
          backgroundColor: isActive
            ? isPrimary
              ? `${colorHex}33`
              : "#a855f722"
            : heatmapMode !== "none"
              ? `${colorHex}22`
              : `${colorHex}15`,
          boxShadow: isActive
            ? `0 10px 30px -4px ${isPrimary ? colorHex : "#a855f7"}aa`
            : heatmapMode !== "none"
              ? `0 0 10px -5px ${colorHex}55`
              : `0 8px 15px -8px ${colorHex}88`,
        }}
      >
        <div className="absolute top-1 left-2 text-[0.45rem] leading-none z-10">
          <span className="text-slate-400 font-medium group-hover:text-white/80">
            {el.number}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0 z-10 relative mt-1">
          <div
            className={`
                        font-black leading-none tracking-wide transition-all duration-300
                        ${mode === "sidebar" ? "text-[0.6rem]" : "text-sm md:text-xl lg:text-2xl"}
                        text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]
                    `}
          >
            {el.symbol}
          </div>
        </div>
        {heatmapMode !== "none" && (el as any)[heatmapMode] && (
          <div className="absolute bottom-1 right-1 text-[0.5rem] font-bold text-white/50 font-mono">
            {((el as any)[heatmapMode] as number).toFixed(
              heatmapMode === "electronegativity" ? 2 : 0,
            )}
          </div>
        )}
      </motion.button>
    );
  };

  if (mode === "controls") {
    return (
      <div className="flex flex-row items-center gap-4">
        {/* Trend Vis Selection */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl items-center gap-1">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Trend</span>
          <div className="flex gap-0.5 max-w-[300px] overflow-x-auto no-scrollbar">
            {[
              { id: "none", label: "Geen" },
              { id: "electronegativity", label: "EN" },
              { id: "atomicRadius", label: "Radius" },
              { id: "meltingPoint", label: "Smelt" },
              { id: "density", label: "Dicht" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setHeatmapMode(m.id as any)}
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${heatmapMode === m.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bonding Calculator info if active */}
        {bondInfo && (
          <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/20 px-3 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-white">{selected!.symbol}</span>
            <div className="w-4 h-px bg-white/20" />
            <span className="text-[10px] font-bold text-indigo-400">{secondarySelected!.symbol}</span>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <span className={`text-[9px] font-black uppercase text-${bondInfo.color}`}>{bondInfo.type}</span>
          </div>
        )}

        {/* Current Selection mini-info */}
        {selected && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1 rounded-xl ml-auto">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Massa</span>
              <span className="text-[10px] font-bold text-white leading-tight">{selected.molarMass || selected.mass}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Config</span>
              <span className="text-[10px] font-bold text-cyan-400 leading-tight">{selected.config}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === "stage") {
    return (
      <div className="w-full h-full p-6 flex flex-col gap-6 overflow-hidden">
        {/* Search & Legend Bar */}
        <div className="flex items-center gap-6">
          <div className="relative w-64 group/search">
            <Search className="absolute left-3 top-2.5 text-slate-600 group-focus-within/search:text-cyan-500 transition-colors" size={14} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Zoek element..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {["alkali", "alkaline-earth", "transition", "basic-metal", "metalloid", "nonmetal", "halogen", "noble-gas"].map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategories?.includes(cat) ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'}`}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryHex(cat) }} />
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Periodic Grid */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="grid gap-1 relative max-w-full"
            style={{
              gridTemplateColumns: "repeat(18, minmax(0, 1fr))",
              gridTemplateRows: "repeat(7, minmax(0, 48px))",
              width: '1000px'
            }}
          >
            {PERIODIC_DATA.filter(el => el.period <= 7).map((el) => (
              <ElementTile key={el.number} el={el} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 md:p-12 overflow-auto bg-black flex flex-col custom-scrollbar relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.03),transparent_70%)]" />

      <div className="flex justify-between items-end mb-10 relative z-10">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-white to-white bg-clip-text text-transparent tracking-tight mb-2">
            {t("periodic_table.title")}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
            {t("periodic_table.subtitle")}
          </p>
        </div>

        <div className="relative group/search">
          <Search
            className="absolute left-3 top-3 text-slate-500 group-focus-within/search:text-cyan-400 transition-colors"
            size={16}
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("periodic_table.search_placeholder")}
            className="bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-cyan-500/50 outline-none w-72 text-sm transition-all shadow-inner backdrop-blur-md"
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 flex-1 relative z-10">
        <div
          className="grid gap-1.5 relative max-w-7xl w-full self-center mx-auto"
          style={{
            gridTemplateColumns: "repeat(18, minmax(0, 1fr))",
            gridTemplateRows: "repeat(10, minmax(0, 1fr))",
          }}
        >
          {PERIODIC_DATA.map((el) => (
            <ElementTile key={el.number} el={el} />
          ))}

          <div className="col-start-3 col-end-13 row-start-1 row-end-4 hidden lg:flex items-center justify-center pointer-events-none select-none">
            <div
              className="text-center opacity-[0.05] animate-pulse"
              style={{ animationDuration: "10s" }}
            >
              <div className="text-[12rem] leading-none text-cyan-800">𓅃</div>
            </div>
          </div>
        </div>

        <div className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-4 backdrop-blur-sm shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {t("periodic_table.legend")}
            </h3>
            {activeCategories && activeCategories.length > 0 && (
              <button
                onClick={() => setState({ ...state, activeCategories: [] })}
                className="text-[9px] text-red-400/80 hover:text-red-400 transition-colors uppercase font-bold tracking-tighter"
              >
                {t("periodic_table.clear_filter")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "alkali",
              "alkaline-earth",
              "transition",
              "basic-metal",
              "metalloid",
              "nonmetal",
              "halogen",
              "noble-gas",
              "lanthanide",
              "actinide",
            ]
              .map((cat) => ({ label: t(`categories.${cat}`), cat }))
              .map((item) => {
                const isSelected = activeCategories?.includes(item.cat);
                const isDimmed =
                  activeCategories &&
                  activeCategories.length > 0 &&
                  !isSelected;
                const colorHex = getCategoryHex(item.cat);

                return (
                  <button
                    key={item.cat}
                    onClick={() => toggleCategory(item.cat)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 group ${isDimmed ? "opacity-30 grayscale" : "opacity-100"}`}
                    style={{
                      borderColor: isSelected
                        ? colorHex
                        : "rgba(255,255,255,0.1)",
                      backgroundColor: isSelected
                        ? `${colorHex}15`
                        : "rgba(0,0,0,0.2)",
                      boxShadow: isSelected
                        ? `0 0 15px -5px ${colorHex}55`
                        : "none",
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: colorHex }}
                    />
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider ${isSelected ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
