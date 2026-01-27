import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { useQuizProgressStore } from "@shared/model/quizProgressStore";
import {
  Activity,
  Atom,
  Calculator,
  Dna,
  FlaskConical,
  TrendingUp,
  Trophy,
} from "lucide-react";
import React from "react";

const COLOR_STYLES = {
  indigo: {
    bg: "hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]",
    border: "border-indigo-500/20",
    hoverBorder: "hover:border-indigo-500/50",
    text: "text-indigo-400",
    iconBg: "bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
    bar: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]",
    button:
      "bg-indigo-500/5 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]",
  },
  purple: {
    bg: "hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]",
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/50",
    text: "text-purple-400",
    iconBg: "bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    bar: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
    button:
      "bg-purple-500/5 text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
  },
  emerald: {
    bg: "hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
    border: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/50",
    text: "text-emerald-400",
    iconBg: "bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    bar: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    button:
      "bg-emerald-500/5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
  },
  rose: {
    bg: "hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]",
    border: "border-rose-500/20",
    hoverBorder: "hover:border-rose-500/50",
    text: "text-rose-400",
    iconBg: "bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
    bar: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
    button:
      "bg-rose-500/5 text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/60 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]",
  },
  blue: {
    bg: "hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
    border: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/50",
    text: "text-blue-400",
    iconBg: "bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    bar: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    button:
      "bg-blue-500/5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
  },
};

const getIconForSubject = (subjectId: string) => {
  switch (subjectId) {
    case "1":
      return Calculator; // Wiskunde B
    case "2":
      return Atom; // Natuurkunde
    case "3":
      return FlaskConical; // Scheikunde
    case "4":
      return Dna; // Biologie
    default:
      return Trophy;
  }
};

export const GymsAnalytics: React.FC = () => {
  const { skillMatrix } = useQuizProgressStore();

  // Transform skillMatrix into displayable gym stats
  const gymStats = React.useMemo(() => {
    return Object.entries(skillMatrix).map(([subjectId, data]) => {
      const subject = INITIAL_SUBJECTS.find((s) => s.id === subjectId);
      const name = subject?.legacyName || subjectId;
      const icon = getIconForSubject(subjectId);
      // Default color mapping
      const color = subject?.theme || "indigo";

      return {
        id: subjectId,
        name: name,
        icon: icon,
        color: color,
        xp: data.xp,
        level: data.level,
        progress: data.mastery, // Mastery is 0-100
        streak: 0, // Streak not yet in skillMatrix
      };
    });
  }, [skillMatrix]);

  const totalXP = Object.values(skillMatrix).reduce(
    (acc, curr) => acc + curr.xp,
    0,
  );
  // Simple logic for overall level: average of levels
  const avgLevel =
    gymStats.length > 0
      ? Math.floor(
          gymStats.reduce((acc, curr) => acc + curr.level, 0) / gymStats.length,
        )
      : 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {totalXP} XP
            </div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Totaal Score
            </div>
          </div>
        </div>

        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              Active
            </div>
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Status
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              Level {avgLevel}
            </div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Elite Rank
            </div>
          </div>
        </div>
      </div>

      {/* Gyms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {gymStats.length === 0 ? (
          <div className="col-span-4 text-center text-slate-500 p-8">
            Nog geen data beschikbaar. Maak een quiz om stats te verzamelen!
          </div>
        ) : (
          gymStats.map((gym) => {
            const styles =
              COLOR_STYLES[gym.color as keyof typeof COLOR_STYLES] ||
              COLOR_STYLES.indigo;
            return (
              <div
                key={gym.id}
                className={`bg-black/40 border rounded-2xl p-6 transition-all duration-300 group ${styles.border} ${styles.hoverBorder} ${styles.bg}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${styles.iconBg} ${styles.text}`}
                  >
                    <gym.icon size={24} />
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${styles.text}`}>
                      Lvl {gym.level}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      XP: {gym.xp}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-4">
                  {gym.name}
                </h3>

                {/* Custom Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Mastery</span>
                    <span className={`font-bold ${styles.text}`}>
                      {gym.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${styles.bar}`}
                      style={{ width: `${gym.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  className={`mt-6 w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${styles.button}`}
                >
                  Train Nu
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
