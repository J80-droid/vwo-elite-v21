import { EliteTask, getTaskColor } from "@entities/planner/model/task";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  History,
} from "lucide-react";
import React, { useMemo } from "react";

/**
 * TimelineStage - Vertical Elite Journey
 *
 * Displays tasks in a chronological vertical flow.
 */
export const TimelineStage: React.FC = () => {
  const { tasks, toggleComplete, setSelectedTaskId } = usePlannerEliteStore();
  const { t } = useTranslations();

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Grouping Tasks
  const groupedTasks = useMemo(() => {
    const groups: {
      past: EliteTask[];
      today: EliteTask[];
      tomorrow: EliteTask[];
      upcoming: EliteTask[];
    } = {
      past: [],
      today: [],
      tomorrow: [],
      upcoming: [],
    };

    tasks
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((task) => {
        if (task.date < todayStr) {
          groups.past.push(task);
        } else if (task.date === todayStr) {
          groups.today.push(task);
        } else if (task.date === tomorrowStr) {
          groups.tomorrow.push(task);
        } else {
          groups.upcoming.push(task);
        }
      });

    return groups;
  }, [tasks, todayStr, tomorrowStr]);

  const hasTasks = tasks.length > 0;

  const renderTaskCard = (task: EliteTask) => {
    const color = getTaskColor(task);

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative flex gap-6 mb-8 group"
      >
        {/* Time Indicator */}
        <div className="flex flex-col items-center w-12 shrink-0">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">
            {task.startTime || "--:--"}
          </div>
          <button
            onClick={() => toggleComplete(task.id)}
            className={`
                            z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                            ${
                              task.completed
                                ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                : "bg-black border-slate-700 text-slate-500 group-hover:border-indigo-500 group-hover:text-indigo-400"
                            }
                        `}
          >
            {task.completed ? <CheckCircle2 size={12} /> : <Circle size={10} />}
          </button>
          <div className="flex-1 w-0.5 bg-gradient-to-b from-slate-800 to-transparent my-2 group-last:hidden" />
        </div>

        {/* Content Card */}
        <div
          onClick={() => setSelectedTaskId(task.id)}
          className={`
                        flex-1 p-5 rounded-3xl border backdrop-blur-md cursor-pointer transition-all duration-300 group-hover:scale-[1.01]
                        ${task.completed ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"}
                    `}
          style={!task.completed ? { borderLeft: `4px solid ${color}` } : {}}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <h4
                className={`text-lg font-bold leading-none ${task.completed ? "text-slate-400 line-through" : "text-white"}`}
              >
                {task.title}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                {task.subject && (
                  <span
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/40 tracking-widest"
                    style={{ color }}
                  >
                    {task.subject}
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} />
                  {task.duration} MIN
                </span>
              </div>
            </div>
            <div
              className={`p-2 rounded-xl bg-black/40 border border-white/5 ${task.completed ? "text-emerald-400" : "text-slate-400"}`}
            >
              {task.type === "exam" ? (
                <AlertCircle size={16} />
              ) : task.type === "homework" ? (
                <Bookmark size={16} />
              ) : (
                <GraduationCap size={16} />
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-slate-400 mt-2 line-clamp-2 italic">
              {task.description}
            </p>
          )}

          {/* Bottom Status */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i <= (task.priority === "critical" ? 3 : task.priority === "high" ? 2 : 1) ? "bg-indigo-500" : "bg-slate-800"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase group-hover:text-indigo-400 transition-colors">
              {t("common:details")} <ArrowRight size={10} />
            </div>
          </div>

          {/* Glow Effect */}
          {!task.completed && (
            <div
              className="absolute -inset-px blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full relative overflow-y-auto custom-scrollbar bg-black p-8 lg:p-12">
      {/* Header Area */}
      <div className="mb-12 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              {t("planner:modules.timeline")}
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">
              {t("planner:dashboard.layout.sync_active")}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
      </div>

      {!hasTasks ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-slate-500">
          <CalendarDays size={48} className="opacity-20 mb-4" />
          <p className="font-bold uppercase tracking-widest">
            {t("planner:timeline.no_tasks")}
          </p>
        </div>
      ) : (
        <div className="max-w-4xl">
          {/* Today Group */}
          {groupedTasks.today.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em]">
                  {t("planner:calendar.today")}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
              </div>
              {groupedTasks.today.map(renderTaskCard)}
            </div>
          )}

          {/* Tomorrow Group */}
          {groupedTasks.tomorrow.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">
                  {t("planner:timeline.tomorrow")}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
              </div>
              {groupedTasks.tomorrow.map(renderTaskCard)}
            </div>
          )}

          {/* Upcoming Group */}
          {groupedTasks.upcoming.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">
                  {t("planner:timeline.upcoming")}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
              </div>
              {groupedTasks.upcoming.map(renderTaskCard)}
            </div>
          )}

          {/* Past Group */}
          {groupedTasks.past.length > 0 && (
            <div className="mb-12 pt-12 border-t border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-[0.4em]">
                  {t("planner:timeline.past")}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-900 to-transparent" />
              </div>
              <div className="opacity-40 hover:opacity-100 transition-opacity duration-500">
                {groupedTasks.past.map(renderTaskCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Float Glow */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mb-48" />
    </div>
  );
};
