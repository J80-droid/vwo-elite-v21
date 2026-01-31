import { GYM_CATALOG } from "@features/math/ui/modules/gym/config/gymCatalog";
import { ProgressionService } from "@features/math/ui/modules/gym/ProgressionService";
import { GymResultMetrics } from "../../types/gym";
import { executeQuery } from "../sqliteService";

// Pas dit import pad aan naar waar u GymUtils heeft opgeslagen
import { GYM_CONSTANTS, GymUtils } from "@features/math/ui/modules/gym/utils/GymUtils";

// Record for history rows
interface HistoryRow {
  id: number;
  engine_id: string;
  is_correct: number;
  time_taken_ms: number;
  score: number;
  metrics: string | null;
  timestamp: number;
}

export const GymRepository = {
  /**
   * Haalt de 'Daily Workout' op: items waarvan next_review verstreken is.
   */
  getDueItems: async (limit = 10) => {
    // ... logic remains same ...
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
    metrics: GymResultMetrics | null = null,
  ) => {
    try {
      // 1. Start Transactie 
      await executeQuery("BEGIN TRANSACTION");

      // 2. Haal huidige status op
      const current = (await executeQuery(
        `SELECT box_level FROM gym_progress WHERE engine_id = ? AND skill_key = ?`,
        [engineId, skillKey],
      )) as { box_level: number }[];

      const currentBox = current[0]?.box_level || 1;
      let newBox = currentBox;

      // 3. Bereken nieuwe box (Leitner Logica via Constants)
      if (isCorrect) {
        newBox = Math.min(GYM_CONSTANTS.MAX_BOX_LEVEL, currentBox + 1);
      } else {
        newBox = 1; // Reset bij fout
      }

      // 4. Bereken next_review timestamp via Utility
      const nextReview = GymUtils.calculateNextReview(newBox);

      // 5. Upsert de progressie
      await executeQuery(
        `
        INSERT INTO gym_progress (engine_id, skill_key, box_level, next_review)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(engine_id, skill_key) DO UPDATE SET
          box_level = excluded.box_level,
          next_review = excluded.next_review
        `,
        [engineId, skillKey, newBox, nextReview],
      );

      // 6. Log geschiedenis
      await executeQuery(
        `
        INSERT INTO gym_history (engine_id, is_correct, time_taken_ms, score, metrics, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          engineId,
          isCorrect ? 1 : 0,
          timeTaken,
          score,
          metrics ? JSON.stringify(metrics) : null,
          Date.now(),
        ],
      );

      // 7. Unlocks handled by service
      await ProgressionService.checkUnlocks(engineId, newBox);
      await executeQuery("COMMIT");

      return { newBox };
    } catch (e) {
      await executeQuery("ROLLBACK");
      console.error("GymRepository: Error saving result:", e);
      throw e;
    }
  },

  // ... getLevel remains similar ...
  getLevel: async (engineId: string, skillKey = "general") => {
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

  // ... getUnlockedModules & getTotalXP & getAllProgress ...
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

  getAllProgress: async () => {
    try {
      const result = (await executeQuery(`
                SELECT engine_id, box_level, next_review FROM gym_progress WHERE skill_key = 'general'
            `)) as { engine_id: string; box_level: number; next_review: number }[];

      const progress: Record<string, { level: number; nextReview: number }> = {};
      result.forEach((r) => {
        progress[r.engine_id] = {
          level: r.box_level,
          nextReview: r.next_review || 0,
        };
      });
      return progress;
    } catch (e) {
      console.error("Error fetching all progress:", e);
      return {};
    }
  },

  getAllHistory: async () => {
    try {
      const result = (await executeQuery(`
            SELECT * FROM gym_history ORDER BY timestamp ASC
        `)) as HistoryRow[];
      return result.map(r => ({
        ...r,
        metrics: r.metrics ? JSON.parse(r.metrics) : {},
        timestamp: r.timestamp
      }));
    } catch (e) {
      console.error("Error fetching history:", e);
      return [];
    }
  },


  /**
   * Refactored: Gebruikt nu constants voor cijferberekening
   */
  getMonthlyTrend: async () => {
    try {
      const result = await executeQuery(`
        SELECT 
          strftime('%Y-%m', datetime(timestamp / 1000, 'unixepoch')) as month_key,
          SUM(is_correct) as correct_count,
          COUNT(*) as total_count
        FROM gym_history
        GROUP BY month_key
        ORDER BY month_key ASC
        LIMIT 6
      `) as { month_key: string; correct_count: number; total_count: number }[];

      return result.map(r => ({
        month_key: r.month_key,
        avg_grade: r.total_count > 0
          ? ((r.correct_count * GYM_CONSTANTS.GRADE_CORRECT) + ((r.total_count - r.correct_count) * GYM_CONSTANTS.GRADE_INCORRECT)) / r.total_count
          : 0,
        session_count: r.total_count
      }));
    } catch (e) {
      console.error("Error fetching monthly trend:", e);
      return [];
    }
  },

  /**
   * @new ANALYTICS: Haalt geaggregeerde fout-types op.
   * Gebruikt SQLite JSON functies om direct in de metrics te kijken.
   */
  getErrorDistribution: async () => {
    try {
      // 1. Fetch standard error types
      const standardErrors = await executeQuery(`
        SELECT 
          json_extract(metrics, '$.errorType') as error_type,
          COUNT(*) as count
        FROM gym_history 
        WHERE is_correct = 0 
          AND metrics IS NOT NULL 
          AND json_extract(metrics, '$.errorType') IS NOT NULL
        GROUP BY error_type
      `) as { error_type: string; count: number }[];

      // 2. Tactical detection: Identify "Strikvragen" patterns
      // These are errors where accuracy is high on the engine but the specific error is format/misread
      const tacticalErrors = await executeQuery(`
        SELECT 
          'Strikvraag (Misread/Format)' as error_type,
          COUNT(*) as count
        FROM gym_history
        WHERE is_correct = 0
          AND (
            json_extract(metrics, '$.errorType') IN ('format_error', 'misread_question', 'unit_error')
            OR time_taken_ms < 5000 -- Too fast mistake
          )
      `) as { error_type: string; count: number }[];

      return [...standardErrors, ...tacticalErrors].filter(e => e.count > 0);
    } catch (e) {
      console.error("Error fetching error distribution:", e);
      return [];
    }
  },

  /**
   * @new ANALYTICS: Haalt confidence matrix data op.
   */
  getConfidenceStats: async () => {
    try {
      const result = await executeQuery(`
        SELECT 
          json_extract(metrics, '$.confidence') as confidence_level,
          AVG(is_correct) as correctness_rate,
          COUNT(*) as count
        FROM gym_history
        WHERE metrics IS NOT NULL
          AND json_extract(metrics, '$.confidence') IS NOT NULL
        GROUP BY confidence_level
      `);
      return result as { confidence_level: string; correctness_rate: number; count: number }[];
    } catch (e) {
      console.error("Error fetching confidence stats:", e);
      return [];
    }
  },

  /**
   * @new ANALYTICS: Haalt alleen de noodzakelijke progressie data op voor syllabus dekking.
   * Dit is lichter dan getAllProgress omdat we alleen engine_id en box_level nodig hebben.
   */
  getSyllabusLevels: async () => {
    try {
      const result = await executeQuery(`
            SELECT engine_id, box_level FROM gym_progress
          `);
      return result as { engine_id: string; box_level: number }[];
    } catch (e) {
      console.error("Error fetching syllabus levels:", e);
      return [];
    }
  },
  /**
     * @new ANALYTICS: Haalt tijdstatistieken op per engine.
     * Wordt gebruikt om te zien welke onderwerpen de meeste tijd kosten.
     */
  getTimeStats: async (limit = 5) => {
    try {
      const result = await executeQuery(`
        SELECT 
          engine_id, 
          AVG(time_taken_ms) as avg_time,
          COUNT(*) as session_count
        FROM gym_history
        GROUP BY engine_id
        ORDER BY avg_time DESC
        LIMIT ?
      `, [limit]);
      return result as { engine_id: string; avg_time: number; session_count: number }[];
    } catch (e) {
      console.error("Error fetching time stats:", e);
      return [];
    }
  },
  /**
   * @new ANALYTICS: Haalt stamina data op.
   * Analyseert hoe nauwkeurigheid verandert naarmate een sessie vordert.
   */
  getStaminaStats: async (limit = 200) => {
    try {
      const history = (await executeQuery(`
        SELECT is_correct, timestamp FROM gym_history 
        ORDER BY timestamp DESC LIMIT ?
      `, [limit])) as { is_correct: number; timestamp: number }[];

      if (history.length === 0) return [];

      // Sorteer chronologisch voor verwerking
      const sorted = [...history].reverse();
      const sessions: { correct: number; total: number }[] = [];
      let currentSession: { is_correct: number; timestamp: number }[] = [];

      const SESSION_GAP = 15 * 60 * 1000; // 15 minuten

      const processSession = (session: { is_correct: number }[]) => {
        session.forEach((q, qIdx) => {
          if (!sessions[qIdx]) {
            sessions[qIdx] = { correct: 0, total: 0 };
          }
          const s = sessions[qIdx]!;
          s.correct += q.is_correct;
          s.total += 1;
        });
      };

      sorted.forEach((item, idx) => {
        const prev = idx > 0 ? sorted[idx - 1] : undefined;
        if (prev && item.timestamp - prev.timestamp > SESSION_GAP) {
          processSession(currentSession);
          currentSession = [item];
        } else {
          currentSession.push(item);
        }
      });

      // Verwerk de laatste sessie
      processSession(currentSession);

      // Map naar format voor de grafiek (max eerste 20 vragen)
      return sessions.slice(0, 20).map((s, idx) => ({
        index: idx + 1,
        accuracy: Math.round((s.correct / s.total) * 100)
      }));
    } catch (e) {
      console.error("Error fetching stamina stats:", e);
      return [];
    }
  },
  /**
   * @new ANALYTICS: Berekent de voorspelde examencijfer (North Star Metric).
     * Formule: 50% nauwkeurigheid, 30% syllabus coverage, 20% stamina.
     */
  getPredictedGradeStats: async () => {
    try {
      const [history, levels, stamina] = await Promise.all([
        executeQuery(`SELECT AVG(is_correct) as acc FROM gym_history`),
        executeQuery(`SELECT COUNT(*) as total, SUM(CASE WHEN box_level >= 4 THEN 1 ELSE 0 END) as mastered FROM gym_progress`),
        GymRepository.getStaminaStats(100)
      ]);

      const accRow = (history as { acc: number }[])[0];
      const progressionRow = (levels as { total: number; mastered: number }[])[0];

      const accuracy = (accRow?.acc || 0) * 10; // 0-1 -> 0-10
      const coverage = progressionRow?.total ? (progressionRow.mastered / progressionRow.total) * 10 : 0;

      const staminaAvg = stamina.length > 0
        ? stamina.reduce((acc, curr) => acc + curr.accuracy, 0) / stamina.length / 10
        : 0;

      // Gewogen gemiddelde (start met een basis van 1.0)
      const rawGrade = (accuracy * 0.5) + (coverage * 0.3) + (staminaAvg * 0.2);
      const grade = Math.max(1, Math.min(10, rawGrade)).toFixed(1);

      return {
        grade: parseFloat(grade),
        breakdown: { accuracy, coverage, stamina: staminaAvg * 10 }
      };
    } catch (e) {
      console.error("Error predicting grade:", e);
      return { grade: 1.0, breakdown: { accuracy: 0, coverage: 0, stamina: 0 } };
    }
  },

  getRTTIStats: async () => {
    try {
      const history = await executeQuery(`SELECT engine_id, AVG(is_correct) as acc, COUNT(*) as volume FROM gym_history GROUP BY engine_id`);
      const results = {
        R: { score: 0, count: 0 },
        T1: { score: 0, count: 0 },
        T2: { score: 0, count: 0 },
        I: { score: 0, count: 0 }
      };

      // Create quick lookup map from catalog to avoid O(N^2)
      const rttiLookup = new Map<string, 'R' | 'T1' | 'T2' | 'I'>();
      GYM_CATALOG.forEach(m => {
        if (m.rttiType) rttiLookup.set(m.id, m.rttiType);
      });

      (history as { engine_id: string, acc: number, volume: number }[]).forEach(row => {
        // Fallback logic: Mix/Infinite = Inzicht (I), others default to Training (T1) if not found (e.g. legacy/testing)
        let level = rttiLookup.get(row.engine_id);

        if (!level) {
          if (row.engine_id.startsWith('mix-') || row.engine_id.startsWith('infinite-')) {
            level = 'I';
          } else {
            level = 'T1';
          }
        }

        results[level].score += row.acc * row.volume;
        results[level].count += row.volume;
      });

      return Object.entries(results).map(([label, data]) => ({
        subject: label === 'R' ? 'Reproductie' : label === 'T1' ? 'Training' : label === 'T2' ? 'Toepassing' : 'Inzicht',
        A: data.count > 0 ? Math.round((data.score / data.count) * 100) : 0,
        fullMark: 100
      }));
    } catch (e) {
      console.error("Error fetching RTTI stats:", e);
      return [];
    }
  },

  getRetentionStats: async () => {
    try {
      const now = Date.now();
      const progress = await executeQuery(`SELECT box_level, next_review FROM gym_progress`) as { box_level: number, next_review: number }[];

      if (progress.length === 0) return { overall: 0, segments: [] };

      const totalItems = progress.length;
      let totalStrength = 0;

      const segments = [
        { label: 'Critiek (0-1d)', count: 0, color: '#ef4444' },
        { label: 'Zwak (2-7d)', count: 0, color: '#f59e0b' },
        { label: 'Stabiel (1-2w)', count: 0, color: '#3b82f6' },
        { label: 'Elite (2w+)', count: 0, color: '#10b981' }
      ];

      progress.forEach(item => {
        const daysLeft = (item.next_review - now) / (1000 * 60 * 60 * 24);
        const strength = (item.box_level / 5) * 100;
        totalStrength += strength;

        if (daysLeft < 1.5) {
          const s = segments[0];
          if (s) s.count++;
        } else if (daysLeft < 7.5) {
          const s = segments[1];
          if (s) s.count++;
        } else if (daysLeft < 14.5) {
          const s = segments[2];
          if (s) s.count++;
        } else {
          const s = segments[3];
          if (s) s.count++;
        }
      });

      return {
        overall: Math.round(totalStrength / totalItems),
        segments: segments.map(s => ({ ...s, percentage: Math.round((s.count / totalItems) * 100) }))
      };
    } catch (e) {
      console.error("Error fetching retention stats:", e);
      return { overall: 0, segments: [] };
    }
  },

  getPointsToGainStats: async () => {
    try {
      const [progress, history] = await Promise.all([
        executeQuery(`SELECT engine_id, box_level FROM gym_progress`),
        executeQuery(`SELECT engine_id, AVG(is_correct) as acc FROM gym_history GROUP BY engine_id`)
      ]);

      const progMap: Record<string, number> = (progress as { engine_id: string, box_level: number }[]).reduce((acc, curr) => ({ ...acc, [curr.engine_id]: curr.box_level }), {});

      const candidates = (history as { engine_id: string, acc: number }[]).map(h => {
        const currentLvl = progMap[h.engine_id] || 1;
        const potential = (5 - currentLvl) * h.acc; // High accuracy + low level = high potential
        return {
          id: h.engine_id,
          potential: potential,
          acc: h.acc,
          level: currentLvl
        };
      }).sort((a, b) => b.potential - a.potential).slice(0, 5);

      return candidates;
    } catch (e) {
      console.error("Error fetching points to gain stats:", e);
      return [];
    }
  },

  getMentalStateStats: async () => {
    try {
      const now = Date.now();
      const lastDay = now - (24 * 60 * 60 * 1000);
      const recentHistory = await executeQuery(
        `SELECT time_taken_ms FROM gym_history WHERE timestamp > ?`,
        [lastDay]
      ) as { time_taken_ms: number }[];

      // 1. Burn-out check
      const volume24h = recentHistory.length;
      const burnoutRisk: 'Low' | 'Medium' | 'High' = volume24h > 150 ? 'High' : volume24h > 80 ? 'Medium' : 'Low';

      // 2. Focus Score calculation (Standard Deviation / Mean of response times)
      const times = recentHistory.map(h => h.time_taken_ms).filter(t => t > 0);
      let focusScore = 100;

      if (times.length > 5) {
        const mean = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean; // Coefficient of Variation

        // Lower CV means more consistent timing -> higher focus
        // We map CV 0.0 -> 100, CV 1.0 -> 0
        focusScore = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
      }

      return {
        focusScore,
        burnoutRisk,
        volume24h
      };
    } catch (e) {
      console.error("Error fetching mental state stats:", e);
      return { focusScore: 100, burnoutRisk: 'Low', volume24h: 0 };
    }
  },

  getBenchmarkStats: async () => {
    try {
      const [history, progress] = await Promise.all([
        executeQuery(`SELECT AVG(is_correct) as acc, AVG(time_taken_ms) as time FROM gym_history`),
        executeQuery(`SELECT AVG(box_level) as avg_lvl FROM gym_progress`)
      ]);

      const h = (history as { acc: number, time: number }[])[0];
      const p = (progress as { avg_lvl: number }[])[0];

      const currentAcc = (h?.acc || 0) * 100;
      const currentTime = (h?.time || 0) / 1000;
      const currentMastery = ((p?.avg_lvl || 1) / GYM_CONSTANTS.MAX_BOX_LEVEL) * 100;

      return [
        { name: 'Accuracy', user: currentAcc, elite: GYM_CONSTANTS.ELITE_ACCURACY },
        { name: 'Speed', user: Math.max(0, 100 - (currentTime / 120 * 100)), elite: 100 - (GYM_CONSTANTS.ELITE_TIME_SEC / 120 * 100) },
        { name: 'Mastery', user: currentMastery, elite: GYM_CONSTANTS.ELITE_MASTERY }
      ];
    } catch (e) {
      console.error("Error fetching benchmark stats:", e);
      return [];
    }
  },

  getWPMStats: async () => {
    try {
      // We filter history for reading-intensive engines
      const readingEngines = GYM_CATALOG.filter(m => m.isReadingIntensive).map(m => m.id);
      if (readingEngines.length === 0) return [];

      const placeholders = readingEngines.map(() => '?').join(',');
      const history = await executeQuery(`
        SELECT 
          engine_id, 
          is_correct,
          time_taken_ms,
          json_extract(metrics, '$.word_count') as word_count
        FROM gym_history 
        WHERE engine_id IN (${placeholders})
          AND time_taken_ms > 5000 
        ORDER BY timestamp DESC LIMIT 50
      `, readingEngines);

      const statsMap: Record<string, { totalWords: number, totalTimeMs: number, count: number }> = {};

      (history as { engine_id: string, time_taken_ms: number, word_count: number | null }[]).forEach(row => {
        if (!statsMap[row.engine_id]) statsMap[row.engine_id] = { totalWords: 0, totalTimeMs: 0, count: 0 };
        const s = statsMap[row.engine_id]!;

        // Use provided word count or heuristic (Avg 350 words for VWO reading tasks if missing)
        const words = row.word_count || 350;
        s.totalWords += words;
        s.totalTimeMs += row.time_taken_ms;
        s.count++;
      });

      const result = Object.entries(statsMap).map(([id, s]) => {
        const config = GYM_CATALOG.find(m => m.id === id);
        const wpm = Math.round((s.totalWords / (s.totalTimeMs / 60000)));
        return {
          name: config?.title || id,
          wpm,
          accuracy: 0
        };
      }).sort((a, b) => b.wpm - a.wpm);

      return result;
    } catch (e) {
      console.error("Error fetching WPM stats:", e);
      return [];
    }
  },

  getPercentileScore: async (grade: number) => {
    // Mock percentile calculation (Mean 6.0, StdDev 1.2)
    const z = (grade - 6.0) / 1.2;
    const percentile = Math.round((1 / (1 + Math.exp(-0.07056 * Math.pow(z, 3) - 1.5976 * z))) * 100);
    return Math.max(1, Math.min(99, percentile));
  }
};
