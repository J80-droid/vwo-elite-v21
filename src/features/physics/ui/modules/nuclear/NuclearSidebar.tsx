import { FlaskConical, Pause, Play, RefreshCw, Sparkles } from "lucide-react";
import React from "react";

import { SHIELDING_MATERIALS, ShieldMaterial } from "./isotopes";
import { useNuclearEngine } from "./useNuclearEngine";

export const NuclearSidebar: React.FC = () => {
  const { state, setParam, reset } = useNuclearEngine();

  return (
    <div className="flex flex-row items-end gap-4 p-2 h-full w-full overflow-x-auto custom-scrollbar">
      {/* Playback Controls */}
      <div className="flex flex-col gap-1.5 pb-1">
        <button
          onClick={() => setParam("isPlaying", !state.isPlaying)}
          className={`group p-2 rounded-lg flex items-center justify-center transition-all duration-300 border backdrop-blur-md ${
            state.isPlaying
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:bg-rose-500/20 hover:border-rose-500/30"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20 hover:border-emerald-500/30"
          }`}
          title={state.isPlaying ? "Pauzeer" : "Start"}
        >
          <div
            className={`transition-transform duration-300 ${state.isPlaying ? "scale-90" : "group-hover:scale-110"}`}
          >
            {state.isPlaying ? (
              <Pause size={16} fill="currentColor" className="opacity-90" />
            ) : (
              <Play size={16} fill="currentColor" className="opacity-90" />
            )}
          </div>
        </button>
        <button
          onClick={reset}
          className="group p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg text-blue-400/70 hover:text-cyan-300 hover:bg-blue-500/10 hover:border-cyan-400/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all duration-300 backdrop-blur-md"
          title="Reset Simulatie"
        >
          <RefreshCw
            size={14}
            className="transition-transform duration-500 group-hover:rotate-180"
          />
        </button>
      </div>

      {/* Isotope Selector */}
      <div className="flex flex-col gap-2 min-w-[200px] border-r border-white/10 pr-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Isotoop
            </span>
            <button
              onClick={() => setParam("isLibraryOpen", true)}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/10 hover:bg-white/5 transition-colors group"
              title="Open Bibliotheek"
            >
              <span className="w-0.5 h-3 bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-colors" />
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-300 uppercase tracking-wider">
                Bibliotheek
              </span>
            </button>
          </div>

          {state.isotopeId !== "custom" && (
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              T½ ={" "}
              {state.halfLife < 60
                ? `${state.halfLife.toFixed(1)}s`
                : `${(state.halfLife / 365.25 / 24 / 3600).toExponential(1)} Jr`}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5 h-full overflow-y-auto max-h-[120px] pr-1 custom-scrollbar">
          {[
            {
              id: "co60",
              label: "Co-60",
              sub: "Gamma",
              color: "text-yellow-400",
              border: "border-yellow-500/30",
              bg: "bg-yellow-500/10",
            },
            {
              id: "sr90",
              label: "Sr-90",
              sub: "Beta-",
              color: "text-blue-400",
              border: "border-blue-500/30",
              bg: "bg-blue-500/10",
            },
            {
              id: "am241",
              label: "Am-241",
              sub: "Alfa",
              color: "text-rose-400",
              border: "border-rose-500/30",
              bg: "bg-rose-500/10",
            },
          ].map((iso) => (
            <button
              key={iso.id}
              onClick={() => setParam("isotopeId", iso.id)}
              className={`relative group overflow-hidden px-2 py-1 rounded-lg border transition-all text-left flex items-center justify-between ${
                state.isotopeId === iso.id
                  ? `${iso.bg} ${iso.border} ring-1 ring-white/20`
                  : "bg-black/40 border-white/10 hover:border-white/20"
              }`}
            >
              <span
                className={`text-[10px] font-black ${state.isotopeId === iso.id ? "text-white" : "text-slate-300"}`}
              >
                {iso.label}
              </span>
              <span
                className={`text-[8px] font-bold uppercase ${state.isotopeId === iso.id ? iso.color : "text-slate-500"}`}
              >
                {iso.sub}
              </span>
            </button>
          ))}

          {/* 4th Slot: Active Custom Isotope or Empty Placeholder */}
          {state.customIsotopes?.some((i) => i.id === state.isotopeId) ? (
            (() => {
              const activeCustom = state.customIsotopes!.find(
                (i) => i.id === state.isotopeId,
              )!;

              // Determine visuals based on decay mode
              let colors = {
                text: "text-emerald-400",
                border: "border-emerald-500/30",
                bg: "bg-emerald-500/10",
                sub: "Eigen",
              };
              if (activeCustom.decayMode === "alpha") {
                colors = {
                  text: "text-rose-400",
                  border: "border-rose-500/30",
                  bg: "bg-rose-500/10",
                  sub: "Alfa",
                };
              } else if (activeCustom.decayMode === "beta_plus") {
                colors = {
                  text: "text-cyan-400",
                  border: "border-cyan-500/30",
                  bg: "bg-cyan-500/10",
                  sub: "Beta+",
                };
              } else if (activeCustom.decayMode.startsWith("beta")) {
                colors = {
                  text: "text-blue-400",
                  border: "border-blue-500/30",
                  bg: "bg-blue-500/10",
                  sub: "Beta-",
                };
              } else if (activeCustom.decayMode === "gamma") {
                colors = {
                  text: "text-yellow-400",
                  border: "border-yellow-500/30",
                  bg: "bg-yellow-500/10",
                  sub: "Gamma",
                };
              }

              return (
                <button
                  onClick={() => setParam("isLibraryOpen", true)}
                  className={`relative group overflow-hidden px-2 py-1 rounded-lg border transition-all text-left flex items-center justify-between ${colors.bg} ${colors.border} ring-1 ring-white/20`}
                >
                  <span className="text-[10px] font-black text-white">
                    {activeCustom.symbol}
                  </span>
                  <span
                    className={`text-[8px] font-bold uppercase ${colors.text}`}
                  >
                    {colors.sub}
                  </span>
                </button>
              );
            })()
          ) : (
            <div className="rounded-lg border border-dashed border-white/5 bg-white/5 flex items-center justify-center opacity-30">
              <span className="text-[8px] font-bold text-slate-600 uppercase">
                Leeg
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Parameters Grid (2x2) */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 h-full items-center pb-1 border-r border-white/10 pr-6 mr-2">
        {/* 1. Detector Distance */}
        <div className="flex flex-col gap-1 w-36">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">
              Afstand
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {state.detectorDistance.toFixed(1)}m
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="25"
            step="0.5"
            value={state.detectorDistance}
            onChange={(e) =>
              setParam("detectorDistance", parseFloat(e.target.value))
            }
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-yellow-500 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>

        {/* 2. Source Quantity (N) - NEW for VWO 5/6 Statistics */}
        <div className="flex flex-col gap-1 w-36">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              Aantal (N)
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {state.particleCount}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={state.particleCount}
            onChange={(e) =>
              setParam("particleCount", parseInt(e.target.value))
            }
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-emerald-500 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>

        {/* 3. Shielding */}
        <div className="flex flex-col gap-1 w-36 relative group">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
              Afscherming
            </span>
            {/* Mini Dropdown Trigger */}
            <select
              value={state.shieldMaterial}
              onChange={(e) => setParam("shieldMaterial", e.target.value)}
              className="bg-transparent text-[9px] font-bold text-slate-400 outline-none hover:text-white cursor-pointer text-right appearance-none"
            >
              {Object.values(SHIELDING_MATERIALS).map((m: ShieldMaterial) => (
                <option
                  key={m.id}
                  value={m.id}
                  className="bg-[#0f172a] text-slate-300"
                >
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={state.shieldThickness}
              onChange={(e) =>
                setParam("shieldThickness", parseInt(e.target.value))
              }
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer hover:bg-white/20 transition-colors"
            />
            <span className="text-[9px] font-mono text-slate-400 w-6 text-right">
              {state.shieldThickness}
            </span>
          </div>
        </div>

        {/* 4. Magnetic Field */}
        <div className="flex flex-col gap-1 w-36">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
              B-Veld
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {state.magneticField.toFixed(2)}T
            </span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={state.magneticField}
            onChange={(e) =>
              setParam("magneticField", parseFloat(e.target.value))
            }
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-rose-500 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Tools (Right Aligned) */}
      <div className="flex flex-col gap-1 ml-auto min-w-[120px]">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">
          Tools
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setParam("idealMode", !state.idealMode)}
            className={`flex-1 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all group ${
              state.idealMode
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                : "bg-black/40 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Sparkles
              size={14}
              className={state.idealMode ? "text-indigo-400" : ""}
            />
            <span className="text-[8px] font-bold uppercase tracking-wider">
              Ideaal
            </span>
          </button>

          <button
            onClick={() => setParam("isLabOpen", !state.isLabOpen)}
            className={`flex-1 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all group ${
              state.isLabOpen
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "bg-black/40 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <FlaskConical
              size={14}
              className={state.isLabOpen ? "text-emerald-400" : ""}
            />
            <span className="text-[8px] font-bold uppercase tracking-wider">
              Lab
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
