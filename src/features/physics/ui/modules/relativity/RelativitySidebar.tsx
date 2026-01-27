import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  Download,
  Eraser,
  Grid3X3,
  Lightbulb,
  Move,
  Plus,
  RefreshCw,
  Table2,
  Triangle,
} from "lucide-react";
import React, { useState } from "react";

import {
  lengthContraction,
  lorentzTransform,
  RELATIVITY_SCENARIOS,
  timeDilation,
  useRelativityEngine,
} from "./useRelativityEngine";

interface ToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  color: "amber" | "slate" | "rose" | "cyan" | "emerald";
}

const Toggle = ({ label, active, onClick, icon, color }: ToggleProps) => {
  return (
    <button
      onClick={onClick}
      className={`btn-elite-neon btn-elite-neon-${color} ${active ? "active shadow-lg" : "opacity-60 hover:opacity-100"}`}
      style={{ padding: "6px 12px", height: "auto" }}
    >
      {icon}
      {label}
    </button>
  );
};

type LabTab = "calculator" | "events" | "scenarios" | "export";

export const RelativitySidebar: React.FC = () => {
  const engine = useRelativityEngine();
  const [activeTab, setActiveTab] = useState<LabTab | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculator state
  const [calcProperTime, setCalcProperTime] = useState(1);
  const [calcRestLength, setCalcRestLength] = useState(10);

  const tabs: { id: LabTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "calculator",
      label: "Calculator",
      icon: <Calculator className="w-3.5 h-3.5" />,
    },
    { id: "events", label: "Events", icon: <Table2 className="w-3.5 h-3.5" /> },
    {
      id: "scenarios",
      label: "Scenario's",
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      id: "export",
      label: "Export",
      icon: <Download className="w-3.5 h-3.5" />,
    },
  ];

  const toggleTab = (tabId: LabTab) => {
    if (activeTab === tabId && isExpanded) {
      setIsExpanded(false);
      setActiveTab(null);
    } else {
      setActiveTab(tabId);
      setIsExpanded(true);
    }
  };

  const exportToCSV = () => {
    const headers = ["Label", "x", "ct", "x'", "ct'", "Interval", "Type"];
    const rows = engine.events.map((e) => {
      const transformed = lorentzTransform(e.x, e.t, engine.beta);
      const interval = e.t * e.t - e.x * e.x;
      const type =
        interval > 0 ? "timelike" : interval < 0 ? "spacelike" : "lightlike";
      return [
        e.label,
        e.x.toFixed(3),
        e.t.toFixed(3),
        transformed.x.toFixed(3),
        transformed.t.toFixed(3),
        interval.toFixed(3),
        type,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relativity_events_beta_${engine.beta.toFixed(2)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4 pointer-events-none w-full max-w-[98vw]">
      {/* 1. Expandable Panel (Slide-up) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto w-full max-w-5xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-rose-500/50 blur-xl" />

            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                {activeTab}
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto max-h-[50vh]">
              {activeTab === "calculator" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-emerald-400">
                      Tijddilatatie
                    </h4>
                    <input
                      type="number"
                      value={calcProperTime}
                      onChange={(e) =>
                        setCalcProperTime(parseFloat(e.target.value))
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-emerald-500/50"
                    />
                    <div className="text-3xl font-mono text-emerald-400">
                      {timeDilation(calcProperTime, engine.gamma).toFixed(4)} s
                    </div>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-cyan-400">
                      Lengtecontractie
                    </h4>
                    <input
                      type="number"
                      value={calcRestLength}
                      onChange={(e) =>
                        setCalcRestLength(parseFloat(e.target.value))
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-cyan-500/50"
                    />
                    <div className="text-3xl font-mono text-cyan-400">
                      {lengthContraction(calcRestLength, engine.gamma).toFixed(
                        4,
                      )}{" "}
                      ls
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "events" && (
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <button
                      onClick={() =>
                        engine.setParam("isEventBuilderOpen", true)
                      }
                      className="btn-elite-neon btn-elite-neon-rose p-4"
                    >
                      <Plus className="w-4 h-4" /> Add Event
                    </button>
                    <button
                      onClick={engine.clearEvents}
                      className="btn-elite-neon btn-elite-neon-slate p-4"
                    >
                      <Eraser className="w-4 h-4" /> Clear
                    </button>
                  </div>
                  <div className="bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-white/5 text-slate-500 uppercase font-black">
                        <tr>
                          <th className="p-4">Label</th>
                          <th className="p-4 text-right text-rose-400">x'</th>
                          <th className="p-4 text-right text-rose-400">ct'</th>
                          <th className="p-4 text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {engine.events.map((e) => {
                          const tr = lorentzTransform(e.x, e.t, engine.beta);
                          const s2 = e.t * e.t - e.x * e.x;
                          const type =
                            s2 > 0
                              ? "timelike"
                              : s2 < 0
                                ? "spacelike"
                                : "lightlike";
                          return (
                            <tr key={e.id} className="hover:bg-white/5">
                              <td className="p-4 font-bold text-white">
                                {e.label}
                              </td>
                              <td className="p-4 text-right font-mono text-rose-400">
                                {tr.x.toFixed(2)}
                              </td>
                              <td className="p-4 text-right font-mono text-rose-400">
                                {tr.t.toFixed(2)}
                              </td>
                              <td className="p-4 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-[10px] uppercase font-black ${type === "timelike" ? "bg-emerald-500/20 text-emerald-400" : type === "spacelike" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}
                                >
                                  {type}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "scenarios" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RELATIVITY_SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => engine.loadScenario(s.id)}
                      className={`p-6 rounded-3xl border text-left transition-all ${engine.activeScenarioId === s.id ? "bg-rose-500/10 border-rose-500/50 shadow-lg" : "bg-white/5 border-white/10 hover:border-white/20"}`}
                    >
                      <h4 className="font-black text-white uppercase mb-2">
                        {s.name}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {s.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "export" && (
                <div className="flex flex-col items-center gap-6 py-12">
                  <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-2xl">
                    <Download className="w-10 h-10 text-rose-400" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">
                    Export Relativity Data
                  </h4>
                  <button
                    onClick={exportToCSV}
                    className="btn-elite-neon btn-elite-neon-rose !py-6 !px-12 !text-base"
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Pill Bar */}
      <motion.div
        layout
        className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-3xl border border-white/10 p-2.5 rounded-[2.5rem] shadow-2xl w-fit origin-bottom transition-transform duration-300 scale-[0.8] sm:scale-95 lg:scale-100 select-none"
      >
        {/* VELOCITY SECTION */}
        <div className="flex items-center gap-4 px-4 border-r border-white/10">
          <div className="w-24 space-y-1">
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
              <span>BETA</span>{" "}
              <span className="text-rose-400">{engine.beta.toFixed(2)}c</span>
            </div>
            <input
              type="range"
              min="-0.99"
              max="0.99"
              step="0.01"
              value={engine.beta}
              onChange={(e) => engine.setBeta(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-rose-500"
            />
          </div>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[8px] text-slate-600 font-black mb-1">γ</span>
            <span className="text-sm font-mono font-black text-rose-400">
              {engine.gamma.toFixed(2)}
            </span>
          </div>
        </div>

        {/* TOGGLES SECTION */}
        <div className="flex items-center gap-2 px-2">
          <Toggle
            label="CONE"
            active={engine.showLightCone}
            onClick={() => engine.toggleFeature("showLightCone")}
            icon={<Triangle className="w-3 h-3" />}
            color="amber"
          />
          <Toggle
            label="GRID"
            active={engine.showGrid}
            onClick={() => engine.toggleFeature("showGrid")}
            icon={<Grid3X3 className="w-3 h-3" />}
            color="slate"
          />
          <Toggle
            label="S'"
            active={engine.showLorentzAxes}
            onClick={() => engine.toggleFeature("showLorentzAxes")}
            icon={<Move className="w-3 h-3" />}
            color="rose"
          />
          <Toggle
            label="WORLD"
            active={engine.showWorldlines}
            onClick={() => engine.toggleFeature("showWorldlines")}
            icon={<Lightbulb className="w-3 h-3" />}
            color="cyan"
          />
        </div>

        {/* TABS SECTION */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => toggleTab(tab.id)}
              className={`p-2.5 rounded-2xl transition-all ${activeTab === tab.id && isExpanded ? "bg-rose-500 text-white shadow-[0_0_15px_#f43f5e]" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
            >
              {tab.icon}
            </button>
          ))}
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={engine.reset}
            className="p-2.5 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-white/5"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
