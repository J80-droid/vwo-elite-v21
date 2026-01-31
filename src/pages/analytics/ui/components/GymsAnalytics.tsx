import { GYM_CATALOG } from "@features/math/ui/modules/gym/config/gymCatalog";
import { GymRepository } from "@shared/api/repositories/GymRepository";
import {
  Activity,
  TrendingUp,
  Trophy,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface ThemeStyle {
  text: string;
  bg: string;
  border: string;
  iconBg: string;
  bar: string;
}

const getThemeStyles = (color: string = "indigo"): ThemeStyle => {
  const styles: Record<string, ThemeStyle> = {
    indigo: {
      text: "text-indigo-400",
      bg: "hover:bg-indigo-500/5",
      border: "border-indigo-500/20",
      iconBg: "bg-indigo-500/10",
      bar: "bg-indigo-500"
    },
    cyan: {
      text: "text-cyan-400",
      bg: "hover:bg-cyan-500/5",
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      bar: "bg-cyan-500"
    },
    rose: {
      text: "text-rose-400",
      bg: "hover:bg-rose-500/5",
      border: "border-rose-500/20",
      iconBg: "bg-rose-500/10",
      bar: "bg-rose-500"
    },
    amber: {
      text: "text-amber-400",
      bg: "hover:bg-amber-500/5",
      border: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
      bar: "bg-amber-500"
    },
    emerald: {
      text: "text-emerald-400",
      bg: "hover:bg-emerald-500/5",
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      bar: "bg-emerald-500"
    },
    blue: {
      text: "text-blue-400",
      bg: "hover:bg-blue-500/5",
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/10",
      bar: "bg-blue-500"
    },
    purple: {
      text: "text-purple-400",
      bg: "hover:bg-purple-500/5",
      border: "border-purple-500/20",
      iconBg: "bg-purple-500/10",
      bar: "bg-purple-500"
    }
  };
  return (styles[color] || styles.indigo) as ThemeStyle;
};

export const GymsAnalytics: React.FC = () => {
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lvls, xp] = await Promise.all([
          GymRepository.getAllLevels(),
          GymRepository.getTotalXP()
        ]);
        setLevels(lvls || {});
        setTotalXP(xp || 0);
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeEngines = Object.values(levels).filter(l => l > 1).length;
  const avgLevel = activeEngines > 0
    ? Math.round(Object.values(levels).reduce((a, b) => a + b, 0) / (Object.keys(levels).length || 1))
    : 1;

  if (loading) return <div className="p-8 text-slate-500 animate-pulse uppercase tracking-widest text-xs font-black">Analytics laden...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 flex items-center gap-4 group transition-all hover:bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalXP.toLocaleString()} XP</div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Totaal Score</div>
          </div>
        </div>

        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 flex items-center gap-4 group transition-all hover:bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{activeEngines} / {GYM_CATALOG.filter(g => !g.isSpecial).length}</div>
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Actieve Drills</div>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4 group transition-all hover:bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">Level {avgLevel}</div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Gemiddeld Niveau</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {GYM_CATALOG.filter(g => !g.isSpecial).map((gym) => {
          const level = levels[gym.id] || 1;
          const progress = Math.min(100, (level - 1) * 25);
          const colorKey = gym.category === 'physics' ? 'cyan' : gym.category === 'biology' ? 'emerald' : gym.category === 'english' ? 'blue' : gym.category === 'philosophy' ? 'purple' : gym.category === 'french' ? 'rose' : gym.category === 'chemistry' ? 'indigo' : 'amber';
          const styles = getThemeStyles(colorKey);

          return (
            <div key={gym.id} className={`bg-black/40 border ${styles.border} ${styles.bg} rounded-2xl p-6 transition-all duration-300 group`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${styles.iconBg} ${styles.text} transition-transform group-hover:scale-110`}>
                  <gym.icon size={24} />
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${styles.text}`}>Lvl {level}</div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4 truncate">{gym.title}</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase tracking-widest font-black text-[9px]">Beheersing</span>
                  <span className={`font-bold ${styles.text}`}>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${styles.bar} shadow-[0_0_10px_currentColor] transition-all duration-1000`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
