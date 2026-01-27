import { Award, BarChart3, Star, TrendingUp, Zap } from "lucide-react";
import React from "react";

import { useBiologyLabContext } from "../../hooks/useBiologyLabContext";

export const MasteryDashboard: React.FC = () => {
  const { globalSettings, activeModule } = useBiologyLabContext();
  const { mastery } = globalSettings;

  const bloomLevels = [
    {
      label: "Knowing",
      value: mastery.bloomLevels.Knowing,
      color: "from-blue-500 to-cyan-400",
    },
    {
      label: "Understanding",
      value: mastery.bloomLevels.Understanding,
      color: "from-cyan-500 to-emerald-400",
    },
    {
      label: "Applying",
      value: mastery.bloomLevels.Applying,
      color: "from-emerald-500 to-amber-400",
    },
    {
      label: "Analyzing",
      value: mastery.bloomLevels.Analyzing,
      color: "from-amber-500 to-orange-400",
    },
  ];

  const modules = [
    { id: "genomics", label: "Genomics", value: mastery.genomics },
    { id: "microscopy", label: "Microscopy", value: mastery.microscopy },
    { id: "ecology", label: "Ecology", value: mastery.ecology },
    { id: "physiology", label: "Physiology", value: mastery.physiology },
  ];

  const totalMastery = Math.round(
    (mastery.genomics +
      mastery.microscopy +
      mastery.ecology +
      mastery.physiology) /
      4,
  );

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Award className="text-amber-400" size={24} />
            Biologie Mastery
          </h2>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">
            Voortgang & Vaardigheden
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase">
              Totaal Score
            </div>
            <div className="text-2xl font-black text-white">
              {totalMastery}%
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center relative">
            <div
              className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-[spin_3s_linear_infinite]"
              style={{ clipPath: `inset(0 0 ${100 - totalMastery}% 0)` }}
            />
            <Star className="text-amber-400" size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module Mastery */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={14} /> Module Voortgang
          </h3>
          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`p-3 rounded-2xl border transition-all ${activeModule === mod.id ? "bg-white/10 border-white/20" : "bg-white/5 border-transparent"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-xs font-bold ${activeModule === mod.id ? "text-white" : "text-slate-400"}`}
                  >
                    {mod.label}
                  </span>
                  <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full">
                    {mod.value}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                    style={{ width: `${mod.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloom's Taxonomy */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} /> Bloom's Taxonomy Levels
          </h3>
          <div className="space-y-5 py-2">
            {bloomLevels.map((level) => (
              <div key={level.label} className="relative">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-slate-300 uppercase">
                    {level.label}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {Math.round(level.value)}%
                  </span>
                </div>
                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${level.color} transition-all duration-1000`}
                    style={{ width: `${level.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex gap-4 items-start">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          <Zap className="text-indigo-400" size={18} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-indigo-300 uppercase mb-1">
            Elite Tip
          </h4>
          <p className="text-[11px] text-indigo-300/70 leading-relaxed font-medium">
            Completeer Mastery Missies en beantwoord Examenvragen om je
            Bloom-levels te verhogen. Een score van 80%+ op alle levels duidt op
            VWO-klaarheid.
          </p>
        </div>
      </div>
    </div>
  );
};
