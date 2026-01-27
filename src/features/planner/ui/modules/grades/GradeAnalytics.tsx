import { GradeStats } from "@shared/lib/gradeCalculations";
import { Info, TrendingUp } from "lucide-react";
import React from "react";

const PerformanceInsights: React.FC<{ stats: GradeStats }> = ({ stats }) => {
  // No more calculation needed here!
  if (!stats.bestSubject) return null;

  return (
    <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4">
      <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
        <TrendingUp size={18} />
      </div>
      <div>
        <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
          Elite Insights
        </h5>
        <p className="text-xs text-slate-400 leading-relaxed">
          Je bent het sterkst in{" "}
          <span className="text-white font-bold">
            {stats.bestSubject.subject}
          </span>{" "}
          met een{" "}
          <span className="text-emerald-400 font-bold">
            {stats.bestSubject.average.toFixed(1)}
          </span>
          . Er staan nu{" "}
          <span className="text-white font-bold">{stats.totalGrades}</span>{" "}
          resultaten in je overzicht.
        </p>
      </div>
    </div>
  );
};

export const GradeAnalytics: React.FC<{ stats: GradeStats }> = ({ stats }) => {
  // Check totalGrades directly
  if (stats.totalGrades === 0)
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-black/20 border border-white/5 rounded-3xl text-center">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <span className="text-slate-600">
            <Info size={20} />
          </span>
        </div>
        <h5 className="text-sm font-bold text-slate-400 mb-1">
          Geen analytische data
        </h5>
        <p className="text-[10px] text-slate-600 max-w-[200px]">
          Voeg cijfers toe in het Cijferoverzicht om je radar te vullen.
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <PerformanceInsights stats={stats} />
    </div>
  );
};
