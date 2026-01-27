/* eslint-disable @typescript-eslint/no-explicit-any -- Web Speech API and charting types */
import { useChemStore } from "@shared/model/chemStore";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Save,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LineChartAny = LineChart as any;

interface TitrationSimProps {
  titrationType: "strong_acid_strong_base" | "weak_acid_strong_base";
  concentrationAcid?: number;
  volumeAcidInitial?: number;
  concentrationBase?: number;
  pKa?: number;
}

// Indicator Definitions
const INDICATORS = {
  none: { name: "Geen", color: () => "bg-transparent" },
  fenolftaleine: {
    name: "Fenolftaleïne",
    range: [8.2, 10.0],
    color: (ph: number) =>
      ph < 8.2 ? "bg-transparent" : ph > 10.0 ? "bg-pink-500" : "bg-pink-200",
  },
  methyloranje: {
    name: "Methyloranje",
    range: [3.1, 4.4],
    color: (ph: number) =>
      ph < 3.1 ? "bg-red-500" : ph > 4.4 ? "bg-yellow-400" : "bg-orange-400",
  },
} as const;

export const TitrationSim: React.FC<TitrationSimProps> = ({
  titrationType,
  concentrationAcid = 0.1,
  volumeAcidInitial = 25,
  concentrationBase = 0.1,
  pKa = 4.75,
}) => {
  const { addLog } = useChemStore();
  const [volumeBase, setVolumeBase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [indicator] =
    useState<keyof typeof INDICATORS>("fenolftaleine");
  const [history, setHistory] = useState<{ v: number; ph: number }[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const dripIntervalRef = useRef<any>(null);

  // Calculate pH based on volume
  const currentPh = useMemo(() => {
    const vBase = volumeBase;
    const vTotal = volumeAcidInitial + vBase;
    const nAcid = (concentrationAcid * volumeAcidInitial) / 1000;
    const nBase = (concentrationBase * vBase) / 1000;

    if (titrationType === "strong_acid_strong_base") {
      if (nBase < nAcid) {
        const concH = (nAcid - nBase) / (vTotal / 1000);
        return -Math.log10(concH);
      } else if (Math.abs(nBase - nAcid) < 1e-9) {
        return 7;
      } else {
        const concOH = (nBase - nAcid) / (vTotal / 1000);
        return 14 + Math.log10(concOH);
      }
    } else {
      // Weak acid titration
      if (vBase === 0) {
        return 0.5 * (pKa - Math.log10(concentrationAcid));
      }
      if (nBase < nAcid) {
        // Buffer region (Henderson-Hasselbalch)
        return pKa + Math.log10(nBase / (nAcid - nBase));
      } else if (Math.abs(nBase - nAcid) < 1e-9) {
        // Equivalence point (salt hydrolysis)
        const concSalt = nAcid / (vTotal / 1000);
        const pKb = 14 - pKa;
        const pOH = 0.5 * (pKb - Math.log10(concSalt));
        return 14 - pOH;
      } else {
        // Excess base
        const concOH = (nBase - nAcid) / (vTotal / 1000);
        return 14 + Math.log10(concOH);
      }
    }
  }, [
    volumeBase,
    titrationType,
    concentrationAcid,
    volumeAcidInitial,
    concentrationBase,
    pKa,
  ]);

  // Handle Drip Simulation
  useEffect(() => {
    if (isRunning) {
      dripIntervalRef.current = setInterval(() => {
        setVolumeBase((v) => {
          const next = v + 0.1;
          setHistory((h) =>
            [...h, { v: Math.round(next * 10) / 10, ph: currentPh }].slice(-500),
          );
          return next;
        });
      }, 50);
    } else {
      clearInterval(dripIntervalRef.current);
    }
    return () => clearInterval(dripIntervalRef.current);
  }, [isRunning, currentPh]);

  const reset = () => {
    setIsRunning(false);
    setVolumeBase(0);
    setHistory([]);
  };

  const saveToJournal = () => {
    addLog({
      title: `Titratie - ${titrationType.replace(/_/g, " ")}`,
      type: "titration",
      details: `${concentrationAcid}M Zuur vs ${concentrationBase}M Base. Eind-pH: ${currentPh.toFixed(2)}`,
      dataPoints: history.map(h => ({ x: h.v, y: h.ph })),
      score: Math.max(0, 10 - Math.abs(currentPh - 7) * 2),
      accuracy: 95,
    });
  };

  return (
    <div className={`h-full flex flex-col p-6 bg-obsidian-950 overflow-hidden`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Titratie Simulator</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Neural Precision Engine v2.0</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`p-3 rounded-xl border transition-all ${isVoiceActive ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-obsidian-900 border-white/10 text-slate-500'}`}
          >
            {isVoiceActive ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
          </button>
          <button onClick={reset} className="p-3 rounded-xl bg-obsidian-900 border border-white/10 text-slate-500 hover:text-white transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {/* Visual Lab Setup */}
        <div className="flex flex-col gap-8">
          <div className="flex-1 bg-zinc-950/50 rounded-3xl border border-white/5 relative flex items-center justify-center p-12 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

            {/* Lab Apparatus visualization */}
            <div className="relative flex flex-col items-center gap-4">
              {/* Burette */}
              <div className="w-12 h-64 bg-white/5 border-2 border-white/10 rounded-full relative overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-cyan-500/30 transition-all duration-300"
                  style={{ height: `${Math.max(0, 100 - volumeBase * 2)}%` }}
                />
                {/* Burette marks */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="absolute w-full h-px bg-white/10" style={{ top: `${i * 10}%` }} />
                ))}
              </div>

              {/* Erlenmeyer */}
              <div className="relative mt-8">
                <div
                  className={`w-24 h-24 rounded-full border-4 border-white/20 relative overflow-hidden transition-colors duration-500 ${INDICATORS[indicator].color(currentPh)}`}
                >
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white/10" />
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white/10" />
              </div>
            </div>

            {/* Live Reading HUD */}
            <div className="absolute top-6 right-8 text-right space-y-2">
              <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block">pH Value</span>
              <span className="text-4xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-2xl">
                {currentPh.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${isRunning ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active:scale-95'}`}
            >
              {isRunning ? <span className="flex items-center justify-center gap-3"><Pause size={20} /> Stop Drop</span> : <span className="flex items-center justify-center gap-3"><Play size={20} /> Start Titratie</span>}
            </button>
            <button
              onClick={saveToJournal}
              className="px-8 py-5 bg-obsidian-900 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-obsidian-800 transition-all"
            >
              <Save size={20} />
            </button>
          </div>
        </div>

        {/* Real-time Tracking Chart */}
        <div className="bg-zinc-950/50 rounded-3xl border border-white/5 p-8 flex flex-col relative">
          <div className="absolute top-6 left-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">pH/Volume Analysis</span>
          </div>

          <div className="flex-1 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChartAny data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis
                  dataKey="v"
                  type="number"
                  domain={[0, 50]}
                  stroke="#475569"
                  fontSize={10}
                  label={{ value: 'Volume Base (mL)', position: 'bottom', offset: 10, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  domain={[0, 14]}
                  stroke="#475569"
                  fontSize={10}
                  ticks={[0, 2, 4, 6, 7, 8, 10, 12, 14]}
                />
                <ReferenceLine y={7} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.2} label={{ value: 'Equivalence', position: 'right', fill: '#475569', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl">
                          <p className="text-sm font-black text-white">pH {payload[0]?.value.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500">{payload[0]?.payload.v.toFixed(1)} mL toegevoegd</p>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ph"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChartAny>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
