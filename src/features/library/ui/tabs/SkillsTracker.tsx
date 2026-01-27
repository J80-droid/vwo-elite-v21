import {
  Award,
  CheckCircle2,
  ChevronRight,
  Circle,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useMemo } from "react";

import { SUBJECT_THEME_CONFIG } from "../../types/library.types";

interface SkillsTrackerProps {
  subjectName: string;
  themeKey: string;
}

import { Skill, useSkillsStore } from "@shared/model/skillsStore";

import { SkillTreeGraph } from "./SkillTreeGraph";

export const SkillsTracker: React.FC<SkillsTrackerProps> = ({
  subjectName,
  themeKey,
}) => {
  const theme = SUBJECT_THEME_CONFIG[themeKey] ?? SUBJECT_THEME_CONFIG.default!;
  const { updateSkill, getSkills, calculateOverallMastery } = useSkillsStore();

  // Get skills for current subject from store
  // This will return default skills if not modified, or persistent state
  const subjectSkills = getSkills(subjectName);
  const overallMastery = calculateOverallMastery(subjectName);

  const [viewMode, setViewMode] = React.useState<"list" | "tree" | "pta">(
    "list",
  );

  // Group skills by category
  const groupedSkills = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    subjectSkills.forEach((skill) => {
      if (!groups[skill.category]) groups[skill.category] = [];
      groups[skill.category]!.push(skill);
    });
    return groups;
  }, [subjectSkills]);

  // Calculate PTA Stats
  const ptaStats = useMemo(() => {
    const skillsWithWeight = subjectSkills.filter((s) => s.ptaWeight > 0);
    const totalWeight = skillsWithWeight.reduce(
      (acc, s) => acc + s.ptaWeight,
      0,
    );
    const currentWeightedSum = skillsWithWeight.reduce(
      (acc, s) => acc + s.mastery * s.ptaWeight,
      0,
    );

    // Hypothetical grade (1-10) based on mastery
    // Mastery 0-100 maps to Grade 1.0-10.0
    const currentGrade =
      totalWeight > 0
        ? (currentWeightedSum / totalWeight / 10).toFixed(1)
        : "1.0";

    return {
      totalWeight,
      currentGrade,
      components: skillsWithWeight,
    };
  }, [subjectSkills]);

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-emerald-400";
    if (mastery >= 60) return "text-blue-400";
    if (mastery >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getMasteryBg = (mastery: number) => {
    if (mastery >= 80) return "bg-emerald-500";
    if (mastery >= 60) return "bg-blue-500";
    if (mastery >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header with Overall Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${theme.bg}`}>
            <Target size={24} className={theme.text} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Vaardigheden
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`text-[10px] font-bold uppercase tracking-widest ${viewMode === "list" ? "text-white underline" : "text-slate-500 hover:text-white"}`}
              >
                Lijst
              </button>
              <button
                onClick={() => setViewMode("tree")}
                className={`text-[10px] font-bold uppercase tracking-widest ${viewMode === "tree" ? "text-white underline" : "text-slate-500 hover:text-white"}`}
              >
                Boom
              </button>
              <button
                onClick={() => setViewMode("pta")}
                className={`text-[10px] font-bold uppercase tracking-widest ${viewMode === "pta" ? "text-white underline" : "text-slate-500 hover:text-white"}`}
              >
                PTA
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Overall Mastery Ring */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/5"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                className={getMasteryColor(overallMastery).replace(
                  "text-",
                  "text-",
                )}
                fill="none"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 * (1 - overallMastery / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-lg font-black ${getMasteryColor(overallMastery)}`}
              >
                {overallMastery}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Totaal
            </div>
            <div className="text-sm font-black text-white">
              {subjectSkills.length} Vaardigheden
            </div>
          </div>
        </div>
      </div>

      {/* Skills Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {viewMode === "list" && (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {category}
                  </h3>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {categorySkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-white/[0.02] border border-white/5 p-4 rounded-xl hover:bg-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => {
                      const newMastery = Math.min(100, skill.mastery + 10);
                      updateSkill(subjectName, skill.id, {
                        mastery: newMastery,
                      });
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {skill.mastery >= 80 ? (
                          <CheckCircle2
                            size={18}
                            className="text-emerald-400"
                          />
                        ) : skill.mastery > 0 ? (
                          <TrendingUp
                            size={18}
                            className={getMasteryColor(skill.mastery)}
                          />
                        ) : (
                          <Circle size={18} className="text-slate-600" />
                        )}
                        <span className="font-bold text-white text-sm">
                          {skill.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {skill.ptaWeight > 0 && (
                          <span className="text-[9px] text-slate-600 font-black uppercase bg-white/5 px-2 py-0.5 rounded">
                            {skill.ptaWeight}% PTA
                          </span>
                        )}
                        <span
                          className={`font-black text-sm ${getMasteryColor(skill.mastery)}`}
                        >
                          {skill.mastery}%
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-slate-700 group-hover:text-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getMasteryBg(skill.mastery)}`}
                        style={{ width: `${skill.mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {viewMode === "tree" && (
          <div className="h-full border border-white/10 rounded-2xl bg-black/20 overflow-hidden min-h-[500px] relative">
            <SkillTreeGraph subjectName={subjectName} />
          </div>
        )}

        {viewMode === "pta" && (
          <div className="h-full flex flex-col gap-6">
            {/* Grade Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Huidig Gewogen Gemiddelde
                </h3>
                <p className="text-white/60 text-xs">
                  Gebaseerd op beheersing van PTA onderdelen
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-black text-white">
                    {ptaStats.currentGrade}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                    Prognose
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Award size={32} className="text-purple-400" />
                </div>
              </div>
            </div>

            {/* PTA Components Table */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  PTA Onderdelen
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase">
                  Totaal Gewicht: {ptaStats.totalWeight}%
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Onderdeel</th>
                    <th className="p-4">Categorie</th>
                    <th className="p-4 text-center">Gewicht</th>
                    <th className="p-4 text-center">Beheersing</th>
                    <th className="p-4 text-right">Bijdrage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ptaStats.components.map((skill) => (
                    <tr
                      key={skill.id}
                      className="text-slate-300 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-4 font-medium text-white">
                        {skill.name}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {skill.category}
                      </td>
                      <td className="p-4 text-center font-mono text-xs">
                        {skill.ptaWeight}%
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-bold ${getMasteryColor(skill.mastery)}`}
                        >
                          {skill.mastery}%
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-slate-400">
                        {((skill.mastery * skill.ptaWeight) / 100).toFixed(1)}pt
                      </td>
                    </tr>
                  ))}
                  {ptaStats.components.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-slate-500 text-xs uppercase tracking-widest"
                      >
                        Geen PTA onderdelen gevonden voor dit vak
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            // Find lowest mastery skill
            const lowest = [...subjectSkills].sort(
              (a, b) => a.mastery - b.mastery,
            )[0];
            if (lowest) console.log("Training suggestion:", lowest.name);
          }}
          className={`p-4 rounded-2xl ${theme.bg} ${theme.border} border flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all`}
        >
          <Zap size={18} className={theme.text} />
          <span
            className={`font-bold text-sm uppercase tracking-widest ${theme.text}`}
          >
            Train Zwakste
          </span>
        </button>
        <button
          onClick={() => setViewMode("pta")}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
        >
          <Award size={18} className="text-amber-400" />
          <span className="font-bold text-sm uppercase tracking-widest text-slate-400">
            Bekijk PTA
          </span>
        </button>
      </div>
    </div>
  );
};
