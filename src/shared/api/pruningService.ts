import { sqliteRun } from "./sqliteService";

/**
 * PruningService manages the lifecycle of volatile data in the SQLite database.
 * It prevents the database from growing indefinitely by removing old entries.
 */
export const pruneDatabase = async (): Promise<void> => {
  try {
    // console.log('[Pruning] Starting database maintenance...');

    // 1. Prune Activity Log (keep last 100)
    await sqliteRun(`
            DELETE FROM activity_log 
            WHERE id NOT IN (
                SELECT id FROM activity_log 
                ORDER BY date DESC 
                LIMIT 100
            )
        `);

    // 2. Prune Quiz History (keep last 50)
    await sqliteRun(`
            DELETE FROM quiz_history 
            WHERE id NOT IN (
                SELECT id FROM quiz_history 
                ORDER BY date DESC 
                LIMIT 50
            )
        `);

    // 3. Prune Somtoday Schedule (keep last 500)
    await sqliteRun(`
            DELETE FROM somtoday_schedule 
            WHERE id NOT IN (
                SELECT id FROM somtoday_schedule 
                ORDER BY date DESC 
                LIMIT 500
            )
        `);

    // 4. Prune Somtoday Grades (keep last 200 - usually enough for multiple years)
    await sqliteRun(`
            DELETE FROM somtoday_grades 
            WHERE id NOT IN (
                SELECT id FROM somtoday_grades 
                ORDER BY datum_invoer DESC 
                LIMIT 200
            )
        `);

    // 3. VACUUM is not supported in all sql.js versions/builds,
    // but it would reclaim space if we were using a file-based sqlite.
    // For memory-based, we just rely on smaller export blobs.

    // console.log('[Pruning] Database maintenance complete.');
  } catch (error) {
    console.error("[Pruning] maintenance failed:", error);
  }
};
