import {
  BarChart3,
  CircleDot,
  Download,
  Eraser,
  Layers,
  LineChart,
  Play,
  Plus,
  Square,
  Table2,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useNuclearEngine } from "./useNuclearEngine";

type LabTab = "distance" | "absorption" | "statistics";

interface DistancePoint {
  id: number;
  distance: number;
  nettoCounts: number;
}

interface AbsorptionPoint {
  id: number;
  thickness: number; // mm
  material: string;
  nettoCounts: number;
}

export const NuclearLab: React.FC = () => {
  const { state, setParam } = useNuclearEngine();

  // -- UI State --
  const [activeTab, setActiveTab] = useState<LabTab>("distance");
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [backgroundCPM, setBackgroundCPM] = useState<number | null>(null);

  // -- Data States --
  const [distData, setDistData] = useState<DistancePoint[]>([]);
  const [absData, setAbsData] = useState<AbsorptionPoint[]>([]);
  const [statsData, setStatsData] = useState<number[]>([]);
  const [isLinearized, setIsLinearized] = useState(false);
  const [isAutoMeasuring, setIsAutoMeasuring] = useState(false);

  // Refs voor realtime tracking
  const prevCountRef = useRef(0);
  const latestCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync ref met state (zodat we toegang hebben in timeouts)
  useEffect(() => {
    latestCountRef.current = state.detectionCount;
  }, [state.detectionCount]);

  // -- Logic: Measurement (Realtime Sampling) --
  const performMeasurement = (isBg: boolean = false) => {
    setIsMeasuring(true);

    if (isBg) {
      // NULMETING (Achtergrond):
      setTimeout(() => {
        // Poisson variatie rondom de interne noise generator (~18 CPM)
        const simulatedBg = 18 + (Math.random() - 0.5) * 8;
        setBackgroundCPM(Math.max(0, simulatedBg));
        setIsMeasuring(false);
      }, 1000);
    } else {
      // ECHTE METING:
      const startVal = latestCountRef.current;

      setTimeout(() => {
        const endVal = latestCountRef.current;
        const delta = endVal - startVal; // Aantal hits in 1 seconde

        // Extrapoleer naar CPM (Counts Per Minute)
        const measuredCPM = delta * 60;

        // Trek achtergrond af
        const bg = backgroundCPM || 0;
        const netto = measuredCPM - bg; // Kan negatief zijn door statistiek, dat is fysica!

        // Opslaan
        const r = state.detectorDistance;
        const mat = state.shieldMaterial;
        const th = state.shieldThickness;

        if (activeTab === "distance") {
          setDistData((prev) => [
            ...prev,
            { id: Date.now(), distance: r, nettoCounts: netto },
          ]);
        } else if (activeTab === "absorption") {
          setAbsData((prev) => [
            ...prev,
            {
              id: Date.now(),
              thickness: th,
              material: mat,
              nettoCounts: netto,
            },
          ]);
        }

        setIsMeasuring(false);
      }, 1000); // Meettijd 1 seconde
    }
  };

  // -- Logic: Calc (Linear Regression / Least Squares) --
  // VERBETERING: Dit gebruikt nu alle punten voor een "best fit" in plaats van alleen begin/eind.
  const dHalfCalculated = useMemo(() => {
    if (activeTab !== "absorption" || absData.length < 2) return null;

    // 1. Filter ongeldige punten (Counts <= 0 kan niet in ln)
    const validPoints = absData.filter((p) => p.nettoCounts > 0);
    if (validPoints.length < 2) return null;

    // 2. Variabelen voor Lineaire Regressie op: ln(N) = -mu * x + ln(N0)
    // Y = ln(N), X = dikte
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = validPoints.length;

    validPoints.forEach((p) => {
      const x = p.thickness;
      const y = Math.log(p.nettoCounts); // ln(N)

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    // 3. Bereken slope (richtingscoëfficiënt)
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return null; // Voorkom deling door 0 (alle punten zelfde dikte)

    const slope = (n * sumXY - sumX * sumY) / denominator;

    // 4. Slope = -mu. Dus mu = -slope
    const mu = -slope;

    // Fysica check: mu moet positief zijn (afname). Als slope positief is, groeit de straling (fout/ruis)
    if (mu <= 0) return null;

    // 5. dHalf = ln(2) / mu
    return Math.log(2) / mu;
  }, [absData, activeTab]);

  // -- Statistics Gathering Logic --
  const toggleAutoMeasure = () => {
    if (isAutoMeasuring) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsAutoMeasuring(false);
    } else {
      setIsAutoMeasuring(true);
      prevCountRef.current = state.detectionCount;
      intervalRef.current = setInterval(() => {
        const current = latestCountRef.current; // Gebruik ref voor thread-safety in interval
        const diff = current - prevCountRef.current;
        setStatsData((prev) => [...prev, diff]);
        prevCountRef.current = current;
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const histogram = useMemo(() => {
    if (statsData.length === 0) return null;
    const bins: Record<number, number> = {};
    statsData.forEach((val) => {
      bins[val] = (bins[val] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(bins));
    const avg = statsData.reduce((a, b) => a + b, 0) / statsData.length;
    const stdDev = Math.sqrt(avg);
    return { bins, maxFreq, avg, stdDev };
  }, [statsData]);

  const exportToCSV = () => {
    let content = "data:text/csv;charset=utf-8,";
    if (activeTab === "distance") {
      content += "ID,Afstand (m),Netto Counts (CPM)\n";
      distData.forEach((p) => {
        content += `${p.id},${p.distance},${p.nettoCounts}\n`;
      });
    } else if (activeTab === "absorption") {
      content += "ID,Dikte (mm),Materiaal,Netto Counts (CPM)\n";
      absData.forEach((p) => {
        content += `${p.id},${p.thickness},${p.material},${p.nettoCounts}\n`;
      });
    } else {
      content += "Meting ID,Counts (per s)\n";
      statsData.forEach((v, idx) => {
        content += `${idx},${v}\n`;
      });
    }

    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nuclear_lab_${activeTab}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!state.isLabOpen) return null;

  return (
    <div className="absolute bottom-32 right-6 w-[500px] bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in zoom-in-95 slide-in-from-top-10 duration-500">
      {/* Nav Tabs */}
      <div className="flex bg-white/5 p-1 gap-1 border-b border-white/5">
        {[
          { id: "distance", icon: LineChart, label: "Afstand" },
          { id: "absorption", icon: Layers, label: "Absorptie" },
          { id: "statistics", icon: BarChart3, label: "Statistiek" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as LabTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === t.id
                ? "bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent"
            }`}
          >
            <t.icon size={12} strokeWidth={3} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Header / Info Area */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {activeTab === "distance" && "Kwadratenwet ($1/r^2$)"}
            {activeTab === "absorption" && "Halfwaardendikte ($d_{1/2}$)"}
            {activeTab === "statistics" && "Poisson Verdeling"}
          </span>
          <button
            onClick={() => setParam("isLabOpen", false)}
            className="bg-white/5 p-1.5 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-all text-slate-600"
          >
            <Plus size={14} className="rotate-45" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5 flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase">
              Achtergrond
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {backgroundCPM !== null
                ? `${backgroundCPM.toFixed(0)} CPM`
                : "Nog geen meting"}
            </span>
          </div>
          <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5 flex flex-col">
            <span className="text-[8px] font-bold text-slate-500 uppercase">
              {activeTab === "distance" ? "Afstand r" : "Dikte d"}
            </span>
            <span className="text-sm font-mono font-bold text-yellow-400">
              {activeTab === "distance"
                ? `${state.detectorDistance.toFixed(1)} m`
                : `${state.shieldThickness} mm`}
            </span>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div className="relative h-44 w-full bg-black/60 border-y border-white/5 group">
        {activeTab !== "statistics" ? (
          <svg
            className="w-full h-full p-6 overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="100"
              x2="100"
              y2="100"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />

            {(activeTab === "distance" ? distData : absData).map(
              (p, _, arr) => {
                const xVal =
                  activeTab === "distance"
                    ? isLinearized
                      ? 1 / Math.pow((p as DistancePoint).distance, 2)
                      : (p as DistancePoint).distance
                    : (p as AbsorptionPoint).thickness;

                const maxValX =
                  activeTab === "distance"
                    ? isLinearized
                      ? 0.04
                      : 25 // Aangepast bereik voor linearisatie
                    : 200;

                // Dynamische schaling Y-as (met minimum van 50 om platte grafieken te voorkomen)
                const maxValY =
                  Math.max(...arr.map((m) => m.nettoCounts), 50) * 1.2;

                const plotX = (xVal / maxValX) * 100;
                const plotY = 100 - (p.nettoCounts / maxValY) * 100;

                return (
                  <g key={p.id}>
                    <circle
                      cx={plotX}
                      cy={plotY}
                      r="2"
                      fill={activeTab === "distance" ? "#10b981" : "#3b82f6"}
                    />
                    <line
                      x1={plotX}
                      y1={plotY - 2}
                      x2={plotX}
                      y2={plotY + 2}
                      stroke="white"
                      opacity="0.2"
                    />
                  </g>
                );
              },
            )}
          </svg>
        ) : histogram ? (
          <div className="w-full h-full p-6 overflow-visible relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="100"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
              {Object.entries(histogram.bins).map(([val, freq]) => {
                const v = parseInt(val);
                // Schaal de statistiek grafiek dynamisch
                const maxVal = Math.max(
                  ...Object.keys(histogram.bins).map(Number),
                  5,
                );
                const x = (v / maxVal) * 100;
                const h = (freq / histogram.maxFreq) * 100;
                return (
                  <rect
                    key={val}
                    x={x - 2}
                    y={100 - h}
                    width="4"
                    height={h}
                    fill="#10b981"
                    fillOpacity="0.4"
                    stroke="#10b981"
                    strokeWidth="0.5"
                  />
                );
              })}
            </svg>
            <div className="absolute top-2 right-4 text-[7px] font-mono text-emerald-400 text-right">
              Gemiddelde: {histogram.avg.toFixed(2)}
              <br />σ (St.afw.): {histogram.stdDev.toFixed(2)}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
            <BarChart3 size={32} className="text-emerald-500 mb-2" />
            <span className="text-[10px] font-black text-white tracking-widest uppercase">
              Geen statistiek data
            </span>
          </div>
        )}

        <div className="absolute bottom-2 right-4 text-[7px] font-black text-slate-500 uppercase tracking-widest">
          {activeTab === "distance"
            ? isLinearized
              ? "1/r² (m⁻²)"
              : "Afstand (m)"
            : "Dikte (mm)"}
        </div>
      </div>

      {/* Calculations HUD (for Absorption) */}
      {activeTab === "absorption" && (
        <div className="mx-5 my-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest leading-none">
              Halfwaardendikte ($d_{1 / 2}$)
            </span>
            <span
              className={`text-sm font-mono font-bold ${dHalfCalculated ? "text-emerald-400" : "text-slate-600"}`}
            >
              {dHalfCalculated
                ? `${dHalfCalculated.toFixed(2)} mm`
                : "Meet >1 punt (Counts > 0)..."}
            </span>
          </div>
          {dHalfCalculated && (
            <div className="flex flex-col text-right gap-1 pr-1">
              <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest leading-none">
                Vwas-coef ($\mu$)
              </span>
              <span className="text-sm font-mono font-bold text-emerald-400/80">
                {(Math.log(2) / dHalfCalculated).toFixed(3)} mm⁻¹
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="p-5 bg-white/5 flex flex-col gap-4">
        <div className="flex gap-2">
          {activeTab === "statistics" ? (
            <button
              onClick={toggleAutoMeasure}
              className={`flex-1 py-3.5 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                isAutoMeasuring
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                  : "bg-emerald-400/10 border-emerald-400/40 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)] hover:bg-emerald-400/20"
              }`}
            >
              {isAutoMeasuring ? (
                <Square size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
              {isAutoMeasuring ? "Stop Meting" : "Start Poisson Meting"}
            </button>
          ) : (
            <>
              <button
                onClick={() => performMeasurement(true)}
                disabled={isMeasuring}
                className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:bg-white/10 hover:text-slate-200 transition-all disabled:opacity-30"
              >
                {isMeasuring ? "Meten..." : "1. Nulmeting (Bg)"}
              </button>
              <button
                onClick={() => performMeasurement(false)}
                disabled={isMeasuring || backgroundCPM === null}
                className="flex-1 py-3.5 bg-emerald-400/10 border border-emerald-400/40 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)] hover:bg-emerald-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
              >
                <div className="flex items-center justify-center gap-2">
                  {isMeasuring ? (
                    <CircleDot size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} strokeWidth={3} />
                  )}
                  {isMeasuring ? "Meting..." : "2. Voeg punt toe"}
                </div>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          {activeTab === "distance" && (
            <button
              onClick={() => setIsLinearized(!isLinearized)}
              className={`text-[8px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-[0.2em] border ${
                isLinearized
                  ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                  : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
              }`}
            >
              {isLinearized ? "Linearisatie AAN" : "Linearisatie UIT"}
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={exportToCSV}
              disabled={
                activeTab === "distance"
                  ? distData.length === 0
                  : activeTab === "absorption"
                    ? absData.length === 0
                    : statsData.length === 0
              }
              className="bg-emerald-400/10 text-emerald-400 p-2 rounded-xl border border-emerald-400/20 hover:bg-emerald-400/20 transition-all disabled:opacity-30 shadow-[0_0_10px_rgba(52,211,153,0.1)]"
              title="Export to CSV"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => {
                setDistData([]);
                setAbsData([]);
                setStatsData([]);
              }}
              className="bg-rose-400/10 text-rose-400 p-2 rounded-xl border border-rose-400/20 hover:bg-rose-400/20 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)]"
              title="Clear All Data"
            >
              <Eraser size={14} />
            </button>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 bg-white/5 px-3 py-1.5 rounded-full">
              <Table2 size={12} className="text-slate-600" />
              <span>
                {activeTab === "distance"
                  ? distData.length
                  : activeTab === "absorption"
                    ? absData.length
                    : statsData.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
