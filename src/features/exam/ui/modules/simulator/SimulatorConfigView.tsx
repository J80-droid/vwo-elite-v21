import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Sparkles,
} from "lucide-react";
import React, { useMemo } from "react";

import { useSimulatorState } from "./useSimulatorState";

export const SimulatorConfigView: React.FC = () => {
  const { data, update } = useSimulatorState();

  // Filter exams by selected subject
  const availableExams = useMemo(() => {
    if (!data.selectedSubject) return [];
    return (data.exams || [])
      .filter((e) => e.subject === data.selectedSubject)
      .sort((a, b) => Number(b.year) - Number(a.year)); // Newest first
  }, [data.exams, data.selectedSubject]);

  // Group by era/type if needed, or just list
  // For now simple list

  const handleStart = () => {
    if (data.selectedExam) {
      update({ simState: "idle", questionLabel: "", studentAnswer: "" });
    }
  };

  return (
    <div className="w-full h-full relative overflow-y-auto custom-scrollbar p-12 flex flex-col items-center animate-in fade-in duration-500">
      {/* Unified Config Machine */}
      <div className="w-full max-w-6xl bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col shrink-0">
        {/* Header & Topic Column */}
        <div className="p-10 md:p-14 border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <FileText size={12} />
                <span>Official Exams</span>
              </div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter lg:text-7xl">
                Examen{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Simulator
                </span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl font-light leading-relaxed">
                Oefen met officiële eindexamens in een realistische omgeving.
                Kies je vak en jaar om te starten.
              </p>
            </div>

            {/* Subject Selection */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <div className="w-8 h-[1px] bg-slate-800" />
                Selecteer Vakgebied
              </div>
              <div className="flex flex-wrap gap-2">
                {INITIAL_SUBJECTS.map((subject) => {
                  // Map internal subject selection to the format used in exams index if needed
                  // Assuming data.exams uses similar names or we map them.
                  // For now, let's select based on 'legacyName' or 'id' matching data.exams 'subject' field
                  // But data.exams usually has proper names like "Natuurkunde".
                  // Let's rely on INITIAL_SUBJECTS IDs mapping to ExamIndexEntry.subject or similar.

                  // Check if this subject actually has exams available
                  const hasExams = (data.exams || []).some(
                    (e) =>
                      e.subject === subject.legacyName ||
                      e.subject === subject.name,
                  );
                  if (!hasExams) return null;

                  const isSelected =
                    data.selectedSubject === subject.legacyName ||
                    data.selectedSubject === subject.name;

                  const subjectThemes: Record<string, string> = {
                    blue: "bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
                    red: "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
                    yellow:
                      "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                    orange:
                      "bg-orange-500/20 border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]",
                    purple:
                      "bg-violet-500/20 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
                    cyan: "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
                    pink: "bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]",
                    emerald:
                      "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                  };
                  const activeClass =
                    subjectThemes[subject.theme] || subjectThemes.blue;

                  return (
                    <button
                      key={subject.id}
                      onClick={() =>
                        update({
                          selectedSubject: subject.legacyName,
                          selectedExam: null,
                        })
                      } // Reset exam on subject change
                      className={`px-4 py-2 rounded-xl text-[11px] font-black border transition-all duration-500 ${
                        isSelected
                          ? activeClass
                          : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {subject.legacyName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-10 md:px-14 py-6 md:py-8 space-y-8 min-h-[400px]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <BookOpen size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Beschikbare Examens
                </h3>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                  {data.selectedSubject
                    ? `${availableExams.length} Resultaten`
                    : "Selecteer een vak"}
                </span>
              </div>
            </div>

            {data.selectedSubject ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableExams.map((exam) => {
                  const isSelected = data.selectedExam?.id === exam.id;
                  return (
                    <button
                      key={exam.id}
                      onClick={() => update({ selectedExam: exam })}
                      className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 ${
                        isSelected
                          ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/5 rounded-xl text-slate-300 group-hover:text-white transition-colors">
                          <Calendar size={20} />
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-2xl font-black text-white">
                          {exam.year}
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {exam.term || exam.period}e Tijdvak
                        </div>
                      </div>

                      {/* Hover Arrow */}
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        <ChevronRight size={16} className="text-blue-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4 border border-dashed border-white/10 rounded-3xl">
                <BookOpen size={48} className="opacity-20" />
                <p className="uppercase tracking-widest font-bold text-sm">
                  Kies eerst een vakgebied
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-6 pb-8 border-t border-white/5 flex flex-col items-center gap-8 bg-black/20">
          <button
            onClick={handleStart}
            disabled={!data.selectedExam}
            className="group relative px-20 py-8 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-2xl font-black rounded-[3rem] transition-all duration-700 shadow-[0_0_50px_rgba(59,130,246,0.2)] hover:shadow-[0_0_80px_rgba(59,130,246,0.5)] hover:bg-blue-500/20 hover:scale-105 active:scale-95 flex items-center gap-6 disabled:opacity-20 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed overflow-hidden w-full max-w-2xl justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out" />
            <Sparkles className="w-8 h-8 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110" />
            <span className="uppercase tracking-[0.2em]">Start Examen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
