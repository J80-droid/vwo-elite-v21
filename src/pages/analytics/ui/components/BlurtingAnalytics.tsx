import { useBlurtingStore } from "@shared/model/blurtingStore";
import { BrainCircuit, Play, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";

export const BlurtingAnalytics: React.FC = () => {
  const { sessions } = useBlurtingStore();

  // Calculate stats
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalXP = totalSessions * 50; // Approximated if not stored directly
    // Average score
    const avgScore =
      totalSessions > 0
        ? sessions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSessions
        : 0;

    // Group by topic
    const topicCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      const t = s.topic.toLowerCase();
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
    const favoriteTopic =
      Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return { totalSessions, totalXP, avgScore, favoriteTopic };
  }, [sessions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Intro */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-4 rounded-2xl bg-electric/10 text-electric shadow-[0_0_20px_rgba(var(--electric),0.2)]">
          <BrainCircuit size={32} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Blurting Progressie
          </h2>
          <p className="text-slate-400">
            Active Recall resultaten en verbeterpunten
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Play size={24} />
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">
              {stats.totalSessions}
            </div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Sessies
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">
              {stats.avgScore.toFixed(0)}%
            </div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Gem. Score
            </div>
          </div>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight truncate max-w-[150px]">
              {stats.favoriteTopic}
            </div>
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Top Onderwerp
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions List */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Recente Sessies</h3>
        </div>
        <div className="divide-y divide-white/5">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nog geen blurting sessies gedaan.
            </div>
          ) : (
            sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg 
                                        ${
                                          session.score >= 70
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : session.score >= 55
                                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                                        }`}
                  >
                    {session.score}%
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors capitalize">
                      {session.topic}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-2">
                      <span>
                        {new Date(session.date).toLocaleDateString("nl-NL")}
                      </span>
                      {session.retryOfId && (
                        <span className="text-purple-400">• Retry</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {session.missingPoints?.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-300 rounded border border-red-500/20">
                      {session.missingPoints.length} gemist
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
