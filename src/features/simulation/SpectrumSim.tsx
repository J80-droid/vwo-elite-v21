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

export const SpectrumSim: React.FC<{ mode?: "sidebar" | "main" }> = ({
  mode,
}) => {
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

  return (
    <div className={`h-full flex flex-col p-6 overflow-hidden ${mode === 'sidebar' ? 'bg-obsidian-950' : ''}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Microscope size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Spectrum Lab</h1>
            <p className="text-slate-500 text-xs font-medium">Binas T39 Karakteristieke groepen</p>
          </div>
        </div>

        <div className="flex bg-zinc-900 rounded-2xl p-1 border border-white/5">
          <button
            onClick={() => setType("ir")}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === "ir" ? "bg-indigo-500 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
          >
            IR
          </button>
          <button
            onClick={() => setType("nmr")}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === "nmr" ? "bg-indigo-500 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
          >
            H-NMR
          </button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-950/50 rounded-3xl border border-white/5 p-8 relative min-h-[400px]">
        <div className="absolute top-6 left-8 flex items-center gap-6 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
              Live Spectrum Analysis
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChartAny data={data} margin={{ top: 40, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              domain={type === "ir" ? [4000, 400] : [12, -1]}
              reversed={type === "ir"}
              stroke="#475569"
              fontSize={10}
              label={{
                value: type === "ir" ? "Golfgetal (cm-1)" : "Chemical Shift (ppm)",
                position: "bottom",
                offset: 20,
                fill: "#475569",
                fontSize: 10,
                fontWeight: "bold",
              }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#475569"
              fontSize={10}
              label={{
                value: type === "ir" ? "Transmissie (%)" : "Intensiteit",
                angle: -90,
                position: "insideLeft",
                fill: "#475569",
                fontSize: 10,
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const x = payload[0]?.payload.x;
                  const identification = getPeakIdentification(x);
                  return (
                    <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs font-bold text-white">{x.toFixed(1)} {type === 'ir' ? 'cm-1' : 'ppm'}</span>
                        <span className="text-[10px] text-indigo-400 font-black uppercase">Signal detected</span>
                      </div>
                      {identification ? (
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Binas Suggestie</p>
                          <p className="text-sm text-indigo-300 font-black">{identification[0]}</p>
                          <p className="text-[10px] text-slate-400 italic">{identification[1]}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Geen specifieke identificatie in BINAS T39</p>
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
              strokeWidth={2}
              dot={false}
              animationDuration={2000}
            />
          </LineChartAny>
        </ResponsiveContainer>
      </div>

      <div className="h-24 flex items-center gap-4 mt-6">
        <div className="flex-1 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Info size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Interpretatie Hulp</p>
              <p className="text-[10px] text-slate-500">Gebruik Binas Tabel 39 voor referentie</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
