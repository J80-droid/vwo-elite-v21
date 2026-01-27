/**
 * PWStage - Premium Elite PWS Project Management
 */
import { EliteTask } from "@entities/planner/model/task";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  StickyNote,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { PWSResearchToolkit } from "./PWSResearchToolkit";

export const PWStage: React.FC = () => {
  const { t } = useTranslations();
  const { tasks } = usePlannerEliteStore();
  const [activeView, setActiveView] = useState<"timeline" | "logbook">(
    "timeline",
  );

  // Filter PWS related tasks (milestones)
  const pwsTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.type === "pws" || t.pwsProjectId)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    [tasks],
  );

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden pt-20">
      {/* 1. ELITE HEADER */}
      <div className="p-8 border-b border-white/5 relative bg-white/[0.01]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-rose-500 rounded-full" />
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                {t("planner:modules.pws")}
              </h2>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-5">
              {t("planner:pws_toolkit.craft_masterpiece")}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end group">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 group-hover:text-rose-500 transition-colors">
                Phase
              </span>
              <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] leading-none">
                  RESEARCH
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">
                Deadline
              </span>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                <Clock size={12} className="text-slate-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                  124 DAYS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Perspective Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] pointer-events-none rounded-full" />
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:flex-row divide-x divide-white/5 overflow-hidden">
        {/* Left Side: Timeline & Logbook */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/[0.01]">
          {/* TIMELINE / LOGBOOK SWITCHER */}
          <div className="flex items-center px-8 py-4 gap-6 border-b border-white/5 bg-black/20">
            <button
              onClick={() => setActiveView("timeline")}
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 ${activeView === "timeline" ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              <CalendarIcon
                size={14}
                className={activeView === "timeline" ? "text-rose-500" : ""}
              />
              Milestone Timeline
            </button>
            <button
              onClick={() => setActiveView("logbook")}
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 ${activeView === "logbook" ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              <BookOpen
                size={14}
                className={activeView === "logbook" ? "text-emerald-500" : ""}
              />
              Logbook Insights
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <AnimatePresence mode="wait">
              {activeView === "timeline" ? (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-12"
                >
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-12">
                    Project Journey
                  </h3>

                  <div className="relative pl-8 space-y-12">
                    {/* Vertical Timeline Path */}
                    <div className="absolute left-[3.5px] top-4 bottom-4 w-px bg-gradient-to-b from-rose-500/50 via-rose-500/20 to-transparent" />

                    {pwsTasks.length === 0 ? (
                      <div className="text-slate-500 italic text-sm py-12">
                        No milestones added yet. Add a task with type "PWS" to
                        see it here.
                      </div>
                    ) : (
                      pwsTasks.map((task) => (
                        <TimelineItem key={task.id} task={task} />
                      ))
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logbook"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-12"
                >
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
                      Logbook Snippets
                    </h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest transition-all">
                      <Plus size={14} /> New Entry
                    </button>
                  </div>

                  <div className="space-y-6">
                    <LogEntry
                      date="02 JAN 2026"
                      text="Begonnen met bronnenonderzoek voor de inleiding. Focus op GPT-4o architectuur en de impact op onderwijs."
                      type="research"
                    />
                    <LogEntry
                      date="28 DEC 2025"
                      text="Hoofdvraag definitief gemaakt: In hoeverre kan AI de rol van de docent overnemen in het VWO onderwijs?"
                      type="milestone"
                    />
                    <LogEntry
                      date="20 DEC 2025"
                      text="Brainstorm sessie met begeleider. Interessante invalshoek gevonden over ethische kaders van LLM in de klas."
                      type="meeting"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visual Atmosphere */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] pointer-events-none rounded-full" />
          </div>
        </div>

        {/* Right Side: Toolkit */}
        <div className="w-full md:w-[400px] bg-black/40 xl:w-[450px]">
          <PWSResearchToolkit />
        </div>
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{ task: EliteTask }> = ({ task }) => {
  const isPast = new Date(task.date) < new Date();

  return (
    <motion.div
      whileHover={{ x: 10 }}
      className="relative flex items-start gap-8 group"
    >
      {/* Marker */}
      <div
        className={`mt-1.5 w-2 h-2 rounded-full z-10 transition-all duration-500 relative ${
          task.completed
            ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            : isPast
              ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
              : "bg-slate-700 group-hover:bg-rose-400"
        }`}
      >
        {task.completed && (
          <div className="absolute inset-0 bg-emerald-500 blur-md opacity-50" />
        )}
        {!task.completed && isPast && (
          <div className="absolute inset-[-4px] border border-rose-500/30 rounded-full animate-ping" />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono">
            {task.date}
          </span>
          {task.completed && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest leading-none pt-0.5">
                Voltooid
              </span>
            </div>
          )}
        </div>

        <div
          className={`p-6 rounded-3xl border transition-all duration-500 ${
            task.completed
              ? "bg-emerald-500/[0.03] border-emerald-500/10"
              : isPast
                ? "bg-rose-500/[0.03] border-rose-500/10"
                : "bg-white/[0.03] border-white/5 group-hover:bg-white/[0.05] group-hover:border-white/10"
          }`}
        >
          <h4
            className={`text-lg font-black uppercase tracking-tight group-hover:text-rose-400 transition-colors ${
              task.completed ? "text-emerald-300" : "text-white"
            }`}
          >
            {task.title}
          </h4>
          {task.subject && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {task.subject}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LogEntry: React.FC<{ date: string; text: string; type: string }> = ({
  date,
  text,
  type,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 hover:bg-white/[0.04] transition-all relative overflow-hidden group"
    >
      <div className="flex justify-between items-center relative z-10">
        <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest">
          {date}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
            {type}
          </span>
          <StickyNote className="w-3 h-3 text-slate-700 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
      <p className="text-sm text-slate-300 italic leading-relaxed relative z-10">
        "{text}"
      </p>

      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-all" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};
