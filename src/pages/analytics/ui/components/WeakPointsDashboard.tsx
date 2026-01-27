// import { useTranslations } from "@shared/hooks/useTranslations";
import { AlertTriangle, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";

// Mock data based on the user request (eventually to be replaced by AI brain data)
const MOCK_WEAK_POINTS = [
  { subject: "Wiskunde B", topic: "Integralen", severity: "high", score: 4.5 },
  {
    subject: "Natuurkunde",
    topic: "Kwantummechanica",
    severity: "medium",
    score: 6.2,
  },
  {
    subject: "Scheikunde",
    topic: "Redoxreacties",
    severity: "medium",
    score: 6.5,
  },
  {
    subject: "Engels",
    topic: "Grammatica (Tenses)",
    severity: "low",
    score: 7.0,
  },
];

export const WeakPointsDashboard: React.FC = () => {
  // const { t } = useTranslations();

  const sortedPoints = useMemo(() => {
    return [...MOCK_WEAK_POINTS].sort((a, b) => a.score - b.score);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Heatmap / Summary Card */}
        <div className="bg-obsidian-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Focus Punten
          </h3>
          <div className="flex flex-col gap-3">
            {sortedPoints.map((point, idx) => (
              <div key={idx} className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 rounded-lg transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className="relative flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/20 hover:border-white/20 transition-colors">
                  <div>
                    <div className="text-sm font-bold text-slate-200">
                      {point.subject}
                    </div>
                    <div className="text-xs text-slate-400">{point.topic}</div>
                  </div>
                  <div
                    className={`text-sm font-mono font-bold px-2 py-1 rounded ${
                      point.score < 5.5
                        ? "bg-red-500/20 text-red-400"
                        : point.score < 6.5
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {point.score.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Advice Card */}
        <div className="bg-obsidian-900/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} />
              Verbeter Strategie
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Je **Wiskunde B** score wordt voornamelijk omlaag getrokken door
              *Integralen*. Ik raad aan om de komende 3 dagen elke dag 15
              minuten te besteden aan de "Basisregels Integreren" module.
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Prioriteit: Wiskunde B (Integralen)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Oefenen: Natuurkunde (Kwantum)</span>
              </li>
            </ul>
          </div>
          <button className="mt-6 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 hover:border-emerald-500 text-emerald-400 rounded-xl font-bold transition-all text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            Genereer Oefentoets
          </button>
        </div>
      </div>
    </div>
  );
};
