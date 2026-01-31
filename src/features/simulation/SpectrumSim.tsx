import { BINAS_DATA } from "@shared/assets/data/BinasData";
import {
  Info,
  Microscope,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SPECTRA_DATA } from "./data/SpectrumData";

const LineChartAny = LineChart as unknown as React.ElementType;

// BINAS T39 Identification mapping
const IR_HINTS = BINAS_DATA.T39B.rows; // ["Binding", "Groep", "Bereik"]
const NMR_HINTS = BINAS_DATA.T39C.rows; // ["Omgeving", "Shift"]

export const SpectrumSim: React.FC<{
  mode?: "sidebar" | "main" | "stage" | "controls";
}> = ({ mode }) => {
  const [selectedId] = useState<string>("ethanol");
  const [type, setType] = useState<"ir" | "nmr">("ir");
  const [detectiveMode] = useState(false);
  const [mysterySeed] = useState(0);

  const mysteryMol = useMemo(() => {
    const others = SPECTRA_DATA.filter((m) => m.id !== "water");
    return others[mysterySeed % others.length];
  }, [mysterySeed]);

  const mol = detectiveMode
    ? mysteryMol
    : (SPECTRA_DATA.find((m) => m.id === selectedId) ?? SPECTRA_DATA[0]);

  const data = mol ? (type === "ir" ? mol.ir : mol.nmr) : [];

  const getPeakIdentification = (x: number) => {
    if (type === "ir") {
      return IR_HINTS.find((h) => {
        const range = h[2]?.split("-") || [];
        const start = parseInt(range[0] || "0");
        const end = parseInt(range[1] || "0");
        return x >= start && x <= end;
      });
    }
    return NMR_HINTS.find((h) => {
      const range = h[1]?.split("-") || [];
      const start = parseFloat(range[0] || "0");
      const end = parseFloat(range[1] || "0");
      return x >= start && x <= end;
    });
  };

  if (mode === "controls") {
    return (
      <div className="flex flex-row items-center gap-4">
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
          <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest px-2">Analyse</span>
          <div className="flex gap-0.5">
            <button
              onClick={() => setType("ir")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${type === "ir" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-600 hover:text-white"}`}
            >
              IR
            </button>
            <button
              onClick={() => setType("nmr")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${type === "nmr" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-600 hover:text-white"}`}
            >
              H-NMR
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Status</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase leading-tight">BINAS T39 ACTIVE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col p-8 overflow-hidden relative ${mode === 'sidebar' ? 'bg-obsidian-950' : ''}`}>
      {mode === "stage" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
          <h1 className="text-[12rem] font-black tracking-tighter text-white">
            SPECTRUM
          </h1>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-2xl">
              <Microscope size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Spectrum Lab</h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Binas T39 Karakteristieke groepen</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-1 flex gap-1 backdrop-blur-xl">
            <button
              onClick={() => setType("ir")}
              className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${type === "ir" ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]" : "text-slate-500 hover:text-white"}`}
            >
              IR (Infrared)
            </button>
            <button
              onClick={() => setType("nmr")}
              className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${type === "nmr" ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]" : "text-slate-500 hover:text-white"}`}
            >
              H-NMR (Resonance)
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950/40 rounded-[2.5rem] border border-white/5 p-8 relative min-h-[400px] group overflow-hidden shadow-2xl">
          <div className="absolute top-6 left-8 flex items-center gap-4 z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                Real-time Frequency Analysis
              </span>
            </div>
          </div>

          <div className="w-full h-full pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChartAny data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={type === "ir" ? [4000, 400] : [12, -1]}
                  reversed={type === "ir"}
                  stroke="#475569"
                  fontSize={10}
                  tick={{ fill: '#475569', fontWeight: 'bold' }}
                  label={{
                    value: type === "ir" ? "Golfgetal (cm-1)" : "Chemical Shift (ppm)",
                    position: "bottom",
                    offset: 0,
                    fill: "#475569",
                    fontSize: 10,
                    fontWeight: "black",
                    className: "uppercase tracking-widest"
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#475569"
                  fontSize={10}
                  tick={{ fill: '#475569', fontWeight: 'bold' }}
                  label={{
                    value: type === "ir" ? "Transmissie (%)" : "Intensiteit",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#475569",
                    fontSize: 10,
                    fontWeight: "black",
                    className: "uppercase tracking-widest"
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const x = payload[0]?.payload.x;
                      const identification = getPeakIdentification(x);
                      return (
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-xl font-black text-white">{x.toFixed(1)} <span className="text-xs text-slate-500">{type === 'ir' ? 'cm-1' : 'ppm'}</span></span>
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">Signal detected</span>
                          </div>
                          {identification ? (
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Binas Reference</p>
                              <p className="text-lg text-indigo-300 font-black tracking-tight">{identification[0]}</p>
                              <p className="text-xs text-slate-400 font-medium italic opacity-70 leading-relaxed">{identification[1]}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No matching group</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#818cf8"
                  strokeWidth={4}
                  dot={false}
                  animationDuration={2000}
                />
              </LineChartAny>
            </ResponsiveContainer>
          </div>

          <div className="absolute bottom-8 right-8 flex items-center gap-4">
            <div className="flex flex-col items-end opacity-20 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-[0.2em]">Sample Identification</span>
              <span className="text-sm font-black text-white uppercase tracking-tighter">{mol.id}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between backdrop-blur-sm group/hint transition-all hover:bg-white/[0.08]">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg group-hover/hint:scale-110 transition-transform">
              <Info size={28} />
            </div>
            <div>
              <p className="text-lg font-black text-white tracking-tight uppercase">Interpretatie Hulp</p>
              <p className="text-sm text-slate-500 font-medium">Analyseer pieken en vergelijk ze met <span className="text-indigo-400 font-bold">Binas Tabel 39</span> voor functionele groepen.</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div className="px-4 py-2 rounded-full bg-black/40 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              T39B: IR Spectrum
            </div>
            <div className="px-4 py-2 rounded-full bg-black/40 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              T39C: NMR Spectrum
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
