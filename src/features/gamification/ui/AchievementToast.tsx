/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAchievementStore } from "@shared/model/achievementStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Flame,
  GraduationCap,
  Moon,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useEffect } from "react";

const IconMap: Record<string, any> = {
  Trophy,
  Star,
  Award,
  Flame,
  Zap,
  Moon,
  GraduationCap,
};

export const AchievementToast: React.FC = () => {
  const { recentUnlock, clearRecentUnlock } = useAchievementStore();

  useEffect(() => {
    if (recentUnlock) {
      const timer = setTimeout(() => {
        clearRecentUnlock();
      }, 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [recentUnlock, clearRecentUnlock]);

  return (
    <AnimatePresence>
      {recentUnlock && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-obsidian-900/95 border border-gold/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.3)] backdrop-blur-xl max-w-sm w-full"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gold blur-lg opacity-40 animate-pulse"></div>
            <div className="bg-gradient-to-br from-gold to-orange-500 p-3 rounded-full relative z-10">
              {(() => {
                const Icon = IconMap[recentUnlock.icon] || Trophy;
                return <Icon className="text-white w-6 h-6" />;
              })()}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-gold font-bold text-lg leading-tight uppercase tracking-wider">
              Achievement!
            </h4>
            <p className="text-white font-bold">{recentUnlock.title}</p>
            <p className="text-xs text-slate-400">{recentUnlock.description}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              Reward
            </div>
            <div className="text-emerald-400 font-mono font-bold">
              +{recentUnlock.rewards?.xp ?? 0} XP
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
