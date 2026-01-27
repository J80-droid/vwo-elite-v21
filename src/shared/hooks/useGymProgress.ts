import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GymRepository } from "../api/repositories/GymRepository";
import { initDatabase as initDB } from "../api/sqliteService";

export const useGymProgress = () => {
  const [stats, setStats] = useState<{
    xp: number;
    dueCount: number;
    levels?: Record<string, number>;
  }>({ xp: 0, dueCount: 0 });
  const [unlockedModules, setUnlockedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load including DB init
  useEffect(() => {
    const load = async () => {
      try {
        // Ensure DB is ready
        await initDB();

        // Fetch real XP from history
        const [due, unlocks, xp, levels] = await Promise.all([
          GymRepository.getDueItems(100),
          GymRepository.getUnlockedModules(),
          GymRepository.getTotalXP(),
          GymRepository.getAllLevels(),
        ]);

        setStats({
          xp,
          dueCount: due.length,
          levels, // Add levels to stats
        });
        setUnlockedModules(unlocks);
      } catch (err) {
        console.error("Failed to load gym progress:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recordSuccess = useCallback(
    async (engineId: string, correct: boolean, time = 0, score = 0) => {
      const result = await GymRepository.saveResult(
        engineId,
        "general",
        correct,
        time,
        score,
      );
      console.log(
        `Recorded ${correct ? "success" : "failure"} for ${engineId} (Score: ${score}, Time: ${time}ms)`,
      );

      // Refresh stats and unlocks
      const [newUnlocks, newXp, newLevels] = await Promise.all([
        GymRepository.getUnlockedModules(),
        GymRepository.getTotalXP(),
        GymRepository.getAllLevels(),
      ]);

      setStats((prev) => ({ ...prev, xp: newXp, levels: newLevels }));

      if (correct) {
        // Check for new unlocks
        const added = newUnlocks.filter((u) => !unlockedModules.includes(u));
        if (added.length > 0) {
          toast.success("Nieuwe Concepten Vrijgespeeld! 🎉", {
            description: `Je hebt toegang tot: ${added.join(", ")}`,
            duration: 5000,
          });
        }
      }
      setUnlockedModules(newUnlocks);
      return result;
    },
    [unlockedModules],
  );

  const getLevel = useCallback(async (engineId: string) => {
    return await GymRepository.getLevel(engineId, "general");
  }, []);

  return useMemo(
    () => ({
      stats: stats as {
        xp: number;
        dueCount: number;
        levels?: Record<string, number>;
      },
      loading,
      recordSuccess,
      getLevel,
      unlockedModules,
    }),
    [stats, loading, recordSuccess, getLevel, unlockedModules],
  );
};
