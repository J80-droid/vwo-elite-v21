import { generateRetrogradeplan } from "@shared/api/retrogradeEngine";
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";

/**
 * Tasks Module - Upgraded to Elite Logic
 *
 * Replaces the legacy localStorage plan with the persistent SQLite-backed
 * EliteTask format.
 */

export const TasksInput: React.FC = () => {
  const {
    addTasks,
    settings,
    generatorSubject: subject,
    setGeneratorSubject: setSubject,
    generatorExamDate: examDate,
    setGeneratorExamDate: setExamDate,
  } = usePlannerEliteStore();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslations();

  const subjects = INITIAL_SUBJECTS.map((s) => ({
    key: s.id,
    label: t(s.name, s.legacyName),
  }));

  const handleGenerate = async () => {
    if (!subject || !examDate) return;
    setLoading(true);
    try {
      const result = generateRetrogradeplan(
        {
          title: `${subject} Proefwerk`,
          subject: subject,
          date: examDate,
          weight: 1,
        },
        settings.region,
      );

      await addTasks(result.sessions);
      alert(
        t("planner:dashboard.gen_success", { count: result.sessions.length }),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={12} /> {t("planner:dashboard.generator_title")}
        </label>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-400 mb-1 block">
              {t("planner:subject")}
            </span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 [&>option]:bg-obsidian-900"
            >
              <option value="">{t("planner:dashboard.choose_subject")}</option>
              {subjects.map((s) => (
                <option key={s.key} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-xs text-slate-400 mb-1 block">
              {t("planner:dashboard.exam_date_label")}
            </span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 [color-scheme:dark]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !subject || !examDate}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading
              ? t("planner:loading")
              : t("planner:dashboard.btn_generate")}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const TasksParams: React.FC = () => {
  return (
    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest p-4 italic">
      Heuristics: Spaced Repetition v2.0
    </div>
  );
};

export const TasksResults: React.FC = () => {
  return (
    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest p-4 italic">
      Ready for deep work.
    </div>
  );
};

export const TasksStage: React.FC = () => {
  const { tasks, toggleComplete, deleteTask } = usePlannerEliteStore();
  const { t } = useTranslations();

  // Show study and review tasks
  const filteredTasks = tasks
    .filter((t) => t.type === "study" || t.type === "review")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filteredTasks.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-4 opacity-30">
        <ListTodo size={64} strokeWidth={1} />
        <p className="text-xs font-black uppercase tracking-[0.2em]">
          {t("planner:dashboard.no_missions")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-12 custom-scrollbar bg-black/40">
      <div className="max-w-4xl mx-auto space-y-6 pb-32">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {t("planner:dashboard.planned_missions")}
          </h2>
          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {t("planner:dashboard.sessions_count", {
              count: filteredTasks.length,
            })}
          </span>
        </div>

        <div className="space-y-3">
          {filteredTasks.map((item) => {
            const isUrgent =
              item.priority === "high" || item.priority === "critical";
            return (
              <div
                key={item.id}
                className={`group p-6 rounded-3xl border flex items-center justify-between transition-all duration-300 relative ${
                  item.completed
                    ? "bg-emerald-900/10 border-emerald-500/20 opacity-50"
                    : isUrgent
                      ? "bg-red-900/5 border-red-500/30 hover:border-red-500/50"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      item.completed
                        ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        : "border-slate-700 hover:border-indigo-500"
                    }`}
                  >
                    {item.completed && (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <div>
                    <h4
                      className={`text-lg font-bold tracking-tight ${item.completed ? "line-through text-slate-600" : "text-white"}`}
                    >
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />{" "}
                        {item.subject}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {item.duration}m
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" /> {item.date}
                      </span>
                      {isUrgent && (
                        <span className="text-red-400 animate-pulse">
                          ! {t("planner:dashboard.urgent")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(t("planner:dashboard.delete_confirm"))) {
                      deleteTask(item.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-700 hover:text-red-400 transition-all p-3 rounded-2xl hover:bg-red-500/5"
                  title={t("common:delete")}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
