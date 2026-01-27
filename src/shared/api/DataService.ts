import { LOBRepository } from "./repositories/LOBRepository";
import { PlannerRepository } from "./repositories/PlannerRepository";
import { executeQuery, initDatabase as initDB } from "./sqliteService";

export const DataService = {
  /**
   * Exports all critical tables to a JSON object.
   */
  exportData: async () => {
    await initDB();

    try {
      const settings = await executeQuery("SELECT * FROM user_settings");
      const progress = await executeQuery("SELECT * FROM gym_progress");
      const history = await executeQuery("SELECT * FROM gym_history");
      const unlocks = await executeQuery("SELECT * FROM module_unlocks");

      const exportObj = {
        metadata: {
          version: 1,
          timestamp: Date.now(),
          app: "vwo-elite",
        },
        tables: {
          user_settings: settings,
          gym_progress: progress,
          gym_history: history,
          module_unlocks: unlocks,
        },
      };

      return JSON.stringify(exportObj, null, 2);
    } catch (e) {
      console.error("Export failed:", e);
      throw new Error("Export failed");
    }
  },

  /**
   * Imports data from a JSON string.
   * WARNING: This wipes existing data in these tables!
   */
  importData: async (jsonString: string) => {
    await initDB();
    // getDB call removed as it was unused

    try {
      const data = JSON.parse(jsonString);
      if (!data.metadata || data.metadata.app !== "vwo-elite") {
        throw new Error("Invalid backup file format");
      }

      // Transaction-like execution (SQLite Wasm supports transactions via exec mainly)
      // We'll just do sequential deletes/inserts carefully.

      // 1. Clear Tables
      await executeQuery("DELETE FROM user_settings");
      await executeQuery("DELETE FROM gym_progress");
      await executeQuery("DELETE FROM gym_history");
      await executeQuery("DELETE FROM module_unlocks");

      // 2. Insert Data
      const insert = async (table: string, rows: Record<string, unknown>[]) => {
        if (!rows || rows.length === 0) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const keys = Object.keys(rows[0] as any);
        const placeholders = keys.map(() => "?").join(",");
        const sql = `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = keys.map((k) => row[k]) as (string | number | null)[];
          await executeQuery(sql, values);
        }
      };

      await insert(
        "user_settings",
        data.tables.user_settings || data.tables.user_profile,
      ); // Fallback for old backups
      await insert("gym_progress", data.tables.gym_progress);
      await insert("gym_history", data.tables.gym_history);
      await insert("module_unlocks", data.tables.module_unlocks);

      console.log("Import successful");
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      throw e;
    }
  },

  /**
   * LOB & Career Services
   * Delegated to LOBRepository for clean separation.
   */
  getOpenDays: LOBRepository.getOpenDays,
  getUniversityStudies: LOBRepository.getUniversityStudies,
  saveLOBResult: LOBRepository.saveLOBResult,
  getLOBResult: LOBRepository.getLOBResult,

  /**
   * Planner Services
   */
  addTask: PlannerRepository.addTask,
  hasRelatedTask: PlannerRepository.hasRelatedTask,
};
