/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import { TrainingModule } from "../../types";

interface ModuleProgress {
  level: number;
  mastery: number; // 0-100
  attempts: number;
  streak: number;
  lastPlayed: number;
}

interface ProgressMap {
  [key: string]: ModuleProgress;
}

export const useSpatialProgress = () => {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    const saved = localStorage.getItem("spatial_progress");
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, []);

  const saveProgress = (newProgress: ProgressMap) => {
    setProgress(newProgress);
    localStorage.setItem("spatial_progress", JSON.stringify(newProgress));
  };

  const updateProgress = (module: TrainingModule, correct: boolean) => {
    const current = progress[module] || {
      level: 1,
      mastery: 0,
      attempts: 0,
      streak: 0,
      lastPlayed: 0,
    };

    let newMastery = current.mastery;
    let newStreak = current.streak;

    if (correct) {
      // Adaptive Increase: Faster growth at low levels, steady at high
      const gain = Math.max(2, 10 - current.mastery / 20);
      newMastery = Math.min(100, newMastery + gain);
      newStreak += 1;
    } else {
      // Penalty
      const penalty = 10;
      newMastery = Math.max(0, newMastery - penalty);
      newStreak = 0;
    }

    const updated = {
      ...current,
      mastery: Math.round(newMastery),
      attempts: current.attempts + 1,
      streak: newStreak,
      lastPlayed: Date.now(),
    };

    const newMap = { ...progress, [module]: updated };
    saveProgress(newMap);
  };

  const getRecommendedModule = (): TrainingModule | null => {
    // Find module with lowest mastery OR hasn't been played in a while (SRS)
    const modules: TrainingModule[] = [
      "rotation",
      "counting",
      "pov",
      "spot",
      "sequence",
      "shadows",
      "projection",
      "cross-section",
      "pathfinding",
      "chirality",
      "nets",
      "folding",
      "stability",
      "mechanical",
    ]; // All modules

    // Filter modules that have data (or just pick random if empty)
    // Heuristic:
    // Priority 1: Mastery < 50
    // Priority 2: Oldest played

    const candidates = modules.map((m) => ({
      id: m,
      data: progress[m] || { mastery: 0, lastPlayed: 0 },
    }));

    // Sort by mastery asc
    candidates.sort((a, b) => a.data.mastery - b.data.mastery);

    // Return lowest mastery
    return candidates[0]!.id;
  };

  return { progress, updateProgress, getRecommendedModule };
};
