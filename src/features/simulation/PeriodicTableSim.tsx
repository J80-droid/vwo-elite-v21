/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic element and spectral data */
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { motion } from "framer-motion";
import { Search, Thermometer } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { useModuleState } from "../chemistry";
import { BohrModel } from "./BohrModel";
import { CrystalLattice } from "./CrystalLattice";
import {
  ElementData,
  getCategoryColor,
  getCategoryHex,
  PERIODIC_DATA,
} from "./data/PeriodicData";
import { EmissionSpectrum } from "./EmissionSpectrum";
import { IsotopeSelector } from "./IsotopeSelector";
import { OrbitalVisualizer } from "./OrbitalSim";

interface PeriodicTableProps {
  mode?: "sidebar" | "main";
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
    viewMode = "bohr",
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

  if (mode === "sidebar") {
    return (
      <div className="h-full flex flex-col p-4 overflow-y-auto space-y-6 custom-scrollbar relative z-10">
        <div className="bg-obsidian-900 p-4 rounded-xl border border-white/10 shadow-inner">
          <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Thermometer size={14} className="text-cyan-500" />{" "}
            {t("periodic_table.trend_visualization")}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: "none", label: t("periodic_table.trend_none") },
              {
                id: "electronegativity",
                label: t("periodic_table.trend_electronegativity"),
              },
              {
                id: "atomicRadius",
                label: t("periodic_table.trend_atomic_radius"),
              },
              {
                id: "meltingPoint",
                label: t("periodic_table.trend_melting_point"),
              },
              {
                id: "boilingPoint",
                label: t("periodic_table.trend_boiling_point"),
              },
              { id: "density", label: t("periodic_table.trend_density") },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setHeatmapMode(m.id as any)}
                className={`btn-elite-glass !w-full !p-2 !rounded-lg !text-[10px] !justify-start !border-transparent ${heatmapMode === m.id ? "btn-elite-cyan active" : "text-slate-500 hover:text-slate-300"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {heatmapMode !== "none" && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-[hsl(240,80%,50%)] via-[hsl(120,80%,50%)] to-[hsl(0,80%,50%)] mb-1" />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>{t("periodic_table.low")}</span>
                <span>{t("periodic_table.high")}</span>
              </div>
            </div>
          )}
        </div>

        {bondInfo && (
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-4 rounded-xl border border-purple-500/30 animate-in zoom-in-95">
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-3">
              {t("periodic_table.bonding_calculator")}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-white">
                {selected!.symbol}
              </span>
              <div className="h-px flex-1 mx-4 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-30" />
              <span className="text-xl font-bold text-purple-400">
                {secondarySelected!.symbol}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  {t("periodic_table.diff_en")}
                </span>
                <span className="font-mono text-white">
                  {Math.abs(
                    selected!.electronegativity! -
                    secondarySelected!.electronegativity!,
                  ).toFixed(2)}
                </span>
              </div>
              <div
                className={`p-2 rounded-lg bg-white/5 border border-white/10 text-center text-xs font-bold text-${bondInfo.color}`}
              >
                {bondInfo.type}
              </div>
            </div>
          </div>
        )}

        {selected ? (
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {selected.name}
              </h2>
              <span
                className={`text-3xl font-mono font-bold text-${getCategoryColor(selected.category)} opacity-80`}
              >
                {selected.symbol}
              </span>
            </div>
            <div
              className={`text-[10px] font-bold text-${getCategoryColor(selected.category)} mb-4 uppercase tracking-[0.2em] opacity-60 border-b border-white/5 pb-2`}
            >
              {selected.category}
            </div>

            <div className="space-y-2 text-[13px] text-slate-300">
              {[
                {
                  label: t("periodic_table.properties.number"),
                  value: selected.number,
                },
                {
                  label: t("periodic_table.properties.molar_mass"),
                  value: selected.molarMass
                    ? `${selected.molarMass} g/mol`
                    : `${selected.mass} u`,
                },
                {
                  label: t("periodic_table.properties.oxidation"),
                  value: selected.oxidationStates?.join(", ") || "-",
                },
                {
                  label: t("periodic_table.properties.electronegativity"),
                  value: selected.electronegativity || "-",
                },
                {
                  label: t("periodic_table.properties.radius"),
                  value: selected.atomicRadius
                    ? `${selected.atomicRadius} pm`
                    : "-",
                },
                {
                  label: t("periodic_table.properties.density"),
                  value: selected.density ? `${selected.density} g/cm³` : "-",
                },
                {
                  label: t("periodic_table.properties.melting_point"),
                  value: selected.meltingPoint
                    ? `${selected.meltingPoint} K`
                    : "-",
                },
                {
                  label: t("periodic_table.properties.boiling_point"),
                  value: selected.boilingPoint
                    ? `${selected.boilingPoint} K`
                    : "-",
                },
                {
                  label: t("periodic_table.properties.ionization"),
                  value: selected.ionizationEnergy
                    ? `${selected.ionizationEnergy} kJ/mol`
                    : "-",
                },
                {
                  label: t("periodic_table.properties.config"),
                  value: selected.config,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between border-b border-white/5 pb-1"
                >
                  <span className="text-slate-500">{row.label}</span>
                  <span className="font-mono text-white">{row.value}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-slate-500 italic leading-relaxed">
              {selected.summary}
            </p>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex bg-slate-800/50 rounded-lg p-1 mb-4 border border-white/5">
                {["bohr", "lattice", "orbitals"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setState({ ...state, viewMode: v as any })}
                    className={`btn-elite-glass !flex-1 !py-1.5 !rounded-lg !text-[8px] !border-transparent ${viewMode === v ? "btn-elite-cyan active" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {v === "bohr"
                      ? t("periodic_table.view_bohr")
                      : v === "lattice"
                        ? t("periodic_table.view_lattice")
                        : t("periodic_table.view_orbitals")}
                  </button>
                ))}
              </div>

              <div className="relative min-h-[180px] flex items-center justify-center">
                {viewMode === "bohr" ? (
                  <BohrModel
                    symbol={selected.symbol}
                    shells={selected.shells}
                    color={getCategoryHex(selected.category)}
                    size={160}
                  />
                ) : viewMode === "lattice" ? (
                  <CrystalLattice
                    type={selected.lattice || "BCC"}
                    color={getCategoryHex(selected.category)}
                    size={180}
                  />
                ) : (
                  <OrbitalVisualizer
                    {...(() => {
                      // Parse config to get last electron (e.g. 2p4 -> n=2, l=1)
                      const parts = selected.config.split(" ");
                      const last = parts[parts.length - 1] || "1s1";
                      const match = last.match(/(\d+)([spdf])(\d+)?/);
                      if (match) {
                        const n = parseInt(match[1]!);
                        const lStr = match[2];
                        const l =
                          lStr === "s"
                            ? 0
                            : lStr === "p"
                              ? 1
                              : lStr === "d"
                                ? 2
                                : 3;
                        return { n, l, m: 0 };
                      }
                      return { n: 1, l: 0, m: 0 };
                    })()}
                  />
                )}
              </div>
            </div>

            {selected.isotopes && <IsotopeSelector element={selected} />}

            {selected.spectrum && (
              <div className="mt-4">
                <EmissionSpectrum
                  symbol={selected.symbol}
                  lines={selected.spectrum}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 grayscale opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
            <Search size={40} className="mb-4" />
            <div className="text-xs uppercase font-bold tracking-widest text-slate-400">
              {t("periodic_table.scan_element")}
            </div>
            <p className="text-[10px] mt-2 leading-relaxed">
              {t("periodic_table.scan_instruction")}
            </p>
          </div>
        )}
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
