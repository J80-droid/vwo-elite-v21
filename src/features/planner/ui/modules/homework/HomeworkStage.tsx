/**
 * HomeworkStage - Premium Elite Homework Management
 */
import { EliteTask, getTaskColor } from "@entities/planner/model/task";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Book,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Search,
  SearchX,
} from "lucide-react";
import React, { useMemo, useState } from "react";

export const HomeworkStage: React.FC = () => {
  const { tasks, toggleComplete, selectTask, selectedTaskId } =
    usePlannerEliteStore();
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "todo" | "done">("todo");

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0] || "";

  // Filter and Group homework tasks
  const filteredHomework = useMemo(() => {
    return tasks.filter(
      (t) =>
        (t.type === "homework" || t.type === "study") &&
        (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.subject?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filter === "all" || (filter === "todo" ? !t.completed : t.completed)),
    );
  }, [tasks, searchQuery, filter]);

  const groupedTasks = useMemo(() => {
    const groups = {
      overdue: [] as EliteTask[],
      today: [] as EliteTask[],
      tomorrow: [] as EliteTask[],
      upcoming: [] as EliteTask[],
      completed: [] as EliteTask[],
    };

    filteredHomework
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((task) => {
        if (task.completed) {
          groups.completed.push(task);
        } else if (task.date < todayStr) {
          groups.overdue.push(task);
        } else if (task.date === todayStr) {
          groups.today.push(task);
        } else if (task.date === tomorrowStr) {
          groups.tomorrow.push(task);
        } else {
          groups.upcoming.push(task);
        }
      });

    return groups;
  }, [filteredHomework, todayStr, tomorrowStr]);

  const hasTasks = filteredHomework.length > 0;

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden pt-20">
      {/* 1. ELITE HEADER & TOOLBAR */}
      <div className="p-8 pb-4 border-b border-white/5 relative bg-white/[0.01]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Book className="text-emerald-400" size={28} />
              {t("planner:modules.homework")}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {filteredHomework.length}{" "}
                {t("planner:modules.homework").toLowerCase()}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                {t("planner:dashboard.layout.sync_active")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder={t("planner:dashboard.homework.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-emerald-500/30 w-64 transition-all focus:bg-white/[0.08]"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
              {(["todo", "done", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all border ${
                    filter === f
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {t(`planner:dashboard.homework.filters.${f}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Atmosphere */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />
      </div>

      {/* 2. TASK LIST AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 relative">
        <AnimatePresence mode="popLayout">
          {!hasTasks ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[60vh] flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 relative">
                <SearchX className="w-12 h-12 text-slate-700" />
                <div className="absolute -inset-4 blur-3xl bg-emerald-500/5 -z-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t("planner:dashboard.homework.no_homework")}
              </h3>
              <p className="text-sm text-slate-500 max-w-xs">
                {t("planner:dashboard.homework.all_done")}
              </p>
            </motion.div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* OVERDUE SECTION */}
              {groupedTasks.overdue.length > 0 && (
                <div className="mb-10">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    {t("planner:dashboard.homework.overdue")}
                    <div className="h-px flex-1 bg-rose-500/20" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedTasks.overdue.map((task) => (
                      <HomeworkCard
                        key={task.id}
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        onToggle={() => toggleComplete(task.id)}
                        onClick={() => selectTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TODAY SECTION */}
              {groupedTasks.today.length > 0 && (
                <div className="mb-10">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    {t("planner:calendar.today")}
                    <div className="h-px flex-1 bg-emerald-400/20" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedTasks.today.map((task) => (
                      <HomeworkCard
                        key={task.id}
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        onToggle={() => toggleComplete(task.id)}
                        onClick={() => selectTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TOMORROW SECTION */}
              {groupedTasks.tomorrow.length > 0 && (
                <div className="mb-10">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    {t("planner:timeline.tomorrow")}
                    <div className="h-px flex-1 bg-indigo-400/20" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedTasks.tomorrow.map((task) => (
                      <HomeworkCard
                        key={task.id}
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        onToggle={() => toggleComplete(task.id)}
                        onClick={() => selectTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* UPCOMING SECTION */}
              {groupedTasks.upcoming.length > 0 && (
                <div className="mb-10">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    {t("planner:timeline.upcoming")}
                    <div className="h-px flex-1 bg-white/5" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedTasks.upcoming.map((task) => (
                      <HomeworkCard
                        key={task.id}
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        onToggle={() => toggleComplete(task.id)}
                        onClick={() => selectTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* COMPLETED SECTION (When filtering ALL) */}
              {filter === "all" && groupedTasks.completed.length > 0 && (
                <div className="mb-10 pt-10 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    {t("planner:dashboard.homework.filters.done")}
                    <div className="h-px flex-1 bg-white/5" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 hover:opacity-100 transition-opacity">
                    {groupedTasks.completed.map((task) => (
                      <HomeworkCard
                        key={task.id}
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        onToggle={() => toggleComplete(task.id)}
                        onClick={() => selectTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Atmosphere */}
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none -ml-48 -mb-48" />
    </div>
  );
};

interface HomeworkCardProps {
  task: EliteTask;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}

const HomeworkCard: React.FC<HomeworkCardProps> = ({
  task,
  isSelected,
  onToggle,
  onClick,
}) => {
  const { t } = useTranslations();
  const color = getTaskColor(task);

  // Determine if task is overdue
  const isOverdue =
    !task.completed &&
    task.date < (new Date().toISOString().split("T")[0] || "");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`
                group relative flex flex-col p-5 rounded-3xl border backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02]
                ${
                  isSelected
                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                }
                ${task.completed ? "opacity-60" : ""}
            `}
      style={!task.completed ? { borderLeft: `4px solid ${color}` } : {}}
    >
      {/* Header: Status + Subject */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
              task.completed
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-emerald-400 hover:border-emerald-500/30"
            }`}
          >
            {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>
          <div className="flex flex-col">
            <h3
              className={`font-black text-sm uppercase tracking-tight truncate max-w-[180px] ${task.completed ? "text-slate-500 line-through" : "text-white"}`}
            >
              {task.title}
            </h3>
            {task.subject && (
              <span
                className="text-[10px] font-black uppercase tracking-widest mt-1"
                style={{ color }}
              >
                {task.subject}
              </span>
            )}
          </div>
        </div>

        <div
          className={`p-2 rounded-xl bg-black/40 border border-white/5 ${isOverdue ? "text-rose-500 animate-pulse" : "text-slate-600"}`}
        >
          {isOverdue ? <AlertCircle size={16} /> : <Book size={16} />}
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-6 mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <Calendar size={12} className="text-emerald-400" />
          {task.date === new Date().toISOString().split("T")[0]
            ? t("planner:calendar.today")
            : task.date}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <Clock size={12} className="text-indigo-400" />
          {task.duration} MIN
        </div>
      </div>

      {/* Hover Indicator */}
      <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <ArrowRight size={16} className="text-emerald-400" />
      </div>

      {/* Glow Effect */}
      {!task.completed && (
        <div
          className="absolute -inset-px blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}
    </motion.div>
  );
};
