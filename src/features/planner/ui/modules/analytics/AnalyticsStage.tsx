/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnergyForSubject } from "@entities/planner/model/task";
import { useBioRhythmStore } from "@shared/model/bioRhythmStore";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const BarChartAny = BarChart as any;
const PieChartAny = PieChart as any;

export const AnalyticsStage: React.FC = () => {
  const { tasks } = usePlannerEliteStore();
  const { focusScore } = useBioRhythmStore();

  // Stats Calculation
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionRate = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const totalMinutes = tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Subject Breakdown
    const subjectMap: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.subject) {
        const sub = t.subject.charAt(0).toUpperCase() + t.subject.slice(1);
        subjectMap[sub] = (subjectMap[sub] || 0) + (t.duration || 0);
      }
    });

    const subjectData = Object.entries(subjectMap)
      .map(([name, minutes]) => ({
        name,
        hours: Math.round((minutes / 60) * 10) / 10,
        color: getEnergyColor(getEnergyForSubject(name)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8); // Top 8

    const overdueCount = tasks.filter(
      (t) =>
        t.date < (new Date().toISOString().split("T")[0] || "") && !t.completed,
    ).length;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      totalHours,
      subjectData,
      overdueCount,
    };
  }, [tasks]);

  return (
    <div className="h-full bg-gradient-to-br from-obsidian-950 to-black p-8 pt-24 text-white overflow-y-auto custom-scrollbar">
      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-8 uppercase tracking-tighter">
        Productivity Analytics
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={CheckCircle2}
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          sub={`${stats.completedTasks}/${stats.totalTasks} tasks`}
          color="text-emerald-400"
          borderColor="border-emerald-500/20"
        />
        <KpiCard
          icon={Clock}
          label="Total Study Time"
          value={`${stats.totalHours}h`}
          sub="All time"
          color="text-blue-400"
          borderColor="border-blue-500/20"
        />
        <KpiCard
          icon={TrendingUp}
          label="Focus Score"
          value={(focusScore / 10).toFixed(1)}
          sub="Real-time Bio-Rhythm"
          color="text-amber-400"
          borderColor="border-amber-500/20"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Overdue"
          value={stats.overdueCount.toString()}
          sub="Action needed"
          color="text-red-400"
          borderColor="border-red-500/20"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-violet-500 rounded-full" />
            Hours per Subject
          </h3>
          <div className="h-80 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChartAny
                data={stats.subjectData}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.subjectData.map((entry, _index) => (
                    <Cell key={`cell-${_index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChartAny>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-500 rounded-full" />
            Task Distribution
          </h3>
          <div className="h-80 w-full flex items-center justify-center relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChartAny>
                <Pie
                  data={[
                    {
                      name: "Completed",
                      value: stats.completedTasks,
                      color: "#10b981",
                    },
                    {
                      name: "Pending",
                      value: stats.totalTasks - stats.completedTasks,
                      color: "#334155",
                    },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {[
                    {
                      name: "Completed",
                      value: stats.completedTasks,
                      color: "#10b981",
                    },
                    {
                      name: "Pending",
                      value: stats.totalTasks - stats.completedTasks,
                      color: "#334155",
                    },
                  ].map((entry, _index) => (
                    <Cell key={`cell-${_index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
              </PieChartAny>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-white">
                {stats.completionRate}%
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-widest">
                Done
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utils
const KpiCard: React.FC<{
  icon: any;
  label: string;
  value: string;
  sub: string;
  color: string;
  borderColor: string;
}> = ({ icon: Icon, label, value, sub, color, borderColor }) => (
  <div
    className={`bg-white/5 border ${borderColor} rounded-xl p-4 flex items-start justify-between hover:bg-white/10 transition-colors`}
  >
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
    </div>
    <div className={`p-2 rounded-lg bg-black/20 ${color}`}>
      <Icon size={20} />
    </div>
  </div>
);

function getEnergyColor(level: string) {
  if (level === "high") return "#ef4444"; // Red
  if (level === "medium") return "#f59e0b"; // Amber
  return "#3b82f6"; // Blue
}
