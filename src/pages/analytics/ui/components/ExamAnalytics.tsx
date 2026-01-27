import { useExamStore } from "@shared/model/examStore";
import { useQuizProgressStore } from "@shared/model/quizProgressStore";
import { FileCheck, GraduationCap, History, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";

export const ExamAnalytics: React.FC = () => {
  const { history } = useQuizProgressStore();
  const { attempts } = useExamStore();

  // Unified Result List
  const unifiedResults = useMemo(() => {
    // 1. Process Quiz History
    const quizItems = history.map((result) => {
      let subjectName = "Algemeen";
      if (typeof result.subject === "string") {
        subjectName = result.subject;
      } else if (result.subject && typeof result.subject === "object") {
        const subj = result.subject as { legacyName?: string; name?: string };
        subjectName = subj.legacyName || subj.name || "Algemeen";
      }

      // Normalize score to 1-10
      const grade =
        result.totalQuestions > 0
          ? (result.score / result.totalQuestions) * 10
          : 0;

      return {
        id: result.id,
        type: "quiz",
        subject: subjectName,
        name: result.topic || "Oefensessie", // e.g. "Practice"
        score: grade,
        dateObj: new Date(result.date),
        date: new Date(result.date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
        }),
        status: grade >= 5.5 ? "passed" : "warning",
      };
    });

    // 2. Process Simulator Attempts
    const simItems = attempts.map((attempt) => {
      // attempts.score is 0-100 (AI score)
      // Normalize to 1-10
      const grade = attempt.score / 10;

      return {
        id: attempt.id,
        type: "simulator",
        subject: attempt.subject,
        name: `Examen ${attempt.year} - ${attempt.questionLabel}`,
        score: grade,
        dateObj: new Date(attempt.date),
        date: new Date(attempt.date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
        }),
        status: grade >= 5.5 ? "passed" : "warning",
      };
    });

    // Merge and sort newest first
    return [...quizItems, ...simItems].sort(
      (a, b) => b.dateObj.getTime() - a.dateObj.getTime(),
    );
  }, [history, attempts]);

  // Recalculate Stats including Simulator data
  const analyticsStats = useMemo(() => {
    const totalItems = unifiedResults.length;
    if (totalItems === 0) return { average: 0, count: 0 };

    const sumGrades = unifiedResults.reduce((acc, item) => acc + item.score, 0);
    return {
      average: sumGrades / totalItems,
      count: totalItems,
    };
  }, [unifiedResults]);

  const STATS = [
    {
      label: "Gemiddeld Cijfer",
      value: analyticsStats.average.toFixed(1),
      icon: TrendingUp,
      color: "emerald",
    },
    {
      label: "Gemaakte Oefeningen",
      value: analyticsStats.count.toString(),
      icon: FileCheck,
      color: "blue",
    },
    // Placeholder for study hours until we track time better globally
    { label: "Studieuren", value: "N/A", icon: History, color: "purple" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Intro */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <GraduationCap size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Examen Resultaten
          </h2>
          <p className="text-slate-400">
            Overzicht van al je gemaakte oefentoetsen en examens
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATS.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-${stat.color}-500/5 border border-${stat.color}-500/20 rounded-2xl p-6 flex items-center gap-4 group hover:bg-${stat.color}-500/10 transition-colors`}
          >
            <div
              className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 shadow-[0_0_15px_rgba(var(--${stat.color}-500),0.2)]`}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tight">
                {stat.value}
              </div>
              <div
                className={`text-xs font-bold text-${stat.color}-400 uppercase tracking-wider`}
              >
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results Table / List */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Recente Resultaten</h3>
          <button className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">
            Bekijk Alles
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {unifiedResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nog geen examens gemaakt. Start een sessie in het Examen Centrum!
            </div>
          ) : (
            unifiedResults.slice(0, 10).map((exam) => (
              <div
                key={exam.id}
                className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg 
                                    ${
                                      exam.score >= 5.5
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                        : "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                    }`}
                  >
                    {exam.score.toFixed(1)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors flex items-center gap-2">
                      {exam.name}
                      {exam.type === "simulator" && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 rounded border border-amber-500/30">
                          SIM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-2">
                      <span>{exam.subject}</span>
                      <span>•</span>
                      <span>{exam.date}</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 duration-300">
                  Analyseer
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
