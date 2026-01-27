import { useEffect, useState } from "react";

import { executeQuery } from "../api/sqliteService";

interface AIContextState {
  profile: {
    name: string;
    grade: string;
  } | null;
  gymStats: {
    failures: { engine_id: string; time: number }[];
    unlocks: string[];
  };
  isLoading: boolean;
}

export const useAIContext = () => {
  const [context, setContext] = useState<AIContextState>({
    profile: null,
    gymStats: { failures: [], unlocks: [] },
    isLoading: true,
  });

  useEffect(() => {
    const loadContext = async () => {
      try {
        // 1. Fetch Profile
        const profileRes = (await executeQuery(
          "SELECT name, grade, profile FROM user_profile LIMIT 1",
        )) as { name: string; grade: string }[];
        const profile = profileRes[0]
          ? {
              name: profileRes[0].name || "Student",
              grade: profileRes[0].grade || "VWO 5",
            }
          : null;

        // 2. Fetch Recent Gym Failures (Last 5)
        const failuresRes = (await executeQuery(`
                    SELECT engine_id, time_taken_ms 
                    FROM gym_history 
                    WHERE is_correct = 0 
                    ORDER BY timestamp DESC 
                    LIMIT 5
                `)) as { engine_id: string; time_taken_ms: number }[];

        // 3. Fetch Unlocks
        const unlocksRes = (await executeQuery(
          "SELECT module_id FROM module_unlocks WHERE is_unlocked = 1",
        )) as { module_id: string }[];

        setContext({
          profile,
          gymStats: {
            failures: failuresRes.map((f) => ({
              engine_id: f.engine_id,
              time: f.time_taken_ms,
            })),
            unlocks: unlocksRes.map((u) => u.module_id),
          },
          isLoading: false,
        });
      } catch (e) {
        console.error("AI Context Load Failed:", e);
        setContext((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadContext();
  }, []);

  return context;
};
