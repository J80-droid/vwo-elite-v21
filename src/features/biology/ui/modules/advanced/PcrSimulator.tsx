/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Info, Play, RotateCcw, Thermometer } from "lucide-react";
import React, { useEffect, useState } from "react";

export const PcrSimulator: React.FC = () => {
  const [cycle, setCycle] = useState(0);
  const [temp, setTemp] = useState(25);
  const [phase, setPhase] = useState<
    "IDLE" | "DENATURATION" | "ANNEALING" | "EXTENSION"
  >("IDLE");
  const [dnaCount, setDnaCount] = useState(1);
  const [running, setRunning] = useState(false);

  const phases = [
    {
      name: "DENATURATION",
      temp: 95,
      duration: 2000,
      desc: "DNA snaren splitsen",
    },
    {
      name: "ANNEALING",
      temp: 55,
      duration: 2000,
      desc: "Primers hechten aan",
    },
    {
      name: "EXTENSION",
      temp: 72,
      duration: 3000,
      desc: "Taq-polymerase bouwt nieuwe snaar",
    },
  ];

  useEffect(() => {
    let timer: any;
    if (running) {
      let currentPhaseIdx = 0;
      const runCycle = () => {
        if (currentPhaseIdx < phases.length) {
          const p = phases[currentPhaseIdx];
          if (p) {
            setPhase(p.name as any);
            setTemp(p.temp);
            timer = setTimeout(() => {
              currentPhaseIdx++;
              runCycle();
            }, p.duration);
          }
        } else {
          setCycle((prev) => prev + 1);
          setDnaCount((prev) => prev * 2);
          if (cycle < 30) {
            currentPhaseIdx = 0;
            runCycle();
          } else {
            setRunning(false);
            setPhase("IDLE");
          }
        }
      };
      runCycle();
    }
    return () => clearTimeout(timer);
  }, [running]);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 rounded-2xl border border-white/10 shadow-2xl overflow-hidden font-outfit">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            PCR Thermocycler
          </h2>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1 italic">
            Polymerase Chain Reaction
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCycle(0);
              setDnaCount(1);
              setRunning(false);
              setPhase("IDLE");
              setTemp(25);
            }}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <RotateCcw size={16} className="text-slate-400" />
          </button>
          <button
            onClick={() => setRunning(true)}
            disabled={running}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${running ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-orange-600 border-orange-400 text-white font-bold uppercase text-xs hover:scale-105 shadow-lg shadow-orange-600/20"}`}
          >
            <Play size={16} />
            {running ? "Cycleren..." : "Start PCR"}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6">
        {/* Left: Status & Thermo */}
        <div className="bg-black/40 rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div
            className={`absolute inset-0 opacity-20 transition-colors duration-1000 ${temp > 90 ? "bg-red-500" : temp > 60 ? "bg-orange-500" : "bg-blue-500"}`}
          />
          <Thermometer
            size={48}
            className={`mb-4 transition-colors ${temp > 90 ? "text-red-500" : "text-blue-400"}`}
          />
          <div className="text-4xl font-black text-white font-mono tabular-nums mb-1">
            {temp}°C
          </div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {phase}
          </div>

          <div className="mt-8 w-full space-y-2">
            {phases.map((p) => (
              <div
                key={p.name}
                className={`flex items-center justify-between p-2 rounded-lg border text-[10px] font-bold ${phase === p.name ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-slate-600"}`}
              >
                <span>{p.name}</span>
                <span>{p.temp}°C</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Growth & Counter */}
        <div className="flex flex-col gap-6">
          <div className="bg-black/40 rounded-xl border border-white/5 p-6 flex-1 flex flex-col justify-center items-center">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              DNA Kopieën
            </div>
            <div className="text-5xl font-black text-emerald-500 font-mono tracking-tighter italic">
              {dnaCount.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
              Cycle <span className="text-white font-bold">{cycle}</span> / 30
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-start gap-3">
            <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {phases.find((p) => p.name === phase)?.desc ||
                "Klaar om te amplificeren. PCR maakt miljoenen kopieën van een specifiek DNA-fragment."}
            </p>
          </div>
        </div>
      </div>

      {/* Growth Graph Bar */}
      <div className="mt-6 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
          style={{ width: `${(cycle / 30) * 100}%` }}
        />
      </div>
    </div>
  );
};
