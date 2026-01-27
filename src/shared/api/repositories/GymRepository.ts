import { executeQuery } from "../sqliteService";

export const GymRepository = {
  /**
   * Haalt de 'Daily Workout' op: items waarvan next_review verstreken is.
   */
  getDueItems: async (limit = 10) => {
    const now = Date.now();
    // Note: SQLite stores timestamps depending on input, here we assume numeric timestamp for simplicity
    try {
      const result = await executeQuery(
        `
                SELECT * FROM gym_progress 
                WHERE next_review <= ? 
                ORDER BY next_review ASC 
                LIMIT ?
            `,
        [now, limit],
      );
      return result as {
        engine_id: string;
        skill_key: string;
        box_level: number;
        next_review: number;
      }[];
    } catch (e) {
      console.error("Error fetching due items:", e);
      return [];
    }
  },

  /**
   * Verwerkt het resultaat van een oefening (Leitner Systeem logica).
   */
  saveResult: async (
    engineId: string,
    skillKey: string,
    isCorrect: boolean,
    timeTaken = 0,
    score = 0,
  ) => {
    try {
      // ... (rest of logic remains same until history insert) ...

      // 1. Haal huidige status op
      const current = (await executeQuery(
        `SELECT box_level FROM gym_progress WHERE engine_id = ? AND skill_key = ?`,
        [engineId, skillKey],
      )) as { box_level: number }[];

      let box = current[0]?.box_level || 1;

      // 2. Bereken nieuwe box en review tijd
      if (isCorrect) {
        box = Math.min(5, box + 1); // Promotie
      } else {
        box = 1; // Degradatie
      }

      // Interval: Box 1=1dag, Box 2=3dagen, Box 3=1week, etc.
      const intervals = [0, 1, 3, 7, 14, 30];
      const nextReview =
        Date.now() + (intervals[box] || 1) * 24 * 60 * 60 * 1000;

      // 3. Upsert (Update of Insert) de progressie
      await executeQuery(
        `
                INSERT INTO gym_progress (engine_id, skill_key, box_level, next_review)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(engine_id, skill_key) DO UPDATE SET
                    box_level = excluded.box_level,
                    next_review = excluded.next_review
            `,
        [engineId, skillKey, box, nextReview],
      );

      // 4. Log geschiedenis
      await executeQuery(
        `
                INSERT INTO gym_history (engine_id, is_correct, time_taken_ms, score)
                VALUES (?, ?, ?, ?)
            `,
        [engineId, (isCorrect ? 1 : 0) as number, timeTaken, score],
      );

      // 5. Check unlocks
      await GymRepository.checkUnlock(engineId, box);

      return { newBox: box };
    } catch (e) {
      console.error("Error saving result:", e);
      return { newBox: 1, error: e };
    }
  },

  /**
   * Haalt het huidige niveau (box_level) op voor een specifieke engine.
   */
  getLevel: async (engineId: string, skillKey: string) => {
    try {
      const result = (await executeQuery(
        `SELECT box_level FROM gym_progress WHERE engine_id = ? AND skill_key = ?`,
        [engineId, skillKey],
      )) as { box_level: number }[];
      return result[0]?.box_level || 1;
    } catch (e) {
      console.error("Error fetching level:", e);
      return 1;
    }
  },

  /**
   * Haalt alle vrijgespeelde modules op.
   */
  getUnlockedModules: async () => {
    try {
      const result = await executeQuery(`
                SELECT module_id FROM module_unlocks WHERE is_unlocked = 1
            `);
      return (result as { module_id: string }[]).map((r) => r.module_id);
    } catch (e) {
      console.error("Error fetching unlocked modules:", e);
      return [];
    }
  },

  /**
   * Checkt of er een module vrijgespeeld moet worden op basis van gym progressie.
   * Voor VWO Elite MVP hardcoden we dit even:
   * - Fractions box 3+ -> Unlocks 'chain_rule'
   */
  checkUnlock: async (engineId: string, currentBox: number) => {
    if (engineId === "fractions" && currentBox >= 3) {
      console.log("UNLOCKING CHAIN RULE!");
      await executeQuery(
        `
                INSERT INTO module_unlocks (module_id, is_unlocked, completed_at)
                VALUES (?, 1, ?)
                ON CONFLICT(module_id) DO UPDATE SET is_unlocked = 1
            `,
        ["chain_rule", Date.now()],
      );
    }
  },

  /**
   * Haalt de totale XP op uit de geschiedenis.
   */
  getTotalXP: async () => {
    try {
      const result = (await executeQuery(`
                SELECT SUM(score) as total_xp FROM gym_history
            `)) as { total_xp: number }[];
      return result[0]?.total_xp || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Haalt alle levels op voor de dashboard view.
   */
  getAllLevels: async () => {
    try {
      const result = (await executeQuery(`
                SELECT engine_id, box_level FROM gym_progress WHERE skill_key = 'general'
            `)) as { engine_id: string; box_level: number }[];

      const levels: Record<string, number> = {};
      result.forEach((r) => {
        levels[r.engine_id] = r.box_level;
      });
      return levels;
    } catch (e) {
      console.error("Error fetching all levels:", e);
      return {};
    }
  },
};
